import { and, eq, gte, lte, isNull, or, lt } from "drizzle-orm";

import { db } from "@/db";
import { member, organization, user } from "@/db/auth-schema";
import { subscriptions } from "@/db/billing-schema";
import { sendSubscriptionExpiredEmail, sendSubscriptionReminderEmail } from "@/lib/email";
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

  // Lapsed subscriptions (period ended, never renewed): one expiry notice
  // per lapse. The row stays "active" until the owner renews or cancels —
  // expiry is derived, so this flag is the only once-per-lapse guard. The
  // notice re-fires only when the flag predates the current period end
  // (renewed once, lapsed again).
  const expired = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, "active"),
        lt(subscriptions.periodEnd, now),
        or(
          isNull(subscriptions.expiredNotifiedAt),
          lt(subscriptions.expiredNotifiedAt, subscriptions.periodEnd)
        )
      )
    );

  const appUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  let sent = 0;
  let expiredSent = 0;
  const failures: string[] = [];

  async function orgOwner(organizationId: string) {
    const [org] = await db
      .select({ id: organization.id, name: organization.name })
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1);
    if (!org) return null;
    const [owner] = await db
      .select({ email: user.email, name: user.name })
      .from(member)
      .innerJoin(user, eq(user.id, member.userId))
      .where(
        and(eq(member.organizationId, organizationId), eq(member.role, "owner"))
      )
      .limit(1);
    return owner ? { ...owner, orgName: org.name } : null;
  }

  for (const sub of due) {
    const owner = await orgOwner(sub.organizationId);
    if (!owner) continue;
    try {
      await sendSubscriptionReminderEmail({
        to: owner.email,
        orgName: owner.orgName,
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

  for (const sub of expired) {
    const owner = await orgOwner(sub.organizationId);
    if (!owner) continue;
    try {
      await sendSubscriptionExpiredEmail({
        to: owner.email,
        orgName: owner.orgName,
        planLabel: `${planName(sub.planId)} (${sub.cycle})`,
        periodEnd: sub.periodEnd,
        renewUrl: `${appUrl}/app/billing`,
      });
      expiredSent += 1;
    } catch (e) {
      console.error("Expiry email failed:", e);
      failures.push(owner.email);
      continue;
    }
    await db
      .update(subscriptions)
      .set({ expiredNotifiedAt: new Date() })
      .where(eq(subscriptions.id, sub.id));
  }

  return Response.json({
    ok: true,
    due: due.length,
    sent,
    expired: expired.length,
    expiredSent,
    failures,
  });
}
