# TaskDesk

A shared account-management workspace for the team: every client **Account** (name, description, health status, Owner, Account Manager) is visible to all logged-in users, and every **Task** belongs to one account so the account's full work history lives in one place.

## Stack
- **Frontend:** React + Vite (`src/`)
- **Backend:** Vercel serverless functions (`api/`), one file per route
- **Database:** Postgres (Vercel Postgres, Neon, or any Postgres host)
- **Auth:** email + password, bcrypt-hashed, session stored in an httpOnly JWT cookie

## Local development

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — your Postgres connection string
   - `JWT_SECRET` — any long random string
3. Apply the schema (creates `users`, `accounts`, `tasks` tables — safe to re-run):
   ```
   npm run migrate
   ```
4. Run the API and frontend in two terminals:
   ```
   npm run dev:api      # local API server on :3001 mirroring api/ for dev only
   npm run dev          # Vite dev server on :5173, proxies /api to :3001
   ```
5. Open http://localhost:5173, register the first user, then start creating accounts and tasks.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the repo into Vercel (or use your already-connected project).
3. In the Vercel project → **Storage**, add a Postgres database (Vercel Postgres or connect Neon). This sets the DB connection env var automatically.
4. In **Settings → Environment Variables**, make sure these exist for the Production environment:
   - `DATABASE_URL` (or `POSTGRES_URL`, whichever your Postgres integration set — the code checks both)
   - `JWT_SECRET` — set this yourself to a long random string
5. Run the schema once against that same database (from your machine, pointing `.env`'s `DATABASE_URL` at the production connection string):
   ```
   npm run migrate
   ```
6. Push to the branch Vercel watches (usually `main`) — it will build and deploy automatically. `vite build` produces the static frontend; the `api/` folder is deployed as serverless functions with no extra config needed.

## Notes on the data model
- **Accounts are shared** — every logged-in user sees every account. Each account has one required Owner and one required Account Manager, both chosen from registered users (the same person can hold both roles).
- **Tasks belong to exactly one account** and are visible to the whole team, not just their creator — the point is to hold the complete history of work done for that account.
- Deleting an account is blocked while it still has tasks linked to it, to avoid orphaning history.
