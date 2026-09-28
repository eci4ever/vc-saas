import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization, twoFactor } from "better-auth/plugins";
import { and, count, eq } from "drizzle-orm";

import { db } from "@/db";
import { member, user as userTable } from "@/db/auth-schema";
import {
  sendOrganizationInvitation,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/lib/email";
import { BRAND_NAME } from "@/lib/brand";

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
  plugins: [
    admin(),
    twoFactor({
      issuer: BRAND_NAME,
    }),
    organization({
      teams: { enabled: true },
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
    }),
  ],
});
