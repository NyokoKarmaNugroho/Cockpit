# Cockpit

Public marketing site for Cockpit — blockchain intelligence for analysts, investigators, and compliance teams.

This repository contains the **Vite + React** frontend only (landing, blog, pricing, explore-data, methodology). Product vision and future scope live in [`PRD.md`](PRD.md).

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
- `PRD.md` describes planned product scope; this repo tracks the public site only.
