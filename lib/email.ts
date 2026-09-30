import { Resend } from "resend";

import { BRAND_INITIAL, BRAND_NAME } from "@/lib/brand";

const brand = process.env.EMAIL_BRAND_NAME ?? BRAND_NAME;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(apiKey);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function appUrl(path: string): string {
  const base =
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Shared branded layout for every outbound email: monochrome card with the
 * wordmark header, one call-to-action pill, and a legal footer. Table-based
 * so it holds up in real mail clients.
 */
function emailHtml({
  heading,
  paragraphs,
  cta,
  footNote,
}: {
  heading: string;
  /** Already-escaped inline HTML fragments, one <p> each. */
  paragraphs: string[];
  cta?: { url: string; label: string };
  footNote?: string;
}): string {
  const muted = "#71717a";
  const border = "#e4e4e7";
  const link = (url: string, label: string) =>
    `<a href="${url}" style="display:inline-block;background:#09090b;color:#ffffff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:14px;">${label}</a>`;
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid ${border};border-radius:16px;">
      <tr><td style="padding:28px 32px 0 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:10px;">
            <div style="width:30px;height:30px;border-radius:9px;background:#09090b;color:#ffffff;font-size:15px;font-weight:600;text-align:center;line-height:30px;">${BRAND_INITIAL}</div>
          </td>
          <td style="font-size:15px;font-weight:600;color:#09090b;">${brand}</td>
        </tr></table>
        <h2 style="margin:24px 0 0 0;font-size:20px;font-weight:600;color:#09090b;">${heading}</h2>
        ${paragraphs
          .map(
            (p) =>
              `<p style="margin:14px 0 0 0;font-size:15px;line-height:1.6;color:#3f3f46;">${p}</p>`
          )
          .join("\n        ")}
        ${
          cta
            ? `<p style="margin:26px 0 0 0;">${link(cta.url, cta.label)}</p>
        <p style="margin:16px 0 0 0;font-size:13px;color:${muted};">If the button doesn't work, open this link:<br /><a href="${cta.url}" style="color:${muted};">${cta.url}</a></p>`
            : ""
        }
        ${
          footNote
            ? `<p style="margin:14px 0 0 0;font-size:13px;color:${muted};">${footNote}</p>`
            : ""
        }
      </td></tr>
      <tr><td style="padding:26px 32px 24px 32px;">
        <div style="border-top:1px solid ${border};padding-top:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:${muted};">
          <a href="${appUrl("/terms")}" style="color:${muted};">Terms</a>
          &nbsp;·&nbsp;
          <a href="${appUrl("/privacy")}" style="color:${muted};">Privacy</a>
          &nbsp;·&nbsp;
          <a href="${appUrl("/refund")}" style="color:${muted};">Refunds</a>
          <br />© ${new Date().getFullYear()} ${brand}
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
  `;
}

async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
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
    subject,
    html,
  });
}

/** Verification link for signup, resend, and change-email confirmations. */
export async function sendVerificationEmail({
  to,
  url,
}: {
  to: string;
  url: string;
}) {
  await sendMail({
    to,
    subject: `Confirm your email for ${brand}`,
    html: emailHtml({
      heading: "Confirm your email",
      paragraphs: [
        `Click the button below to confirm this email address for your ${brand} account.`,
      ],
      cta: { url, label: "Confirm email" },
    }),
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
  await sendMail({
    to,
    subject: `Reset your password for ${brand}`,
    html: emailHtml({
      heading: "Reset your password",
      paragraphs: [
        "Click the button below to choose a new password for your account. The link expires in one hour.",
      ],
      cta: { url, label: "Reset password" },
      footNote: "Didn't request this? You can safely ignore this email.",
    }),
  });
}

/** Invitation email for a new workspace member. */
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
  const inviter = escapeHtml(inviterName);
  const org = escapeHtml(orgName);
  await sendMail({
    to,
    subject: `${inviterName} invited you to join ${orgName} on ${brand}`,
    html: emailHtml({
      heading: `You've been invited to ${org}`,
      paragraphs: [`${inviter} invited you to join <strong>${org}</strong> on ${brand}.`],
      cta: { url: inviteLink, label: "Accept invitation" },
    }),
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
  const org = escapeHtml(orgName);
  const plan = escapeHtml(planLabel);
  await sendMail({
    to,
    subject: `Your ${planLabel} plan for ${orgName} expires soon`,
    html: emailHtml({
      heading: "Your plan expires soon",
      paragraphs: [
        `The <strong>${plan}</strong> subscription for <strong>${org}</strong> ends on ${fmtDate(periodEnd)}.`,
        "Renew anytime to keep the period running — you are never charged automatically.",
      ],
      cta: { url: renewUrl, label: "Renew now" },
    }),
  });
}

/** Subscription-lapsed notice: the paid period has ended without renewal. */
export async function sendSubscriptionExpiredEmail({
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
  const org = escapeHtml(orgName);
  const plan = escapeHtml(planLabel);
  await sendMail({
    to,
    subject: `Your ${planLabel} plan for ${orgName} has expired`,
    html: emailHtml({
      heading: "Subscription expired",
      paragraphs: [
        `The <strong>${plan}</strong> subscription for <strong>${org}</strong> ended on ${fmtDate(periodEnd)} and was not renewed.`,
        "Your workspace is still accessible — renew anytime to get back on the plan.",
      ],
      cta: { url: renewUrl, label: "Renew now" },
    }),
  });
}

/**
 * Payment receipt: sent once per successful activation (webhook, verified
 * redirect return, or an offline payment the platform admin records).
 */
export async function sendPaymentReceiptEmail({
  to,
  orgName,
  planLabel,
  cycleLabel,
  amountRm,
  periodEnd,
  billId,
}: {
  to: string;
  orgName: string;
  planLabel: string;
  cycleLabel: string;
  amountRm: string;
  periodEnd: Date;
  billId: string;
}) {
  const org = escapeHtml(orgName);
  const plan = escapeHtml(planLabel);
  await sendMail({
    to,
    subject: `Receipt for ${planLabel} — ${orgName}`,
    html: emailHtml({
      heading: "Payment received",
      paragraphs: [
        `Thanks! We received <strong>${amountRm}</strong> for the <strong>${plan}</strong> subscription (${cycleLabel}) of <strong>${org}</strong>.`,
        `Your period runs until ${fmtDate(periodEnd)}. Invoice reference: <code>${escapeHtml(billId)}</code>.`,
      ],
      cta: {
        url: appUrl("/app/billing"),
        label: "View invoices",
      },
    }),
  });
}
