import { betterAuth, APIError } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { admin, organization, twoFactor } from "better-auth/plugins";
import { and, count, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  invitation,
  member,
  team,
  user as userTable,
} from "@/db/auth-schema";
import { logAdminAction } from "@/lib/admin";
import { getOrgPlan } from "@/lib/billing";
import { isDefaultMetadata } from "@/lib/workspace";
import {
  sendOrganizationInvitation,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/lib/email";
import { BRAND_NAME } from "@/lib/brand";
import { planName, planLimits } from "@/lib/plans";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  emailAndPassword: {
    enabled: true,
    // Reset tokens live in the verification table (1-hour expiry). Resetting
    // on a Google-only account creates the credential account, which is how
    // social-only users add a password from the Account page.
    sendResetPassword: async ({ user, url }) => {
      try {
        await sendPasswordResetEmail({ to: user.email, url });
      } catch (e) {
        // The token is already valid; an email outage must not fail the
        // request (its generic response must not leak whether it succeeded).
        console.error("Failed to send password reset email:", e);
      }
    },
    revokeSessionsOnPasswordReset: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    // Also used for change-email confirmations: user.email is the address
    // being verified (the new one for change-email requests).
    async sendVerificationEmail({ user, url }) {
      try {
        await sendVerificationEmail({ to: user.email, url });
      } catch (e) {
        // Verification is optional at sign-in; an email outage must not
        // fail the flow. The Account page offers a resend button.
        console.error("Failed to send verification email:", e);
      }
    },
  },
  user: {
    changeEmail: {
      enabled: true,
    },
  },
  databaseHooks: {
    user: {
      create: {
        // The first account to exist owns the fresh deployment, so it gets
        // platform admin. Everyone after that gets the plugin's default role.
        before: async (newUser) => {
          const [row] = await db
            .select({ value: count() })
            .from(userTable);
          if (Number(row?.value ?? 0) > 0) return;
          return { data: { ...newUser, role: "admin" } };
        },
      },
    },
    session: {
      create: {
        // Land the user in the workspace they last used; fall back to their
        // first membership (the plugin default experience) for new members
        // or when that workspace is gone.
        before: async (session) => {
          if (session.activeOrganizationId) return;
          const [user] = await db
            .select({
              lastActiveOrg: userTable.lastActiveOrganizationId,
            })
            .from(userTable)
            .where(eq(userTable.id, session.userId))
            .limit(1);
          const remembered = user?.lastActiveOrg;
          if (remembered) {
            const [membership] = await db
              .select({ organizationId: member.organizationId })
              .from(member)
              .where(
                and(
                  eq(member.userId, session.userId),
                  eq(member.organizationId, remembered)
                )
              )
              .limit(1);
            if (membership) {
              return {
                data: {
                  ...session,
                  activeOrganizationId: membership.organizationId,
                },
              };
            }
          }
          const [first] = await db
            .select({ organizationId: member.organizationId })
            .from(member)
            .where(eq(member.userId, session.userId))
            .limit(1);
          if (first) {
            return {
              data: {
                ...session,
                activeOrganizationId: first.organizationId,
              },
            };
          }
        },
      },
      update: {
        // setActive writes activeOrganizationId onto the session row; keep
        // the user's pointer in step so future sign-ins land there too. The
        // update payload carries no userId — read it from the request's
        // live session instead.
        before: async (data, ctx) => {
          const organizationId = (
            data as { activeOrganizationId?: unknown }
          ).activeOrganizationId;
          if (typeof organizationId !== "string" || !organizationId) return;
          const session = (
            ctx as { context?: { session?: { user?: { id?: string } } } }
          )?.context?.session;
          const userId = session?.user?.id;
          if (!userId) return;
          await db
            .update(userTable)
            .set({ lastActiveOrganizationId: organizationId })
            .where(eq(userTable.id, userId));
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Plan-limit enforcement, centralised here so every entry point
      // (invite from Members page, straight-into-team invite, acceptance
      // link, Teams page) is gated server-side no matter the client.
      const organizationId = (ctx.body as { organizationId?: string })
        ?.organizationId;

      // Seat limit: inviting a new member, or accepting an invitation
      // (its body only carries invitationId — resolve the org from the row).
      if (
        ctx.path === "/organization/invite-member" ||
        ctx.path === "/organization/accept-invitation"
      ) {
        let orgId = organizationId;
        if (ctx.path === "/organization/accept-invitation") {
          const invitationId = (ctx.body as { invitationId?: string })
            ?.invitationId;
          if (!invitationId) return;
          const [row] = await db
            .select({ organizationId: invitation.organizationId })
            .from(invitation)
            .where(eq(invitation.id, invitationId))
            .limit(1);
          orgId = row?.organizationId;
        }
        if (!orgId) return;
        const planId = await getOrgPlan(orgId);
        const limits = planLimits(planId);
        if (limits.seats === null) return;
        const [row] = await db
          .select({ value: count() })
          .from(member)
          .where(eq(member.organizationId, orgId));
        if (Number(row?.value ?? 0) >= limits.seats) {
          throw new APIError("FORBIDDEN", {
            message: `The ${planName(planId)} plan allows up to ${limits.seats} members per workspace. Upgrade the plan to invite more.`,
          });
        }
      }

      // Team limit: creating a team.
      if (ctx.path === "/organization/create-team") {
        if (!organizationId) return;
        const planId = await getOrgPlan(organizationId);
        const limits = planLimits(planId);
        if (limits.teams === null) return;
        const [row] = await db
          .select({ value: count() })
          .from(team)
          .where(eq(team.organizationId, organizationId));
        if (Number(row?.value ?? 0) >= limits.teams) {
          throw new APIError("FORBIDDEN", {
            message: `The ${planName(planId)} plan allows up to ${limits.teams} team${limits.teams === 1 ? "" : "s"} per workspace. Upgrade the plan to add more.`,
          });
        }
      }
    }),
  },
  plugins: [
    admin(),
    twoFactor({
      issuer: BRAND_NAME,
    }),
    organization({
      teams: {
        enabled: true,
        // No automatic team named after the organization — teams are what
        // members create, which keeps the plan team-limit count honest.
        defaultTeam: { enabled: false },
      },
      async sendInvitationEmail(data) {
        const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
        try {
          await sendOrganizationInvitation({
            to: data.email,
            inviterName: data.inviter.user.name,
            orgName: data.organization.name,
            inviteLink: `${baseUrl}/accept-invitation/${data.id}`,
          });
        } catch (e) {
          // The invitation row already exists and can be accepted via its
          // link; an email outage must not fail the invite itself.
          console.error("Failed to send invitation email:", e);
        }
      },
      organizationHooks: {
        // Owners cannot delete their Default Workspace (user-created
        // workspaces delete freely). The platform admin panel deletes via
        // direct DB and intentionally bypasses this guard.
        beforeDeleteOrganization: async ({ organization }) => {
          if (isDefaultMetadata(organization.metadata)) {
            throw new APIError("BAD_REQUEST", {
              message: "The Default Workspace cannot be deleted.",
            });
          }
        },
        // Owner self-deletes from workspace Settings (the admin panel has
        // its own audit path). Same "org-delete" action; the actor column
        // tells the two apart.
        afterDeleteOrganization: async ({ organization, user }) => {
          try {
            await logAdminAction({
              actorUserId: user.id,
              actorEmail: user.email,
              action: "org-delete",
              targetUserId: organization.id,
              targetEmail: organization.name,
            });
          } catch (e) {
            // The deletion already succeeded; never fail it on audit.
            console.error("Failed to log workspace deletion:", e);
          }
        },
      },
    }),
  ],
});
