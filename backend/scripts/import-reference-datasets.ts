/**
 * Bulk-load ICIJ Offshore Leaks CSVs + solana-programs.json into Supabase.
 *
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in env (see backend/.env).
 * Apply migration first: supabase/migrations/20260417120000_reference_datasets_icij_solana.sql
 *
 * Usage:
 *   npx tsx scripts/import-reference-datasets.ts [--replace] [--max-rows N]
 *
 * --replace   Delete existing rows in target tables before import (recommended on re-run).
 * --max-rows  Cap rows per CSV/JSON (for smoke tests only).
 */

import { createReadStream, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse";
import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const datasetDir = path.join(backendRoot, "dataset");
const icijDir = path.join(datasetDir, "The ICIJ Offshore Leaks Database");

config({ path: path.join(backendRoot, ".env") });

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

function assertSupabaseJsUrl(url: string) {
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("postgresql://") || lower.startsWith("postgres://")) {
    throw new Error(
      [
        "Invalid SUPABASE_URL for @supabase/supabase-js: it looks like a Postgres connection string.",
        "Use the HTTPS Project URL instead (Dashboard → Project Settings → API → Project URL), e.g. https://<project-ref>.supabase.co",
        "If you need the pooler for SQL clients, store that in a separate env like DATABASE_URL — not SUPABASE_URL.",
      ].join("\n"),
    );
  }
  if (!lower.startsWith("https://") && !lower.startsWith("http://")) {
    throw new Error(
      `Invalid SUPABASE_URL: expected an http(s) Project URL, got: ${trimmed.slice(0, 24)}…`,
    );
  }
}

function parseArgs() {
  const replace = process.argv.includes("--replace");
  let maxRows: number | undefined;
  const i = process.argv.indexOf("--max-rows");
  if (i !== -1 && process.argv[i + 1]) maxRows = Number(process.argv[i + 1]);
  return { replace, maxRows: Number.isFinite(maxRows!) ? maxRows : undefined };
}

/** Delete all rows (PostgREST: "where col is not null" matches every populated row). */
async function deleteAllRows(supabase: SupabaseClient, table: string, notNullColumn: string) {
  const { error } = await supabase.from(table).delete().not(notNullColumn, "is", null);
  if (error) throw new Error(`${table} delete: ${error.message}`);
}

async function truncateAll(supabase: SupabaseClient) {
  const tables: { name: string; col: string }[] = [
    { name: "icij_relationships", col: "id" },
    { name: "icij_nodes_entities", col: "node_id" },
    { name: "icij_nodes_addresses", col: "node_id" },
    { name: "icij_nodes_officers", col: "node_id" },
    { name: "icij_nodes_intermediaries", col: "node_id" },
    { name: "icij_nodes_others", col: "node_id" },
    { name: "solana_programs", col: "id" },
    { name: "icij_import_meta", col: "id" },
  ];
  for (const { name, col } of tables) {
    process.stdout.write(`Clearing ${name}…\n`);
    await deleteAllRows(supabase, name, col);
  }
}

async function importCsvStream<T extends Record<string, unknown>>(opts: {
  supabase: SupabaseClient;
  filePath: string;
  table: string;
  batchSize: number;
  mapRow: (row: Record<string, string>) => T;
  maxRows?: number;
}) {
  const { supabase, filePath, table, batchSize, mapRow, maxRows } = opts;
  let count = 0;
  let batch: T[] = [];
  const stream = createReadStream(filePath, { encoding: "utf8" }).pipe(
    parse({
      columns: true,
      relax_quotes: true,
      relax_column_count: true,
      trim: true,
      bom: true,
    })
  );

  for await (const row of stream) {
    if (maxRows !== undefined && count >= maxRows) break;
    batch.push(mapRow(row as Record<string, string>));
    count++;
    if (batch.length >= batchSize) {
      const { error } = await supabase.from(table).insert(batch);
      if (error) {
        const hint =
          /duplicate key/i.test(error.message) || /23505/i.test(error.code ?? "")
            ? " Hint: clear tables first with --replace, or delete ICIJ rows in the DB."
            : "";
        throw new Error(`${table} insert @${count}: ${error.message}${hint}`);
      }
      batch = [];
      if (count % (batchSize * 20) === 0) process.stdout.write(`  ${table}: ${count}\n`);
    }
  }
  if (batch.length) {
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      const hint =
        /duplicate key/i.test(error.message) || /23505/i.test(error.code ?? "")
          ? " Hint: use --replace to truncate ICIJ tables before import."
          : "";
      throw new Error(`${table} final batch: ${error.message}${hint}`);
    }
  }
  process.stdout.write(`  ${table}: done (${count} rows)\n`);
}

function s(v: string | undefined): string | null {
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  return t === "" ? null : t;
}

function n(v: string | undefined): number {
  const x = Number(String(v).replace(/,/g, "").trim());
  if (!Number.isFinite(x)) throw new Error(`Invalid bigint: ${v}`);
  return x;
}

async function main() {
  const { replace, maxRows } = parseArgs();
  const url = getEnv("SUPABASE_URL");
  assertSupabaseJsUrl(url);
  const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  if (!replace) {
    process.stdout.write(
      "Note: running without --replace keeps existing rows; re-importing the same CSV will hit duplicate key errors.\n" +
        "Use: npm run db:import:reference-datasets -- --replace [--max-rows N]\n\n",
    );
  }

  if (replace) await truncateAll(supabase);

  const genPath = path.join(icijDir, "GENERATED_ON_20250331.txt");
  let generatedOn: string | null = null;
  try {
    const raw = readFileSync(genPath, "utf8").trim();
    if (raw) generatedOn = raw;
  } catch {
    /* optional file */
  }
  if (!generatedOn) generatedOn = "2025-03-31 (from filename; file empty or missing)";
  const { error: metaErr } = await supabase.from("icij_import_meta").insert({
    source: "ICIJ Offshore Leaks",
    generated_on: generatedOn,
    raw_note: "Imported via backend/scripts/import-reference-datasets.ts",
  });
  if (metaErr) throw new Error(`icij_import_meta: ${metaErr.message}`);

  await importCsvStream({
    supabase,
    filePath: path.join(icijDir, "nodes-entities.csv"),
    table: "icij_nodes_entities",
    batchSize: 150,
    maxRows,
    mapRow: (r) => ({
      node_id: n(r.node_id),
      name: s(r.name),
      original_name: s(r.original_name),
      former_name: s(r.former_name),
      jurisdiction: s(r.jurisdiction),
      jurisdiction_description: s(r.jurisdiction_description),
      company_type: s(r.company_type),
      address: s(r.address),
      internal_id: s(r.internal_id),
      incorporation_date: s(r.incorporation_date),
      inactivation_date: s(r.inactivation_date),
      struck_off_date: s(r.struck_off_date),
      dorm_date: s(r.dorm_date),
      status: s(r.status),
      service_provider: s(r.service_provider),
      ibc_ruc: s(r.ibcRUC),
      country_codes: s(r.country_codes),
      countries: s(r.countries),
      source_id: s(r.sourceID),
      valid_until: s(r.valid_until),
      note: s(r.note),
    }),
  });

  await importCsvStream({
    supabase,
    filePath: path.join(icijDir, "nodes-addresses.csv"),
    table: "icij_nodes_addresses",
    batchSize: 200,
    maxRows,
    mapRow: (r) => ({
      node_id: n(r.node_id),
      address: s(r.address),
      name: s(r.name),
      countries: s(r.countries),
      country_codes: s(r.country_codes),
      source_id: s(r.sourceID),
      valid_until: s(r.valid_until),
      note: s(r.note),
    }),
  });

  await importCsvStream({
    supabase,
    filePath: path.join(icijDir, "nodes-officers.csv"),
    table: "icij_nodes_officers",
    batchSize: 200,
    maxRows,
    mapRow: (r) => ({
      node_id: n(r.node_id),
      name: s(r.name),
      countries: s(r.countries),
      country_codes: s(r.country_codes),
      source_id: s(r.sourceID),
      valid_until: s(r.valid_until),
      note: s(r.note),
    }),
  });

  await importCsvStream({
    supabase,
    filePath: path.join(icijDir, "nodes-intermediaries.csv"),
    table: "icij_nodes_intermediaries",
    batchSize: 200,
    maxRows,
    mapRow: (r) => ({
      node_id: n(r.node_id),
      name: s(r.name),
      status: s(r.status),
      internal_id: s(r.internal_id),
      address: s(r.address),
      countries: s(r.countries),
      country_codes: s(r.country_codes),
      source_id: s(r.sourceID),
      valid_until: s(r.valid_until),
      note: s(r.note),
    }),
  });

  await importCsvStream({
    supabase,
    filePath: path.join(icijDir, "nodes-others.csv"),
    table: "icij_nodes_others",
    batchSize: 200,
    maxRows,
    mapRow: (r) => ({
      node_id: n(r.node_id),
      name: s(r.name),
      type: s(r.type),
      incorporation_date: s(r.incorporation_date),
      struck_off_date: s(r.struck_off_date),
      closed_date: s(r.closed_date),
      jurisdiction: s(r.jurisdiction),
      jurisdiction_description: s(r.jurisdiction_description),
      countries: s(r.countries),
      country_codes: s(r.country_codes),
      source_id: s(r.sourceID),
      valid_until: s(r.valid_until),
      note: s(r.note),
    }),
  });

  await importCsvStream({
    supabase,
    filePath: path.join(icijDir, "relationships.csv"),
    table: "icij_relationships",
    batchSize: 800,
    maxRows,
    mapRow: (r) => ({
      node_id_start: n(r.node_id_start),
      node_id_end: n(r.node_id_end),
      rel_type: s(r.rel_type),
      link: s(r.link),
      status: s(r.status),
      start_date: s(r.start_date),
      end_date: s(r.end_date),
      source_id: s(r.sourceID),
    }),
  });

  const programsPath = path.join(datasetDir, "solana-programs.json");
  const programs = JSON.parse(readFileSync(programsPath, "utf8")) as { name: string; address: string; category: string }[];
  const slice = maxRows !== undefined ? programs.slice(0, maxRows) : programs;
  const progBatch = 500;
  for (let i = 0; i < slice.length; i += progBatch) {
    const chunk = slice.slice(i, i + progBatch).map((p) => ({
      name: p.name,
      address: p.address,
      category: p.category,
    }));
    const { error } = await supabase.from("solana_programs").upsert(chunk, { onConflict: "address" });
    if (error) throw new Error(`solana_programs: ${error.message}`);
  }
  process.stdout.write(`  solana_programs: done (${slice.length} rows)\n`);

  process.stdout.write("Import finished.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
