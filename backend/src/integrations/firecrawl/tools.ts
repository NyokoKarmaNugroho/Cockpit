import { tool } from "langchain";
import { z } from "zod";
import { createFirecrawlClient } from "./client.js";

const FC_NOTE =
  "Firecrawl (api.firecrawl.dev): scrape/map/crawl/search with credits; use only on authorized targets; respect robots and site terms.";

export function createFirecrawlTools() {
  const firecrawlScrape = tool(
    async (input: {
      url: string;
      formats?: ("markdown" | "html" | "links" | "rawHtml")[];
      only_main_content?: boolean;
      timeout_seconds?: number;
    }) => {
      const app = createFirecrawlClient();
      return await app.scrape(input.url, {
        formats: input.formats ?? ["markdown"],
        onlyMainContent: input.only_main_content ?? true,
        ...(input.timeout_seconds != null
          ? { timeout: Math.min(300, Math.max(5, input.timeout_seconds)) * 1000 }
          : {}),
      });
    },
    {
      name: "firecrawl_scrape",
      description: `${FC_NOTE} Scrape a single URL into markdown/html/links. Prefer for full-page capture vs search snippets.`,
      schema: z.object({
        url: z.string().url().describe("HTTP(S) URL to scrape"),
        formats: z
          .array(z.enum(["markdown", "html", "links", "rawHtml"]))
          .max(4)
          .optional()
          .describe("Output formats (default markdown)"),
        only_main_content: z
          .boolean()
          .optional()
          .describe("Strip nav/footers when true (default true)"),
        timeout_seconds: z
          .number()
          .int()
          .min(5)
          .max(300)
          .optional()
          .describe("Per-request timeout (seconds)"),
      }),
    },
  );

  const firecrawlMap = tool(
    async (input: {
      url: string;
      limit?: number;
      search?: string;
      sitemap?: "only" | "include" | "skip";
      include_subdomains?: boolean;
    }) => {
      const app = createFirecrawlClient();
      return await app.map(input.url, {
        limit: input.limit,
        search: input.search,
        sitemap: input.sitemap,
        includeSubdomains: input.include_subdomains,
      });
    },
    {
      name: "firecrawl_map",
      description: `${FC_NOTE} Discover URLs on a site (sitemap-aware). Use before crawl to scope paths.`,
      schema: z.object({
        url: z.string().url().describe("Root URL to map"),
        limit: z.number().int().min(1).max(5000).optional(),
        search: z.string().max(500).optional().describe("Filter links by substring"),
        sitemap: z.enum(["only", "include", "skip"]).optional(),
        include_subdomains: z.boolean().optional(),
      }),
    },
  );

  const firecrawlCrawl = tool(
    async (input: {
      url: string;
      limit?: number;
      max_discovery_depth?: number;
      include_paths?: string[];
      exclude_paths?: string[];
      poll_interval_seconds?: number;
      timeout_seconds?: number;
    }) => {
      const app = createFirecrawlClient();
      return await app.crawl(input.url, {
        limit: input.limit ?? 20,
        maxDiscoveryDepth: input.max_discovery_depth,
        includePaths: input.include_paths,
        excludePaths: input.exclude_paths,
        scrapeOptions: {
          formats: ["markdown"],
          onlyMainContent: true,
        },
        pollInterval: input.poll_interval_seconds ?? 2,
        timeout: input.timeout_seconds ?? 120,
      });
    },
    {
      name: "firecrawl_crawl",
      description: `${FC_NOTE} Multi-page crawl from a start URL (polls until done). Keep limit low to control credits.`,
      schema: z.object({
        url: z.string().url().describe("Start URL"),
        limit: z.number().int().min(1).max(500).optional().describe("Max pages (default 20)"),
        max_discovery_depth: z.number().int().min(0).max(50).optional(),
        include_paths: z.array(z.string()).max(50).optional(),
        exclude_paths: z.array(z.string()).max(50).optional(),
        poll_interval_seconds: z.number().int().min(1).max(30).optional(),
        timeout_seconds: z.number().int().min(10).max(600).optional(),
      }),
    },
  );

  const firecrawlSearch = tool(
    async (input: {
      query: string;
      limit?: number;
      sources?: ("web" | "news" | "images")[];
    }) => {
      const app = createFirecrawlClient();
      return await app.search(input.query, {
        limit: input.limit ?? 5,
        sources: input.sources ?? ["web"],
      });
    },
    {
      name: "firecrawl_search",
      description: `${FC_NOTE} Web search with optional per-result scrape data. Overlaps Tavily; use Firecrawl when you need Firecrawl-normalized documents.`,
      schema: z.object({
        query: z.string().min(1).max(500).describe("Search query"),
        limit: z.number().int().min(1).max(20).optional(),
        sources: z.array(z.enum(["web", "news", "images"])).max(3).optional(),
      }),
    },
  );

  return [firecrawlScrape, firecrawlMap, firecrawlCrawl, firecrawlSearch] as const;
}
