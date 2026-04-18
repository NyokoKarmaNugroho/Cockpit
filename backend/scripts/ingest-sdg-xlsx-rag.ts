import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { OpenAIEmbeddings } from "@langchain/openai";
import * as XLSX from "xlsx";

import { createServiceSupabase } from "../src/rag/ingestFindCaseLawRag.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_XLSX_PATH = join(__dirname, "../dataset/sdg_dataset.xlsx");

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

function requireEnv(name: string): string {
  const v = getEnv(name);
  if (!v) throw new Error(`Missing env ${name} (see backend/.env.example)`);
  return v;
}

function parseArgs(argv: string[]) {
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

  return {
    xlsxPath: args.get("path") ?? DEFAULT_XLSX_PATH,
    name: args.get("name") ?? "sdg_dataset",
    kind: args.get("kind") ?? "xlsx_sdg_dataset",
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
  sheetName: string;
  headers: string[];
  rows: string[][];
  rowsPerChunk: number;
}): Array<{ content: string; chunkLabel: string }> {
  const { sheetName, headers, rows, rowsPerChunk } = opts;
  const chunks: Array<{ content: string; chunkLabel: string }> = [];

  for (let i = 0; i < rows.length; i += rowsPerChunk) {
    const slice = rows.slice(i, i + rowsPerChunk);
    const start = i + 1;
    const end = i + slice.length;

    const lines: string[] = [];
    lines.push(`# SDG dataset`);
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
        // Markdown field list: `key: value`
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

async function main() {
  const a = parseArgs(process.argv.slice(2));

  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const openAiKey = requireEnv("OPENAI_API_KEY");

  const supabase = createServiceSupabase(supabaseUrl, serviceKey);

  const raw = await readFile(a.xlsxPath);
  const wb = XLSX.read(raw, { type: "buffer", cellDates: true });
  const sheetNames = wb.SheetNames.slice(0, a.maxSheets);
  if (sheetNames.length === 0) throw new Error("XLSX has no sheets.");

  if (a.replace) {
    const { data: existing } = await supabase
      .from("rag_sources")
      .select("id")
      .eq("kind", a.kind)
      .eq("name", a.name)
      .maybeSingle();
    if (existing?.id) {
      const { error } = await supabase.from("rag_sources").delete().eq("id", existing.id);
      if (error) throw error;
    }
  }

  const { data: sourceRow, error: sourceErr } = await supabase
    .from("rag_sources")
    .insert({
      name: a.name,
      kind: a.kind,
      source_uri: a.xlsxPath,
      metadata: {
        file: { path: a.xlsxPath },
        sheets: sheetNames,
        max_rows_per_sheet: a.maxRowsPerSheet,
        rows_per_chunk: a.rowsPerChunk,
      },
    })
    .select("id")
    .single();
  if (sourceErr || !sourceRow) throw sourceErr ?? new Error("Failed to insert rag_sources row.");
  const sourceId = sourceRow.id as string;

  const allChunks: Array<{ content: string; metadata: Record<string, unknown> }> = [];

  for (const sheetName of sheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    // Parse as "array of arrays" so we can preserve column order.
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

    const dataRows = rows.slice(1, 1 + a.maxRowsPerSheet);
    if (dataRows.length === 0) continue;

    const chunks = chunkRowsToMarkdown({
      sheetName,
      headers,
      rows: dataRows,
      rowsPerChunk: a.rowsPerChunk,
    });

    for (const c of chunks) {
      allChunks.push({
        content: c.content,
        metadata: {
          sheet: sheetName,
          label: c.chunkLabel,
        },
      });
    }
  }

  if (allChunks.length === 0) throw new Error("No chunks produced from XLSX.");

  const embeddings = new OpenAIEmbeddings({
    apiKey: openAiKey,
    model: "text-embedding-3-small",
    dimensions: 1536,
  });
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

  console.log(
    JSON.stringify(
      {
        status: "ok",
        sourceId,
        sheets: sheetNames.length,
        chunkCount: rowsToInsert.length,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

