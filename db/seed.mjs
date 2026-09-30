/**
 * Demo data seeder: `npm run db:seed`.
 *
 * Creates a platform admin, a workspace owner, a member, one workspace with
 * a team, and an active Starter (yearly) subscription with a paid invoice —
 * enough for every admin page and the member experience to look alive on a
 * fresh clone.
 *
 * Idempotent: if the demo owner already exists, nothing is inserted.
 * Additive only — never touches existing rows.
 *
 * Must run in plain .mjs (no tsx in the template), hashing the password
 * with better-auth's own scrypt so credential sign-ins work.
 */
import { Client } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";

const PASSWORD = process.env.SEED_PASSWORD ?? "Demo@1234!";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "demo-admin@nimfi.test";
const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? "demo-owner@nimfi.test";
const MEMBER_EMAIL = process.env.SEED_MEMBER_EMAIL ?? "demo-member@nimfi.test";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set — run with: npm run db:seed");
  process.exit(1);
}

const client = new Client(process.env.DATABASE_URL);
await client.connect();

async function userExists(email) {
  const { rows } = await client.query(
    "select id from \"user\" where email = $1 limit 1",
    [email]
  );
  return rows[0]?.id ?? null;
}

const existingOwner = await userExists(OWNER_EMAIL);
if (existingOwner) {
  console.log(
    `Seed skipped: ${OWNER_EMAIL} already exists. Delete those rows first if you want a fresh seed.`
  );
  await client.end();
  process.exit(0);
}

const passwordHash = await hashPassword(PASSWORD);

async function createUser({ name, email, role }) {
  const id = randomUUID();
  await client.query(
    `insert into "user" (id, name, email, email_verified, role, created_at, updated_at)
     values ($1, $2, $3, true, $4, now(), now())`,
    [id, name, email, role ?? null]
  );
  await client.query(
    `insert into account (id, user_id, account_id, provider_id, password, created_at, updated_at)
     values ($1, $2, $3, 'credential', $4, now(), now())`,
    [randomUUID(), id, id, passwordHash]
  );
  return id;
}

async function createMember({ userId, orgId, role }) {
  await client.query(
    `insert into member (id, organization_id, user_id, role, created_at)
     values ($1, $2, $3, $4, now())`,
    [randomUUID(), orgId, userId, role]
  );
}

// Platform admin — owns no workspace.
await createUser({ name: "Demo Admin", email: ADMIN_EMAIL, role: "admin" });
console.log(`✓ platform admin   ${ADMIN_EMAIL}`);

// Workspace + owner + member.
const owner = await createUser({ name: "Demo Owner", email: OWNER_EMAIL });
const orgId = randomUUID();
await client.query(
  `insert into organization (id, name, slug, created_at)
   values ($1, 'Demo Workspace', 'demo-workspace', now())`,
  [orgId]
);
await createMember({ userId: owner, orgId, role: "owner" });
console.log(`✓ workspace owner  ${OWNER_EMAIL} → Demo Workspace (owner)`);

const member = await createUser({ name: "Demo Member", email: MEMBER_EMAIL });
await createMember({ userId: member, orgId, role: "member" });
console.log(`✓ workspace member ${MEMBER_EMAIL}`);

await client.query(
  `insert into team (id, name, organization_id, created_at)
   values ($1, 'Core', $2, now())`,
  [randomUUID(), orgId]
);
console.log("✓ team             Core");

// Land the owner in the workspace on next sign-in.
await client.query(
  `update "user" set last_active_organization_id = $1 where id = $2`,
  [orgId, owner]
);

// Active Starter yearly subscription + one paid offline invoice, so the
// admin Subscriptions page and the Billing page both show live data.
const periodStart = new Date();
const periodEnd = new Date(periodStart);
periodEnd.setFullYear(periodEnd.getFullYear() + 1);
await client.query(
  `insert into subscriptions (organization_id, plan_id, cycle, status, period_start, period_end, created_at, updated_at)
   values ($1, 'starter', 'yearly', 'active', $2, $3, now(), now())`,
  [orgId, periodStart, periodEnd]
);
await client.query(
  `insert into payments (id, organization_id, user_id, bill_id, plan_id, cycle, amount, status, method, bill_url, paid_at, created_at)
   values ($1, $2, $3, $4, 'starter', 'yearly', 27840, 'paid', 'offline', '', now(), now())`,
  [randomUUID(), orgId, owner, `seed-${randomUUID()}`]
);
console.log("✓ subscription     Starter yearly, active for 12 months");

console.log(
  `\nDone. Sign in with any of these (password: ${PASSWORD}):\n` +
    `  ${ADMIN_EMAIL}  (platform admin)\n` +
    `  ${OWNER_EMAIL}  (workspace owner)\n` +
    `  ${MEMBER_EMAIL} (member)`
);
await client.end();
