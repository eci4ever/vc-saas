import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";
import { count, eq } from "drizzle-orm";

import { db } from "@/db";
import { member, user as userTable } from "@/db/auth-schema";
import { sendOrganizationInvitation } from "@/lib/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
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
