import { Resend } from "resend";

const brand = process.env.EMAIL_BRAND_NAME ?? "Acme SaaS";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(apiKey);
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
