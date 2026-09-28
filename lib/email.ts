import { Resend } from "resend";

import { BRAND_NAME } from "@/lib/brand";

const brand = process.env.EMAIL_BRAND_NAME ?? BRAND_NAME;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(apiKey);
}

/** Verification link for signup, resend, and change-email confirmations. */
export async function sendVerificationEmail({
  to,
  url,
}: {
  to: string;
  url: string;
}) {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not set");
  }
  const replyTo = process.env.EMAIL_REPLY_TO || undefined;
  await getResend().emails.send({
    from,
    to,
    ...(replyTo ? { replyTo } : {}),
    subject: `Confirm your email for ${brand}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Confirm your email</h2>
        <p>Click the button below to confirm this email address for your ${brand} account.</p>
        <p>
          <a href="${url}" style="display: inline-block; background: #09090b; color: #fff; padding: 12px 24px; border-radius: 999px; text-decoration: none;">
            Confirm email
          </a>
        </p>
        <p style="color: #71717a; font-size: 14px;">If the button doesn't work, open this link: ${url}</p>
      </div>
    `,
  });
}

/** Password-reset link for the forgot-password flow. */
export async function sendPasswordResetEmail({
  to,
  url,
}: {
  to: string;
  url: string;
}) {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not set");
  }
  const replyTo = process.env.EMAIL_REPLY_TO || undefined;
  await getResend().emails.send({
    from,
    to,
    ...(replyTo ? { replyTo } : {}),
    subject: `Reset your password for ${brand}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Click the button below to choose a new password for your ${brand} account. The link expires in one hour.</p>
        <p>
          <a href="${url}" style="display: inline-block; background: #09090b; color: #fff; padding: 12px 24px; border-radius: 999px; text-decoration: none;">
            Reset password
          </a>
        </p>
        <p style="color: #71717a; font-size: 14px;">If the button doesn't work, open this link: ${url}</p>
        <p style="color: #71717a; font-size: 14px;">Didn't request this? You can safely ignore this email.</p>
      </div>
    `,
  });
}

/** Subscription expiry reminder for a workspace owner. */
export async function sendSubscriptionReminderEmail({
  to,
  orgName,
  planLabel,
  periodEnd,
  renewUrl,
}: {
  to: string;
  orgName: string;
  planLabel: string;
  periodEnd: Date;
  renewUrl: string;
}) {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not set");
  }
  const replyTo = process.env.EMAIL_REPLY_TO || undefined;
  await getResend().emails.send({
    from,
    to,
    ...(replyTo ? { replyTo } : {}),
    subject: `Your ${planLabel} plan for ${orgName} expires soon`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Your plan expires soon</h2>
        <p>The <strong>${planLabel}</strong> subscription for <strong>${orgName}</strong> ends on ${periodEnd.toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}.</p>
        <p>Renew anytime to keep the period running — you are never charged automatically.</p>
        <p>
          <a href="${renewUrl}" style="display: inline-block; background: #09090b; color: #fff; padding: 12px 24px; border-radius: 999px; text-decoration: none;">
            Renew now
          </a>
        </p>
        <p style="color: #71717a; font-size: 14px;">If the button doesn't work, open this link: ${renewUrl}</p>
      </div>
    `,
  });
}

export async function sendOrganizationInvitation({
  to,
  inviterName,
  orgName,
  inviteLink,
}: {
  to: string;
  inviterName: string;
  orgName: string;
  inviteLink: string;
}) {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not set");
  }
  const replyTo = process.env.EMAIL_REPLY_TO || undefined;
  await getResend().emails.send({
    from,
    to,
    ...(replyTo ? { replyTo } : {}),
    subject: `${inviterName} invited you to join ${orgName} on ${brand}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>You've been invited to ${orgName}</h2>
        <p>${inviterName} invited you to join <strong>${orgName}</strong> on ${brand}.</p>
        <p>
          <a href="${inviteLink}" style="display: inline-block; background: #09090b; color: #fff; padding: 12px 24px; border-radius: 999px; text-decoration: none;">
            Accept invitation
          </a>
        </p>
        <p style="color: #71717a; font-size: 14px;">If the button doesn't work, open this link: ${inviteLink}</p>
      </div>
    `,
  });
}
