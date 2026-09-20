import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const adminAuditLog = pgTable("admin_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  actorUserId: text("actor_user_id").notNull(),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(),
  targetUserId: text("target_user_id").notNull(),
  targetEmail: text("target_email").notNull(),
  oldRole: text("old_role"),
  newRole: text("new_role"),
  reason: text("reason"),
});
