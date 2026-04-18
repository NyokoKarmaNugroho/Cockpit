import { OpenAIEmbeddings } from "@langchain/openai";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createServiceSupabase } from "./ingestFindCaseLawRag.js";
import { RAG_SOURCE_KIND_FIND_CASE_LAW_OPENAPI, RAG_SOURCE_NAME_FIND_CASE_LAW } from "./findCaseLawConstants.js";

export type RagChunkMatch = {
  chunk_id: string;
  source_id: string;
  chunk_index: number;
  content: string;
  similarity: number;
};

export type SearchFindCaseLawRagOptions = {
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  openAiApiKey?: string;
  query: string;
  matchCount?: number;
  /** If set, only search chunks for this source id */
  filterSourceId?: string | null;
};

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

/**
 * Embed the query and call `public.match_rag_chunks` (cosine via pgvector).
 * Uses the service role key — keep server-side only.
 */
export async function searchFindCaseLawRag(
  opts: SearchFindCaseLawRagOptions
): Promise<RagChunkMatch[]> {
  const supabaseUrl = opts.supabaseUrl ?? getEnv("SUPABASE_URL");
  const serviceKey = opts.supabaseServiceRoleKey ?? getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const openAiKey = opts.openAiApiKey ?? getEnv("OPENAI_API_KEY");

  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
  if (!openAiKey) {
    throw new Error("OPENAI_API_KEY is required to embed the query.");
  }

  const embeddings = new OpenAIEmbeddings({
    apiKey: openAiKey,
    model: "text-embedding-3-small",
    dimensions: 1536,
  });

  const [queryEmbedding] = await embeddings.embedDocuments([opts.query]);

  const supabase: SupabaseClient = createServiceSupabase(supabaseUrl, serviceKey);

  let filterSourceId = opts.filterSourceId ?? null;
  if (!filterSourceId) {
    const { data: src } = await supabase
      .from("rag_sources")
      .select("id")
      .eq("kind", RAG_SOURCE_KIND_FIND_CASE_LAW_OPENAPI)
      .eq("name", RAG_SOURCE_NAME_FIND_CASE_LAW)
      .maybeSingle();
    filterSourceId = src?.id ?? null;
  }

  const { data, error } = await supabase.rpc("match_rag_chunks", {
    query_embedding: queryEmbedding as number[],
    match_count: opts.matchCount ?? 8,
    filter_source_id: filterSourceId,
  });

  if (error) throw error;
  return (data ?? []) as RagChunkMatch[];
}
