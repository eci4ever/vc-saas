import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { organization } from "./auth-schema";

/** One subscription per organization (Free = no row). */
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  planId: text("plan_id").notNull(),
  cycle: text("cycle").notNull(),
  // active | expired | canceled — expiry itself is derived from period_end
  // at read time, so no cron can strand a paid workspace in the wrong state.
  status: text("status").notNull().default("active"),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  canceledAt: timestamp("canceled_at"),
  // Set when the expiry reminder email for the current period was sent, so
  // the daily cron reminds at most once per period.
  reminderSentAt: timestamp("reminder_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

/** One Billplz bill per payment attempt; also serves as the invoice list. */
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  billId: text("bill_id").notNull().unique(),
  planId: text("plan_id").notNull(),
  cycle: text("cycle").notNull(),
  // MYR sen, matching Billplz amounts exactly.
  amount: integer("amount").notNull(),
  // due | paid | failed
  status: text("status").notNull().default("due"),
  billUrl: text("bill_url").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
