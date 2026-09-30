import type { Metadata } from "next";

import { LegalSection, LegalShell } from "@/components/legal-shell";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Terms of Service — ${BRAND_NAME}`,
  description:
    "The terms that govern your use of this service and its workspaces, accounts, and subscriptions.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="30 September 2026">
      <p className="text-muted-foreground">
        Template copy — review with your own counsel before operating a real
        service. Company name, address, and contact details go here.
      </p>

      <LegalSection title="1. Acceptance of terms">
        <p>
          By creating an account or using the service, you agree to these
          Terms. If you are accepting on behalf of a company or organisation,
          you confirm you have authority to bind it. If you do not agree, do
          not use the service.
        </p>
      </LegalSection>

      <LegalSection title="2. Accounts and workspaces">
        <p>
          You must provide accurate registration information and keep your
          credentials secure. Each account gets a Default Workspace and may
          create additional workspaces. You are responsible for activity that
          happens under your account and for the members you invite into your
          workspaces.
        </p>
        <p>
          You may delete your account at any time from the Account page.
          Deleting your account permanently removes the workspaces you own,
          their members, and their billing records.
        </p>
      </LegalSection>

      <LegalSection title="3. Acceptable use">
        <p>You agree not to:</p>
        <ul className="flex flex-col gap-1">
          <li>use the service for any unlawful purpose or to infringe others&apos; rights;</li>
          <li>attempt to gain unauthorised access to the service, other accounts, or related systems;</li>
          <li>probe, scan, or test the vulnerability of the service without written permission;</li>
          <li>interfere with or disrupt the integrity or performance of the service.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Subscriptions and billing">
        <p>
          Paid plans are billed per workspace in Malaysian Ringgit through
          online banking (FPX) via our payment gateway, Billplz. Plan prices,
          cycles, and workspace limits are shown on the pricing page before
          you subscribe. Subscriptions do not auto-renew and you are never
          charged automatically — a renewal is a new payment you initiate.
        </p>
        <p>
          Workspace limits (such as member seats and teams) are enforced by
          plan. Upgrading takes effect immediately for the period you pay for;
          downgrades and cancellations take effect at the end of the paid
          period.
        </p>
      </LegalSection>

      <LegalSection title="5. Availability and changes">
        <p>
          We aim for high availability but do not guarantee uninterrupted
          service. We may change or discontinue features with reasonable
          notice, and we may suspend accounts that violate these Terms.
        </p>
      </LegalSection>

      <LegalSection title="6. Disclaimer and limitation of liability">
        <p>
          The service is provided &ldquo;as is&rdquo; without warranties of any kind. To
          the maximum extent permitted by law, our total liability arising out
          of or in connection with the service is limited to the amount you
          paid us in the twelve months preceding the claim.
        </p>
      </LegalSection>

      <LegalSection title="7. Termination">
        <p>
          You may stop using the service at any time. We may terminate or
          suspend your access for breach of these Terms, with notice where
          practicable.
        </p>
      </LegalSection>

      <LegalSection title="8. Governing law">
        <p>
          These Terms are governed by the laws of Malaysia. Disputes will be
          resolved in the courts of Malaysia.
        </p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <p>
          Questions about these Terms: <code>legal@yourdomain.com</code> —
          replace with your own contact address.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
