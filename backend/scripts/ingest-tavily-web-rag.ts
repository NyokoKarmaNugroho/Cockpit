import { OpenAIEmbeddings } from "@langchain/openai";
import { createTavilyClient } from "../src/integrations/tavily/client.js";
import { createServiceSupabase } from "../src/rag/ingestFindCaseLawRag.js";

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

function requireEnv(name: string): string {
  const v = getEnv(name);
  if (!v) throw new Error(`Missing env ${name} (see backend/.env.example)`);
  return v;
}

function chunkTextByChars(text: string, chunkSize = 1400, overlap = 150): string[] {
  const clean = text.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];
  const out: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(clean.length, i + chunkSize);
    out.push(clean.slice(i, end));
    if (end >= clean.length) break;
    i = Math.max(0, end - overlap);
  }
  return out;
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
    url: args.get("url") ?? "",
    name: args.get("name") ?? "",
    kind: args.get("kind") ?? "tavily_crawl",
    replace: args.get("replace") === "true",
    maxDepth: Number(args.get("max-depth") ?? "2"),
    limit: Number(args.get("limit") ?? "25"),
    instructions: args.get("instructions") ?? undefined,
  };
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  if (!a.url.trim() || !a.name.trim()) {
    throw new Error(
      [
        "Usage:",
        "  npm run rag:ingest:tavily -- --url <https://...> --name <source-name> [--kind tavily_crawl] [--replace] [--max-depth 2] [--limit 25]",
        "",
        "Example:",
        "  npm run rag:ingest:tavily -- --url https://docs.tavily.com --name tavily_docs --replace --max-depth 2 --limit 40",
      ].join("\n"),
    );
  }

  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const openAiKey = requireEnv("OPENAI_API_KEY");
  requireEnv("TAVILY_API_KEY");

  const supabase = createServiceSupabase(supabaseUrl, serviceKey);
  const tvly = createTavilyClient();

  const crawl = await tvly.crawl(a.url, {
    max_depth: a.maxDepth,
    limit: a.limit,
    ...(a.instructions ? { instructions: a.instructions } : {}),
  });

  const pages = Array.isArray((crawl as { results?: unknown }).results)
    ? ((crawl as { results: Array<{ url: string; rawContent?: string; raw_content?: string }> }).results as Array<{
        url: string;
        rawContent?: string;
        raw_content?: string;
      }>)
    : [];

  const texts: Array<{ url: string; text: string }> = [];
  for (const p of pages) {
    const raw = (p.rawContent ?? (p as { raw_content?: string }).raw_content ?? "").trim();
    if (!raw) continue;
    texts.push({ url: p.url, text: raw });
  }
  if (texts.length === 0) throw new Error("Tavily crawl returned no extractable pages.");

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
      source_uri: a.url,
      metadata: {
        crawl: { maxDepth: a.maxDepth, limit: a.limit, instructions: a.instructions ?? null },
        page_count: texts.length,
      },
    })
    .select("id")
    .single();
  if (sourceErr || !sourceRow) throw sourceErr ?? new Error("Failed to insert rag_sources row.");
  const sourceId = sourceRow.id as string;

  const chunks: Array<{ content: string; url: string }> = [];
  for (const p of texts) {
    for (const c of chunkTextByChars(p.text)) {
      chunks.push({ content: c, url: p.url });
    }
  }
  if (chunks.length === 0) throw new Error("No chunks produced.");

  const embeddings = new OpenAIEmbeddings({
    apiKey: openAiKey,
    model: "text-embedding-3-small",
    dimensions: 1536,
  });
  const vectors = await embeddings.embedDocuments(chunks.map((c) => c.content));

  const rows = chunks.map((c, i) => ({
    source_id: sourceId,
    chunk_index: i,
    content: c.content,
    embedding: vectors[i] as number[],
    metadata: { url: c.url, chunk_index: i },
  }));

  const batchSize = 32;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from("rag_chunks").insert(batch);
    if (error) throw error;
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        sourceId,
        pageCount: texts.length,
        chunkCount: rows.length,
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

