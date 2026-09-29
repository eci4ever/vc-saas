ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "method" text NOT NULL DEFAULT 'billplz';--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "canceled_at" timestamp;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "expired_notified_at" timestamp;
