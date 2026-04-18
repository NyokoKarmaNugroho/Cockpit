import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { openApiJsonToChunkTexts } from "./chunkOpenApi.js";
import {
  FIND_CASE_LAW_BASE_URL,
  RAG_SOURCE_KIND_FIND_CASE_LAW_OPENAPI,
  RAG_SOURCE_NAME_FIND_CASE_LAW,
} from "./findCaseLawConstants.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const DEFAULT_SPEC_PATH = join(
  __dirname,
  "../../dataset/National Archives Find Case Law"
);

export type IngestFindCaseLawRagOptions = {
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  openAiApiKey?: string;
  /** Override default dataset path */
  specPath?: string;
};

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export function createServiceSupabase(url: string, serviceKey: string): SupabaseClient {
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function ingestFindCaseLawRag(opts: IngestFindCaseLawRagOptions = {}): Promise<{
  sourceId: string;
  chunkCount: number;
}> {
  const supabaseUrl = opts.supabaseUrl ?? getEnv("SUPABASE_URL");
  const serviceKey = opts.supabaseServiceRoleKey ?? getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const openAiKey = opts.openAiApiKey ?? getEnv("OPENAI_API_KEY");

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      [
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
        "Create backend/.env (see backend/.env.example) with:",
        "  SUPABASE_URL=https://<project>.supabase.co",
        "  SUPABASE_SERVICE_ROLE_KEY=<service_role secret from Dashboard → Settings → API — not the anon key>",
      ].join("\n")
    );
  }
  if (!openAiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY — add it to backend/.env for text-embedding-3-small (see backend/.env.example)."
    );
  }

  const specPath = opts.specPath ?? DEFAULT_SPEC_PATH;
  const raw = await readFile(specPath, "utf8");
  const spec = JSON.parse(raw) as Record<string, unknown>;

  const chunks = openApiJsonToChunkTexts(spec);
  if (chunks.length === 0) {
    throw new Error("No text chunks produced from OpenAPI spec.");
  }

  const embeddings = new OpenAIEmbeddings({
    apiKey: openAiKey,
    model: "text-embedding-3-small",
    dimensions: 1536,
  });

  const supabase = createServiceSupabase(supabaseUrl, serviceKey);

  const { data: existing } = await supabase
    .from("rag_sources")
    .select("id")
    .eq("kind", RAG_SOURCE_KIND_FIND_CASE_LAW_OPENAPI)
    .eq("name", RAG_SOURCE_NAME_FIND_CASE_LAW)
    .maybeSingle();

  if (existing?.id) {
    const { error: delErr } = await supabase.from("rag_sources").delete().eq("id", existing.id);
    if (delErr) throw delErr;
  }

  const { data: sourceRow, error: sourceErr } = await supabase
    .from("rag_sources")
    .insert({
      name: RAG_SOURCE_NAME_FIND_CASE_LAW,
      kind: RAG_SOURCE_KIND_FIND_CASE_LAW_OPENAPI,
      source_uri: FIND_CASE_LAW_BASE_URL,
      metadata: {
        openapi: typeof spec.openapi === "string" ? spec.openapi : "3.x",
        api_version:
          spec.info && typeof spec.info === "object" && (spec.info as { version?: string }).version
            ? (spec.info as { version: string }).version
            : null,
        spec_path: specPath,
        licence_note:
          "RAG covers this API specification only. Bulk computational analysis of case records may require a separate licence — see Open Justice Licence terms in the spec.",
      },
    })
    .select("id")
    .single();

  if (sourceErr || !sourceRow) throw sourceErr ?? new Error("Failed to insert rag_sources row.");

  const sourceId = sourceRow.id as string;

  const vectors = await embeddings.embedDocuments(chunks);

  const rows = chunks.map((content, i) => ({
    source_id: sourceId,
    chunk_index: i,
    content,
    embedding: vectors[i] as number[],
    metadata: {
      title: String(
        spec.info && typeof spec.info === "object" && (spec.info as { title?: string }).title
          ? (spec.info as { title: string }).title
          : RAG_SOURCE_NAME_FIND_CASE_LAW
      ),
      chunk_index: i,
    },
  }));

  const batchSize = 32;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error: chunkErr } = await supabase.from("rag_chunks").insert(batch);
    if (chunkErr) throw chunkErr;
  }

  return { sourceId, chunkCount: chunks.length };
}
