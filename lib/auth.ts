import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization, twoFactor } from "better-auth/plugins";
import { count, eq } from "drizzle-orm";

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
        // Default to the user's first workspace so the app always has
        // an active organization after sign in.
        before: async (session) => {
          if (session.activeOrganizationId) return;
          const [membership] = await db
            .select({ organizationId: member.organizationId })
            .from(member)
            .where(eq(member.userId, session.userId))
            .limit(1);
          if (membership) {
            return {
              data: {
                ...session,
                activeOrganizationId: membership.organizationId,
              },
            };
          }
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
