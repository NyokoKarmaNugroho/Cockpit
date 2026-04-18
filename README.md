# Cockpit

Cockpit is a blockchain intelligence workspace for analysts, investigators, and compliance teams.

The repo ships a **Vite + React** marketing site and **dashboard** (`/build-dashboard`) backed by a **Node/TypeScript API** under `backend/`. Analysis runs use a LangGraph-style agent (`backend/src/agent/`, `backend/src/langgraph/`). Product scope and API sketches live in [`PRD.md`](PRD.md).

## Current status

- **Frontend**: Vite 6, React 19, React Router 7, Tailwind — dashboard composer talks to the backend over HTTP + SSE.
- **Backend**: Hono server (`backend/src/index.ts`) — health, wallet auth (challenge/verify + cookie session), dashboard bootstrap, persisted analyses when Supabase is configured, Jupiter Ultra proxy, analysis streaming.
- **Data**: Optional **Supabase/Postgres** for users, workspaces, analyses, and stream events (service role on the server only). Without Supabase credentials, analyses stay **in-memory** (lost on process restart).

## What is in this repo

### Frontend routes

- Marketing: `/`, `/blog`, `/pricing`, `/explore-data`, `/methodology/risk-exposure`
- Dashboard: `/build-dashboard` and nested routes (`search`, `investigations`, `studio`, `history`, `cases`, `api`, `settings`)
- **Connect wallet** (Phantom) in the dashboard header is optional; unsigned users use the default workspace key `cockpit-default-workspace` against the anonymous bootstrap workspace when the DB is enabled.

### Backend API (summary)

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Liveness + optional database probe (`database` in JSON) |
| `POST /auth/challenge` | Start wallet sign-in (Solana address) |
| `POST /auth/verify` | Verify signature, set session cookie |
| `POST /auth/logout` | Clear session |
| `GET /me` | Current user (requires session) |
| `GET /dashboard/bootstrap` | User, workspace, flags, recent analyses |
| `POST /analyses`, `GET /analyses`, `GET /analyses/:id`, `GET /analyses/:id/stream` | Analysis runs + SSE |
| `GET /ultra/v1/order?...` | Jupiter Ultra proxy (`JUPITER_ULTRA_API_KEY` on server) |

## Tech stack

- **Frontend**: Vite 6, React 19, TypeScript, React Router 7, Tailwind, XYFlow / React Flow
- **Backend**: Hono, `@hono/node-server`, LangChain / LangGraph / Deep Agents, Supabase JS (optional persistence)

## Repository layout

```text
.
├── backend/
│   ├── src/
│   │   ├── agent/           # analysis runner (e.g. runAnalysis.ts)
│   │   ├── langgraph/       # supervisor graph
│   │   ├── services/        # analysis store, auth, DB health
│   │   └── index.ts         # HTTP API
│   ├── supabase/migrations/ # Postgres schema
│   └── dataset/             # local datasets / research assets
├── frontend/
│   └── src/
├── PRD.md
└── README.md
```

## Getting started

### Prerequisites

- Node.js 20+
- npm

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Default dev URL: `http://localhost:5173`.

Set `VITE_API_BASE_URL` to your API origin in production (no trailing slash). The app sends `credentials: "include"` so session cookies work cross-origin when `CORS_ORIGIN` on the API lists your site origin.

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Default API: `http://localhost:8787`.

For **persisted** analyses and auth-linked users, set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and apply migrations under `backend/supabase/migrations/`. An anonymous user + default workspace (`external_key` = `cockpit-default-workspace`) are created on first use when Supabase is enabled. Without Supabase env vars, analyses stay in-memory; wallet auth still works with the in-memory user store.

#### Database migrations (API / DB)

Apply in **filename order** (timestamp prefix):

| File | Purpose |
|------|---------|
| `20260417040200_cockpit_initial_schema.sql` | Core: users, workspaces, analyses, events, artifacts |
| `20260417060238_rag_find_case_law_vectors.sql` | `vector` extension, RAG chunks |
| `20260417120000_reference_datasets_icij_solana.sql` | ICIJ + `solana_programs` |
| `20260418120000_workspace_external_key_analysis_title.sql` | `workspaces.external_key`, `analyses.title` |
| `20260418130000_cases.sql` | `cases`, `case_analysis_links` |

**Local Supabase (recommended for day-to-day dev):** requires [Docker](https://docs.docker.com/get-docker/). From `backend/`:

1. `npm run db:start` — starts the local stack (API on **http://127.0.0.1:54321**).
2. `npm run db:status` — copy the **service_role** JWT into `backend/.env` as `SUPABASE_SERVICE_ROLE_KEY` (with `SUPABASE_URL=http://127.0.0.1:54321`).
3. `npm run db:push:local` — applies `supabase/migrations/` to the local DB, **or** `npm run db:reset` for a clean database + migrations.

Use `npm run db:stop` when finished. Studio is usually at **http://127.0.0.1:54323**.

If Docker reports a port already in use (often **54322** when another Supabase stack is running), either run `supabase stop --project-id <name>` for that stack, or change `[db] port` / `shadow_port` in `backend/supabase/config.toml` (Cockpit defaults Postgres host to **54332** to reduce clashes).

**Option A — Cloud Supabase CLI:** from `backend/`: `npx supabase login`, then `npx supabase link --project-ref <YOUR_PROJECT_REF>` (use the **database password** from Dashboard → **Project Settings → Database** if prompted), then `npm run db:push`.

**Option B — Dashboard:** Supabase → **SQL Editor** → run each file’s contents in the same order (for partial DBs, skip files already applied or use the `IF NOT EXISTS` / idempotent statements in newer files only where safe).

If the API returns `column ... does not exist`, the matching migration has not been applied to that project yet.

##### Troubleshooting `db push`: “Remote migration versions not found in local migrations directory”

That means **Postgres already has rows** in `supabase_migrations.schema_migrations` whose **version** values **do not match** any filename in `backend/supabase/migrations/` (common if migrations were applied earlier via **SQL Editor**, **MCP**, or another machine using different timestamps).

1. **Inspect** (Dashboard → **SQL Editor**):

   ```sql
   select version, name
   from supabase_migrations.schema_migrations
   order by version;
   ```

2. **Drop orphan history rows** — for every `version` that does **not** correspond to a local file (e.g. local files start with `20260417040200`, …), run from `backend/` after `supabase link`:

   ```bash
   npx supabase migration repair --status reverted <VERSION>
   ```

   Use the exact version strings from step 1 (the CLI error message may list examples).

3. **If tables already exist** from those old runs, `db push` may then fail with “already exists”. In that case, **mark each local migration as applied** without re-executing SQL (only when the schema already matches the file):

   ```bash
   npx supabase migration repair --status applied 20260417040200
   npx supabase migration repair --status applied 20260417060238
   npx supabase migration repair --status applied 20260417120000
   npx supabase migration repair --status applied 20260418120000
   npx supabase migration repair --status applied 20260418130000
   ```

4. Run `npm run db:push` again. Use `npm run db:migration:list` to compare local vs remote.

If history and schema are badly out of sync, Supabase may suggest `supabase db pull` — treat that as an advanced reset; prefer the repair steps above first.

### Environment variables (short list)

**Frontend (`frontend/.env`)**

- `VITE_SITE_URL` — canonical public URL
- `VITE_API_BASE_URL` — Cockpit API base URL
- `VITE_GET_STARTED_DIRECT_DASHBOARD` — optional `true` to skip the get-started modal

**Backend (`backend/.env`)**

- `CORS_ORIGIN` — comma-separated allowed browser origins (include your frontend origin in production)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — persistence + wallet user rows (server only)
- `OPENROUTER_API_KEY` — chat model for the agent (when using OpenRouter)
- `JUPITER_ULTRA_API_KEY` — enables `GET /ultra/v1/order` proxy
- `COCKPIT_ANON_WALLET`, `COCKPIT_DEFAULT_WORKSPACE_KEY` — optional overrides for the anonymous user/workspace keys

See `backend/.env.example` for the full list of integrations.

## Scripts

**Frontend** (`frontend/`): `npm run dev`, `npm run build`, `npm run preview`

**Backend** (`backend/`): `npm run dev`, `npm run build`, `npm start`; database: `npm run db:start` / `db:stop` / `db:status`, `npm run db:push:local` (local) or `npm run db:push` (after `supabase link` to cloud)

## Product flow

1. Land on the marketing site → **Get started** → `/build-dashboard`.
2. Optionally **Connect wallet** (Phantom) to bind a Solana address and load workspace/bootstrap from the API.
3. Submit prompts in the composer → API creates a run → SSE streams tokens/tools → history lists runs (persisted when Supabase is configured).

## Notes

- Do not expose `SUPABASE_SERVICE_ROLE_KEY`, `JUPITER_ULTRA_API_KEY`, or other server secrets in the Vite bundle.
- `PRD.md` remains the working product spec; implemented routes may use `/analyses/:id/stream` instead of the PRD’s `/events` name — clients must match the running API.
