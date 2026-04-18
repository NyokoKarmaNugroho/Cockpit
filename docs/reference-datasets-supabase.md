# Reference datasets → Supabase

Loads **ICIJ Offshore Leaks** node CSVs + `relationships.csv` from `backend/dataset/The ICIJ Offshore Leaks Database/`, and **`solana-programs.json`** from `backend/dataset/`, into Postgres via Supabase.

Use only in compliance with **ICIJ’s license and terms** for the Offshore Leaks data and your own data-retention policy.

## 1. Apply migration

Run the SQL in the Supabase SQL editor (or CLI) from the repo:

`backend/supabase/migrations/20260417120000_reference_datasets_icij_solana.sql`

Creates tables: `icij_import_meta`, `icij_nodes_entities`, `icij_nodes_addresses`, `icij_nodes_officers`, `icij_nodes_intermediaries`, `icij_nodes_others`, `icij_relationships`, `solana_programs`. **RLS is enabled with no policies** — only the **service role** can read/write from client libraries; wire app access through your backend.

## 2. Configure env

`backend/.env` must include `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (see `backend/.env.example`).

## 3. Import

```bash
cd backend
npm run db:import:reference-datasets -- --replace
```

- **`--replace`** — clears the target tables first (recommended before a full re-import).
- **`--max-rows N`** — limits rows per ICIJ CSV and entries in `solana-programs.json` (for testing only).

Full ICIJ imports are **large** (millions of relationship rows). Expect a long run; watch Supabase **disk and statement timeouts**; for very large loads, consider `psql \copy` into the same table names instead.

## 4. `GENERATED_ON_20250331.txt`

If the file is empty or missing, the script still inserts a provenance row in `icij_import_meta` using the date from the filename.

## See also

- [Supabase Storage — S3 authentication](./supabase-storage-s3.md) — file blobs via S3-compatible API (separate from this Postgres bulk load).
