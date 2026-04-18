# Cockpit — technical notes (`docs/`)

This folder holds **reference material** for future Cockpit integrations: agents, data pipelines, RPC providers, and compliance-adjacent APIs. It is **not** required to build or run the public marketing site.

## Relationship to this repository

- **In this repo:** the Vite + React app under [`frontend/`](../frontend/) (landing, blog, pricing, explore-data, methodology).
- **Not in this repo:** a Node API service, dashboard app, large datasets, or Supabase migrations. Some notes still mention paths like `backend/…` as **examples** for a separate backend repository or deployment—those paths are not present here unless you add them elsewhere.

## Index

| Document | Topic |
|----------|--------|
| [agent-runtime-hermes-adaptation.md](./agent-runtime-hermes-adaptation.md) | Hermes-style agent loops mapped to a future Cockpit analysis API |
| [chainalysis-sanctions-api.md](./chainalysis-sanctions-api.md) | Chainalysis public Sanctions API (server-side only) |
| [dune-data-stack.md](./dune-data-stack.md) | Dune / Sim / Data API vs warehouse patterns |
| [reference-datasets-supabase.md](./reference-datasets-supabase.md) | Bulk-loading reference datasets into Postgres (Supabase) |
| [rpc-helius-rpcfast-cockpit.md](./rpc-helius-rpcfast-cockpit.md) | Helius + RPC Fast for Solana RPC and streaming |
| [supabase-storage-s3.md](./supabase-storage-s3.md) | Supabase Storage S3-compatible API and auth modes |
| [tavily-cockpit-adaptation.md](./tavily-cockpit-adaptation.md) | Tavily search / crawl / extract for RAG and agents |
| [timesfm-cockpit-adaptation.md](./timesfm-cockpit-adaptation.md) | TimesFM-style forecasting in analytics lanes |

Product vision and planned API sketches live in [`PRD.md`](../PRD.md) at the repository root.
