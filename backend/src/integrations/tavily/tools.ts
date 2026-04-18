import { tool } from "langchain";
import { z } from "zod";
import { createTavilyClient } from "./client.js";

export function createTavilyTools() {
  const tavilySearch = tool(
    async (input: {
      query: string;
      max_results?: number;
      topic?: "general" | "news" | "finance";
      search_depth?: "basic" | "advanced";
      time_range?: "day" | "week" | "month" | "year";
      include_domains?: string[];
      exclude_domains?: string[];
    }) => {
      const tvly = createTavilyClient();
      return await tvly.search(input.query, {
        max_results: input.max_results,
        topic: input.topic,
        search_depth: input.search_depth,
        time_range: input.time_range,
        include_domains: input.include_domains,
        exclude_domains: input.exclude_domains,
      });
    },
    {
      name: "tavily_search",
      description:
        "Web search via Tavily. Returns ranked results (url/title/content/score). Use to find sources quickly; prefer include_domains for official docs/regulators.",
      schema: z.object({
        query: z.string().describe("Natural language search query"),
        max_results: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe("Maximum number of results (default Tavily: 5)"),
        topic: z
          .enum(["general", "news", "finance"])
          .optional()
          .describe("Search category"),
        search_depth: z
          .enum(["basic", "advanced"])
          .optional()
          .describe("Search depth (basic is faster/cheaper)"),
        time_range: z
          .enum(["day", "week", "month", "year"])
          .optional()
          .describe("Filter by publish date range"),
        include_domains: z
          .array(z.string())
          .max(300)
          .optional()
          .describe("Only include these domains"),
        exclude_domains: z
          .array(z.string())
          .max(150)
          .optional()
          .describe("Exclude these domains"),
      }),
    },
  );

  const tavilyExtract = tool(
    async (input: { urls: string[] }) => {
      const tvly = createTavilyClient();
      // SDK accepts (urls: string[]) and returns { results, failedResults }.
      return await tvly.extract(input.urls);
    },
    {
      name: "tavily_extract",
      description:
        "Extract clean page content for one or more URLs via Tavily. Use after search to fetch full text for a small set of sources.",
      schema: z.object({
        urls: z.array(z.string().url()).min(1).max(20).describe("URLs to extract"),
      }),
    },
  );

  const tavilyMap = tool(
    async (input: {
      url: string;
      max_depth?: number;
      limit?: number;
      instructions?: string;
    }) => {
      const tvly = createTavilyClient();
      return await tvly.map(input.url, {
        max_depth: input.max_depth,
        limit: input.limit,
        instructions: input.instructions,
      });
    },
    {
      name: "tavily_map",
      description:
        "Discover site structure (URL list) via Tavily Map. Use to cheaply enumerate docs paths before crawling or extracting.",
      schema: z.object({
        url: z.string().url().describe("Base URL to map"),
        max_depth: z.number().int().min(1).max(5).optional(),
        limit: z.number().int().min(1).max(500).optional(),
        instructions: z
          .string()
          .optional()
          .describe("Natural language guidance to focus discovery"),
      }),
    },
  );

  const tavilyCrawl = tool(
    async (input: {
      url: string;
      max_depth?: number;
      limit?: number;
      select_paths?: string[];
      exclude_paths?: string[];
      instructions?: string;
    }) => {
      const tvly = createTavilyClient();
      return await tvly.crawl(input.url, {
        max_depth: input.max_depth,
        limit: input.limit,
        select_paths: input.select_paths,
        exclude_paths: input.exclude_paths,
        instructions: input.instructions,
      });
    },
    {
      name: "tavily_crawl",
      description:
        "Crawl a site and extract content across pages via Tavily Crawl. Use for docs ingestion; always set a limit to control cost.",
      schema: z.object({
        url: z.string().url().describe("Start URL to crawl"),
        max_depth: z.number().int().min(1).max(5).optional(),
        limit: z.number().int().min(1).max(200).optional(),
        select_paths: z
          .array(z.string())
          .optional()
          .describe("Regex-like path filters to include"),
        exclude_paths: z
          .array(z.string())
          .optional()
          .describe("Regex-like path filters to exclude"),
        instructions: z
          .string()
          .optional()
          .describe("Natural language guidance to focus extraction"),
      }),
    },
  );

  return [tavilySearch, tavilyExtract, tavilyMap, tavilyCrawl] as const;
}

