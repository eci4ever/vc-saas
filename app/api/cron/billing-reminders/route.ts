import { and, eq, gte, lte, isNull, or, lt } from "drizzle-orm";

import { db } from "@/db";
import { member, organization, user } from "@/db/auth-schema";
import { subscriptions } from "@/db/billing-schema";
import { sendSubscriptionReminderEmail } from "@/lib/email";
import { planName } from "@/lib/plans";

const REMINDER_DAYS = 7;

/**
 * Daily cron: remind owners whose paid subscription expires within
 * REMINDER_DAYS, at most once per period (reminder_sent_at resets on every
 * activation because a new period writes a fresh row state).
 *
 * Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`; in
 * production the bearer is required, locally it is optional.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Forbidden." }, { status: 403 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "CRON_SECRET is not configured." }, { status: 403 });
  }

  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + REMINDER_DAYS);

  const due = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, "active"),
        gte(subscriptions.periodEnd, now),
        lte(subscriptions.periodEnd, horizon),
        or(
          isNull(subscriptions.reminderSentAt),
          lt(subscriptions.reminderSentAt, now)
        )
      )
    );

  const appUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  let sent = 0;
  const failures: string[] = [];

  for (const sub of due) {
    const [org] = await db
      .select({ id: organization.id, name: organization.name })
      .from(organization)
      .where(eq(organization.id, sub.organizationId))
      .limit(1);
    if (!org) continue;
    const [owner] = await db
      .select({ email: user.email, name: user.name })
      .from(member)
      .innerJoin(user, eq(user.id, member.userId))
      .where(
        and(eq(member.organizationId, sub.organizationId), eq(member.role, "owner"))
      )
      .limit(1);
    if (!owner) continue;
    try {
      await sendSubscriptionReminderEmail({
        to: owner.email,
        orgName: org.name,
        planLabel: `${planName(sub.planId)} (${sub.cycle})`,
        periodEnd: sub.periodEnd,
        renewUrl: `${appUrl}/app/billing`,
      });
      sent += 1;
    } catch (e) {
      console.error("Reminder email failed:", e);
      failures.push(owner.email);
      continue;
    }
    await db
      .update(subscriptions)
      .set({ reminderSentAt: new Date() })
      .where(eq(subscriptions.id, sub.id));
  }

  return Response.json({ ok: true, due: due.length, sent, failures });
}
