import type { Metadata } from "next";

import { LegalSection, LegalShell } from "@/components/legal-shell";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Refund Policy — ${BRAND_NAME}`,
  description:
    "When subscriptions paid through FPX are refundable, and how cancellations work.",
};

export default function RefundPage() {
  return (
    <LegalShell title="Refund Policy" updated="30 September 2026">
      <p className="text-muted-foreground">
        Template copy — review with your own counsel (and Billplz&apos;s merchant
        requirements) before operating a real service.
      </p>

      <LegalSection title="1. Subscriptions are cancellable anytime">
        <p>
          Paid plans are sold per workspace for a fixed period (monthly,
          quarterly, or yearly) and do not auto-renew — you are only charged
          when you yourself make a payment. Cancelling stops the plan at the
          end of the period you already paid for; no further action or
          payment is needed.
        </p>
      </LegalSection>

      <LegalSection title="2. No prorated refunds">
        <p>
          Because you only ever pay for a period you chose, fees already paid
          are non-refundable when you cancel, downgrade, or stop using the
          service mid-period. Your workspace keeps its paid plan until the
          end of that period.
        </p>
      </LegalSection>

      <LegalSection title="3. Billing errors and duplicate payments">
        <p>
          If you were charged twice for the same workspace period, or charged
          an amount that does not match the plan and cycle you selected,
          contact us within 30 days of the payment and we will refund the
          erroneous charge in full to the account it was paid from.
        </p>
      </LegalSection>

      <LegalSection title="4. Service failure">
        <p>
          If the service was materially unavailable for the majority of a
          period you paid for, contact us — we will work out a fair remedy,
          which may be a refund of the affected period or an extension of
          equivalent length.
        </p>
      </LegalSection>

      <LegalSection title="5. How refunds are paid">
        <p>
          Approved refunds are returned through the original payment method.
          FPX payments are refunded to the originating bank account; allow 5
          to 14 working days for the banks to process.
        </p>
      </LegalSection>

      <LegalSection title="6. Contact">
        <p>
          Refund requests: <code>billing@yourdomain.com</code> — include the
          workspace name, payment date, and invoice reference from your
          receipt email. Replace with your own contact address.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
