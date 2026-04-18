> **Scope:** Bulk-load **reference datasets** into Postgres (Supabase). This repo does **not** include dataset files or migration SQL; use this note when you maintain a **separate** API/data repo. Paths like `your-api-repo/` are placeholders.

# Reference datasets → Supabase

Loads **ICIJ Offshore Leaks** node CSVs + `relationships.csv`, and a **`solana-programs.json`** list, into Postgres via Supabase—typically from a directory you control (e.g. `your-api-repo/dataset/...`).

Use only in compliance with **ICIJ’s license and terms** for the Offshore Leaks data and your own data-retention policy.

## 1. Apply migration

Run the SQL in the Supabase SQL editor (or CLI) from **your** project that owns the schema, e.g.:

`your-api-repo/supabase/migrations/…_reference_datasets_icij_solana.sql`

Creates tables such as: `icij_import_meta`, `icij_nodes_entities`, `icij_nodes_addresses`, `icij_nodes_officers`, `icij_nodes_intermediaries`, `icij_nodes_others`, `icij_relationships`, `solana_programs`. **RLS is enabled with no policies** — only the **service role** can read/write from client libraries; wire app access through your API.

## 2. Configure env

Your import job or API service needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (never expose the service role key to the browser).

## 3. Import

From the project that contains the import script (example):

```bash
cd your-api-repo
npm run db:import:reference-datasets -- --replace
```

- **`--replace`** — clears the target tables first (recommended before a full re-import).
- **`--max-rows N`** — limits rows per ICIJ CSV and entries in `solana-programs.json` (for testing only).

Full ICIJ imports are **large** (millions of relationship rows). Expect a long run; watch Supabase **disk and statement timeouts**; for very large loads, consider `psql \copy` into the same table names instead.

## 4. `GENERATED_ON_*.txt`

If the file is empty or missing, a typical script still inserts a provenance row in `icij_import_meta` using the date from the filename when present.

## See also

- [Supabase Storage — S3 authentication](./supabase-storage-s3.md) — file blobs via S3-compatible API (separate from this Postgres bulk load).
