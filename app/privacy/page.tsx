import type { Metadata } from "next";

import { LegalSection, LegalShell } from "@/components/legal-shell";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Privacy Policy — ${BRAND_NAME}`,
  description:
    "What personal data this service collects, why, and how it is handled.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="30 September 2026">
      <p className="text-muted-foreground">
        Template copy — review with your own counsel and align it with the
        Personal Data Protection Act 2010 (Malaysia) or your local equivalent
        before operating a real service.
      </p>

      <LegalSection title="1. What we collect">
        <ul className="flex flex-col gap-1">
          <li><strong>Account data:</strong> name, email address, password (hashed), profile photo if you set one, and sign-in provider (email or Google).</li>
          <li><strong>Workspace data:</strong> workspace names, membership and roles, teams, and the content you create in the service.</li>
          <li><strong>Billing data:</strong> workspace subscription plan and period, and payment records returned by our payment gateway. We never see or store your online-banking credentials.</li>
          <li><strong>Technical data:</strong> session records (IP address, browser user-agent, timestamps) used to show signed-in devices and secure your account.</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. How we use it">
        <p>
          We use your data to operate the service: authenticate you, remember
          your active workspace, deliver transactional email (verification,
          invitations, password resets, payment receipts, subscription
          reminders), enforce plan limits, process payments, and provide
          support and audit trails for workspace administrators.
        </p>
        <p>
          We do not sell personal data and we do not use it for third-party
          advertising.
        </p>
      </LegalSection>

      <LegalSection title="3. Third-party processors">
        <ul className="flex flex-col gap-1">
          <li><strong>Resend</strong> — delivers transactional email to your address.</li>
          <li><strong>Billplz</strong> — processes FPX payments and returns payment status to us.</li>
          <li><strong>Google</strong> — identity provider when you choose &ldquo;Continue with Google&rdquo;; we receive your name, email, and avatar.</li>
          <li><strong>Hosting and database providers</strong> — store application data on our behalf.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Cookies and sessions">
        <p>
          We use a small set of strictly necessary cookies to keep you signed
          in and secure (session and two-factor cookies, CSRF protection). We
          do not use advertising or tracking cookies.
        </p>
      </LegalSection>

      <LegalSection title="5. Retention and deletion">
        <p>
          You can delete your account from the Account page. Deleting your
          account removes your profile, memberships, and the workspaces you
          own (including their billing records) from the live database. Some
          records may persist in encrypted backups for a limited period
          before expiring.
        </p>
      </LegalSection>

      <LegalSection title="6. Security">
        <p>
          Passwords are stored as salted hashes, sessions can be reviewed and
          revoked per device, and two-factor authentication is available for
          every account. Administrative actions on your account are recorded
          in an audit log.
        </p>
      </LegalSection>

      <LegalSection title="7. Your rights and contact">
        <p>
          You may access, correct, or delete your personal data from within
          the product, or by contacting us at <code>privacy@yourdomain.com</code>{" "}
          — replace with your own contact address.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
