# Nimfi SaaS Starter

A multi-tenant SaaS starter: authentication, workspaces, teams, subscriptions with Billplz (FPX), and a platform admin panel — wired end-to-end with Next.js, better-auth, Drizzle, and Neon Postgres.

Clone it, brand it, charge for it.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Styling | Tailwind CSS v4, shadcn/ui (base-nova), lucide icons |
| Auth | better-auth — email/password, Google OAuth, TOTP 2FA |
| Database | Neon Postgres + Drizzle ORM |
| Email | Resend |
| Payments | Billplz API v3 (FPX) |
| Hosting | Vercel |

## Features

**Auth** — email/password with verification emails, Google sign-in, forgot/reset password, two-factor (TOTP + backup codes), session management on the Account page. Google-first users get a personal workspace automatically; the app remembers the last workspace you used and signs you back into it.

**Workspaces** — every user owns a workspace and can be a member of others. Roles: `owner` (billing, settings, member management), `admin` (management), `member`. Email invitations (direct or straight into a team), teams with rosters, workspace switcher, owner guards (no self-removal, last-owner protection, confirmation dialogs).

**Billing** — plans are defined in `lib/plans.ts` (Free RM0, Starter RM29, Pro RM79; quarterly −10%, yearly −20%). Owners subscribe through Billplz FPX: bill created → payment page → verified server-side on return AND via signed webhook (idempotent — both can fire). Manual renewal: pay again to extend; expiry is derived from the period end, so a lapsed workspace is "Expired" without any cron. Platform admins can assign plans for offline payments, renew, and cancel — everything lands in the audit log. A daily Vercel Cron emails owners 7 days before expiry.

**Admin panel** — the first account to sign up on a fresh database becomes the platform admin (role `admin`). They get Users (ban, role changes, impersonation, set password, revoke sessions, delete), Organizations (rename, delete), Plans (catalog), Subscriptions (manage), and a full Audit Log.

**UI** — monochrome design system, sidebar with role-tiered navigation, single-word page headers, toasts for feedback, confirmation dialogs for destructive actions, mobile-responsive (sidebar collapses to a sheet).

## Quick start

1. **Install and configure**

   ```bash
   npm install
   cp .env.example .env.local   # fill in the values
   ```

   - `DATABASE_URL` — create a database at [neon.tech](https://neon.tech)
   - `BETTER_AUTH_SECRET` — any long random string (`openssl rand -hex 32`)
   - `BETTER_AUTH_URL` — `http://localhost:3000` for local dev
   - Email and Billplz keys can be left empty for a first look (the app degrades gracefully: emails and payment redirects fail loudly but auth still works)

2. **Create the schema**

   ```bash
   npx drizzle-kit push
   ```

3. **Run**

   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 and sign up — **the first signup becomes the platform admin**. Subsequent signups are normal users; promote them from the admin Users page if needed.

## External service setup

### Google OAuth (optional but recommended)

In [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth client (Web application):

- **Authorized redirect URIs:**
  - `http://localhost:3000/api/auth/callback/google`
  - `http://127.0.0.1:3000/api/auth/callback/google`
  - `https://YOUR-PROD-DOMAIN/api/auth/callback/google`
- **Authorized JavaScript origins:** the same three domains without the path.

Put the client ID/secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

### Billplz

1. Create an account — sandbox at [billplz-sandbox.com](https://www.billplz-sandbox.com), production at [billplz.com](https://www.billplz.com).
2. Create a **collection** → copy its ID into `BILLPLZ_COLLECTION_ID`.
3. Copy the **API secret key** into `BILLPLZ_SECRET_KEY` and the **X-Signature key** into `BILLPLZ_X_SIGNATURE_KEY`.
4. Set `BILLPLZ_MODE` to `sandbox` (uses `www.billplz-sandbox.com`) or `production` (`www.billplz.com`). Test payment with the built-in simulator: any plan → Pay now → *Billplz Simulator* → *Successful payment*.

No webhook URL needs to be registered with Billplz — the app passes its own `callback_url` when creating each bill, so sandbox and production work without extra provider configuration.

### Resend

Create an API key, verify your sending domain, and set `RESEND_API_KEY` + `EMAIL_FROM`. On localhost, emails fail gracefully (logged to the server console) — verification links are not required to sign in.

## Deploying (Vercel)

```bash
vercel link
vercel env add DATABASE_URL production        # repeat for every .env.local key
vercel --prod --yes
```

- Set `BETTER_AUTH_URL` to the production domain — it drives OAuth redirects and email links.
- `CRON_SECRET` protects the expiry-reminder endpoint; Vercel Cron (configured in `vercel.json`, daily 01:00 UTC) sends it automatically as a bearer token.
- Run `npx drizzle-kit push` once against the production `DATABASE_URL` before the first signup.

## Branding it

Everything user-facing hangs off `lib/brand.ts` (`BRAND_NAME`, `BRAND_INITIAL`) and `components/brand-mark.tsx`. Plans and prices live in `lib/plans.ts`. Email templates are in `lib/email.ts`. Page titles are single words rendered by `components/page-header.tsx`.

## Project structure

```
app/
  page.tsx              Landing page (hero, pricing, status indicators)
  login/ signup/        Auth pages (+ forgot-password, reset-password)
  app/                  The signed-in application — all routes /app/*
    page.tsx            Dashboard (home)
    manage/             Workspace management: Overview, Members, Invitations, Teams
    billing/            Plans, subscribe/cancel, invoices (owner actions)
    settings/           Workspace settings (manager-only)
    account/            Personal account: profile, email, password, sessions, 2FA
    admin/              Platform admin: Users, Organizations, Plans, Subscriptions, Audit
  api/
    billing/            subscribe / verify / cancel / webhook (Billplz)
    cron/               billing-reminders (Vercel Cron, CRON_SECRET-guarded)
    admin/              admin user/organization/billing actions (audit-logged)
db/                     Drizzle schemas (auth, admin audit, billing)
drizzle/                SQL migrations, in order (0000–0005)
lib/                    auth, plans, billplz client, guards, access matrix, email
```

Navigation and guards share one source of truth: `lib/access.ts` defines who sees each sidebar entry, and the route layouts enforce the same predicates server-side.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build (also type-checks) |
| `npm run lint` | ESLint |
| `npx drizzle-kit push` | Sync schema to the database |
