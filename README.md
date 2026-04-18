# Cockpit

Public marketing site for Cockpit — blockchain intelligence for analysts, investigators, and compliance teams.

This repository contains the **Vite + React** frontend only (landing, blog, pricing, explore-data, methodology).

- **[`PRD.md`](PRD.md)** — product vision, planned APIs, and milestones (including features not shipped in this repo).
- **[`docs/`](docs/)** — technical reference notes for future integrations (agents, data, RPC); optional reading, not needed to run the site.

## Tech stack

- Vite 6, React 19, TypeScript, React Router 7, Tailwind CSS

## Getting started

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Dev server: [http://localhost:5173](http://localhost:5173)

### Environment (optional)

See `frontend/.env.example` — mainly `VITE_SITE_URL` and optional Supabase vars for client-side features.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build to `frontend/dist` |
| `npm run preview` | Preview production build locally |

## Notes

- Do not commit real `.env` secrets; use `.env.example` as a template.
- `PRD.md` describes planned product scope; this repo tracks the public site only. Technical integration notes live under [`docs/`](docs/) (start at [`docs/README.md`](docs/README.md)).
