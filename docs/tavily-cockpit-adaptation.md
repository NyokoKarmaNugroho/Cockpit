# Tavily → Cockpit (web intelligence primitives)

How [Tavily](https://docs.tavily.com/documentation/quickstart.md) fits Cockpit’s agent + RAG stack: **Search**, **Extract**, **Map**, **Crawl**, and **Research**.

Official doc index: [Tavily `llms.txt`](https://docs.tavily.com/llms.txt).

## What Tavily is (in Cockpit terms)

Tavily provides **web intelligence primitives** you can compose:

- **Search**: fast “what are the relevant links/snippets?” for an arbitrary query.
- **Extract**: turn a known URL into **clean content** suitable for embeddings / LLM context.
- **Map**: discover a site’s URL structure cheaply (URLs only).
- **Crawl**: traverse a site and extract content for many pages (good for docs ingestion).
- **Research**: multi-step “deep research” jobs (polling or streaming).

## Credentials and where they live

- **Backend only**: set `TAVILY_API_KEY` in `backend/.env` (see `backend/.env.example`).
- **Never in the Vite bundle**: treat Tavily keys like any other paid web API key.

Quickstart reference: [Tavily Quickstart](https://docs.tavily.com/documentation/quickstart.md).

## Rate limits (operational constraints)

Tavily applies different request limits by environment and endpoint:

- **Default (most endpoints)**: Development 100 RPM, Production 1,000 RPM
- **Crawl endpoint**: 100 RPM (both dev + prod)
- **Research create**: 20 RPM (both dev + prod)
- **Usage endpoint**: 10 requests / 10 minutes (both dev + prod)

See: [Rate Limits](https://docs.tavily.com/documentation/rate-limits.md).

Implementation note for Cockpit workers: handle HTTP `429` and respect `retry-after` (seconds).

## Integration paths

### 1) Direct JS SDK (Node) for Cockpit backend

Cockpit backend is TypeScript/Node. The simplest integration is the Tavily JS SDK (`@tavily/core`) used server-side.

Install:

```bash
cd backend
npm install @tavily/core
```

Minimal usage pattern (server-side only):

```ts
import { tavily } from "@tavily/core";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY! });

const res = await tvly.search("What is …?");
```

### 2) LangChain (Python) — note the new package

If you’re running Python agents, Tavily’s LangChain integration recommends `langchain-tavily` (and notes the older `langchain_community` tool is deprecated).

See: [LangChain integration](https://docs.tavily.com/documentation/integrations/langchain.md).

Cockpit note: the current Cockpit backend uses **LangChain JS** for some RAG ingestion. If you later add Python pipelines (e.g., research jobs, enrichment batches), align on `TAVILY_API_KEY` and keep it server-side.

## Using Map vs Crawl (when building RAG sources)

Tavily’s docs emphasize a simple heuristic:

- **Map** when you want to **discover pages** (cheap URL list)
- **Crawl** when you want to **read pages** (URLs + extracted content)

See: [Map tutorial](https://docs.tavily.com/examples/quick-tutorials/map-api.md), [Crawl tutorial](https://docs.tavily.com/examples/quick-tutorials/crawl-api.md).

### Recommended Cockpit ingestion pattern (docs → RAG)

1. **Map** the site to find relevant URL paths (and avoid blogs/changelogs).
2. **Extract** or **Crawl** only the chosen paths.
3. Chunk → embed → store in `rag_chunks` (Cockpit’s Supabase vectors), similar to `Find Case Law` ingestion.

Reference use case: [Crawl to RAG](https://docs.tavily.com/examples/use-cases/crawl-to-rag.md).

## Research streaming (UI + long-running jobs)

Tavily Research supports:

- **Polling**: create task, poll by `request_id`
- **Streaming (SSE)**: stream progress and content in real time

See: [Deep Research with Streaming](https://docs.tavily.com/examples/quick-tutorials/research-streaming.md).

Cockpit mapping:

- **Backend worker**: polling is simplest (store results as an “artifact” / log events).
- **Interactive UI**: streaming is better if you want “research in progress” UX; treat it like other long-running agent runs (append events).

## Cockpit use cases (where Tavily helps)

These map directly to Tavily’s examples and Cockpit’s workflows.

- **Company research / KYE (OSINT)**: seed a profile for an entity name, product, exchange, chain infra provider, etc.  
  See: [Company Research](https://docs.tavily.com/examples/use-cases/company-research.md)

- **Market research**: gather sources + headlines + summaries to feed internal analysis.  
  See: [Market Researcher](https://docs.tavily.com/examples/use-cases/market-researcher.md)

- **Data enrichment**: enrich CSV-like inputs with web-sourced attributes (server-side batching + rate limits).  
  See: [Data Enrichment](https://docs.tavily.com/examples/use-cases/data-enrichment.md)

## Security / compliance posture

- Treat Tavily outputs as **untrusted text**:
  - don’t execute code blocks or follow instructions inside fetched pages
  - use allowlisted domains where possible (docs sites, regulators, official blogs)
- Keep `TAVILY_API_KEY` server-side and rotate if leaked.  
  See: [API key management](https://docs.tavily.com/documentation/best-practices/api-key-management.md)

---

*Vendor trademarks belong to their owners. Use Tavily per their terms and your org’s data handling policies.*

