import { readFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { OpenAIEmbeddings } from "@langchain/openai";
import * as XLSX from "xlsx";

import { createServiceSupabase } from "../src/rag/ingestFindCaseLawRag.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

function requireEnv(name: string): string {
  const v = getEnv(name);
  if (!v) throw new Error(`Missing env ${name} (see backend/.env.example)`);
  return v;
}

type Args = {
  paths: string[];
  kind: string;
  replace: boolean;
  maxSheets: number;
  maxRowsPerSheet: number;
  rowsPerChunk: number;
};

function parseArgs(argv: string[]): Args {
  const args = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args.set(key, next);
      i++;
    } else {
      args.set(key, "true");
    }
  }

  const pathsRaw = args.get("paths") ?? "";
  const paths =
    pathsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  if (paths.length === 0) {
    // Default to the backend/dataset directory (common convention in this repo),
    // but keep it explicit so we don't accidentally ingest everything.
    throw new Error(
      [
        "Missing --paths (comma-separated).",
        "",
        "Usage:",
        "  npm run rag:ingest:xlsx -- --paths \"./dataset/file1.xlsx,./dataset/file2.xlsx\" [--kind xlsx_dataset] [--replace]",
      ].join("\n"),
    );
  }

  return {
    paths,
    kind: args.get("kind") ?? "xlsx_dataset",
    replace: args.get("replace") === "true",
    maxSheets: Number(args.get("max-sheets") ?? "9999"),
    maxRowsPerSheet: Number(args.get("max-rows") ?? "999999999"),
    rowsPerChunk: Number(args.get("rows-per-chunk") ?? "50"),
  };
}

function normalizeCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString();
  return String(v).trim();
}

function chunkRowsToMarkdown(opts: {
  datasetName: string;
  sheetName: string;
  headers: string[];
  rows: string[][];
  rowsPerChunk: number;
}): Array<{ content: string; chunkLabel: string }> {
  const { datasetName, sheetName, headers, rows, rowsPerChunk } = opts;
  const chunks: Array<{ content: string; chunkLabel: string }> = [];

  for (let i = 0; i < rows.length; i += rowsPerChunk) {
    const slice = rows.slice(i, i + rowsPerChunk);
    const start = i + 1;
    const end = i + slice.length;

    const lines: string[] = [];
    lines.push(`# Dataset: ${datasetName}`);
    lines.push(`## Sheet: ${sheetName}`);
    lines.push(`## Rows: ${start}-${end}`);
    lines.push("");
    lines.push(headers.map((h) => `- ${h}`).join("\n"));
    lines.push("");

    for (const r of slice) {
      lines.push("---");
      for (let c = 0; c < headers.length; c++) {
        const key = headers[c] ?? `col_${c + 1}`;
        const val = (r[c] ?? "").trim();
        if (!val) continue;
        lines.push(`- **${key}**: ${val}`);
      }
      lines.push("");
    }

    chunks.push({
      content: lines.join("\n").trim(),
      chunkLabel: `${sheetName} rows ${start}-${end}`,
    });
  }

  return chunks;
}

async function ingestOneXlsx(opts: {
  supabase: ReturnType<typeof createServiceSupabase>;
  embeddings: OpenAIEmbeddings;
  xlsxPath: string;
  kind: string;
  replace: boolean;
  maxSheets: number;
  maxRowsPerSheet: number;
  rowsPerChunk: number;
}): Promise<{ sourceId: string; sheets: number; chunkCount: number }> {
  const {
    supabase,
    embeddings,
    xlsxPath,
    kind,
    replace,
    maxSheets,
    maxRowsPerSheet,
    rowsPerChunk,
  } = opts;

  const datasetName = basename(xlsxPath).replace(/\.xlsx$/i, "");

  const raw = await readFile(xlsxPath);
  const wb = XLSX.read(raw, { type: "buffer", cellDates: true });
  const sheetNames = wb.SheetNames.slice(0, maxSheets);
  if (sheetNames.length === 0) throw new Error(`${xlsxPath}: XLSX has no sheets.`);

  if (replace) {
    const { data: existing } = await supabase
      .from("rag_sources")
      .select("id")
      .eq("kind", kind)
      .eq("name", datasetName)
      .maybeSingle();
    if (existing?.id) {
      const { error } = await supabase.from("rag_sources").delete().eq("id", existing.id);
      if (error) throw error;
    }
  }

  const { data: sourceRow, error: sourceErr } = await supabase
    .from("rag_sources")
    .insert({
      name: datasetName,
      kind,
      source_uri: xlsxPath,
      metadata: {
        file: { path: xlsxPath },
        sheets: sheetNames,
        max_rows_per_sheet: maxRowsPerSheet,
        rows_per_chunk: rowsPerChunk,
      },
    })
    .select("id")
    .single();
  if (sourceErr || !sourceRow) throw sourceErr ?? new Error(`${xlsxPath}: failed to insert rag_sources row.`);
  const sourceId = sourceRow.id as string;

  const allChunks: Array<{ content: string; metadata: Record<string, unknown> }> = [];

  for (const sheetName of sheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const rowsAoa = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      blankrows: false,
      raw: false,
      defval: "",
    }) as unknown as unknown[][];

    const rows = rowsAoa.map((r) => r.map(normalizeCell));
    if (rows.length === 0) continue;

    const headerRow = rows[0] ?? [];
    const headers = headerRow.map((h, i) => (h ? h : `col_${i + 1}`));

    const dataRows = rows.slice(1, 1 + maxRowsPerSheet);
    if (dataRows.length === 0) continue;

    const chunks = chunkRowsToMarkdown({
      datasetName,
      sheetName,
      headers,
      rows: dataRows,
      rowsPerChunk,
    });

    for (const c of chunks) {
      allChunks.push({
        content: c.content,
        metadata: {
          dataset: datasetName,
          sheet: sheetName,
          label: c.chunkLabel,
        },
      });
    }
  }

  if (allChunks.length === 0) throw new Error(`${xlsxPath}: no chunks produced from XLSX.`);

  const vectors = await embeddings.embedDocuments(allChunks.map((c) => c.content));

  const rowsToInsert = allChunks.map((c, i) => ({
    source_id: sourceId,
    chunk_index: i,
    content: c.content,
    embedding: vectors[i] as number[],
    metadata: { ...c.metadata, chunk_index: i },
  }));

  const batchSize = 32;
  for (let i = 0; i < rowsToInsert.length; i += batchSize) {
    const batch = rowsToInsert.slice(i, i + batchSize);
    const { error } = await supabase.from("rag_chunks").insert(batch);
    if (error) throw error;
  }

  return { sourceId, sheets: sheetNames.length, chunkCount: rowsToInsert.length };
}

async function main() {
  const a = parseArgs(process.argv.slice(2));

  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const openAiKey = requireEnv("OPENAI_API_KEY");

  const supabase = createServiceSupabase(supabaseUrl, serviceKey);
  const embeddings = new OpenAIEmbeddings({
    apiKey: openAiKey,
    model: "text-embedding-3-small",
    dimensions: 1536,
  });

  const results: Array<{ path: string; sourceId: string; sheets: number; chunkCount: number }> = [];

  for (const p of a.paths) {
    const xlsxPath = p.startsWith(".") ? join(process.cwd(), p) : p;
    const r = await ingestOneXlsx({
      supabase,
      embeddings,
      xlsxPath,
      kind: a.kind,
      replace: a.replace,
      maxSheets: a.maxSheets,
      maxRowsPerSheet: a.maxRowsPerSheet,
      rowsPerChunk: a.rowsPerChunk,
    });
    results.push({ path: xlsxPath, ...r });
  }

  console.log(JSON.stringify({ status: "ok", datasets: results }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

