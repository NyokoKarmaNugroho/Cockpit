import { tool } from "langchain";
import { z } from "zod";
import { runKatana } from "./client.js";

/**
 * LangChain tools wrapping the ProjectDiscovery Katana CLI (local/server subprocess).
 * @see https://github.com/projectdiscovery/katana
 */
export function createKatanaTools() {
  const katanaCrawl = tool(
    async (input: {
      url: string;
      depth?: number;
      max_output_lines?: number;
      rate_limit_per_second?: number;
      timeout_seconds?: number;
      concurrency?: number;
    }) => {
      const result = await runKatana({
        url: input.url,
        depth: input.depth,
        maxOutputLines: input.max_output_lines,
        rateLimitPerSecond: input.rate_limit_per_second,
        timeoutSeconds: input.timeout_seconds,
        concurrency: input.concurrency,
      });
      if (!result.ok) {
        return { error: result.error };
      }
      return {
        entries: result.entries,
        total_lines: result.totalLines,
        truncated: result.truncated,
        ...(result.stderr ? { katana_stderr: result.stderr } : {}),
      };
    },
    {
      name: "katana_crawl",
      description:
        "Crawl a web application from a seed http(s) URL using ProjectDiscovery Katana (CLI on the Cockpit backend host). Returns JSONL-derived rows (URLs/endpoints discovered). Use for authorized attack-surface or OSINT URL discovery; always respect robots/terms and rate limits. Disabled when KATANA_ENABLED=false or binary missing.",
      schema: z.object({
        url: z
          .string()
          .url()
          .describe("Seed URL to crawl (http or https only)"),
        depth: z
          .number()
          .int()
          .min(1)
          .max(5)
          .optional()
          .describe("Maximum crawl depth (default 2)"),
        max_output_lines: z
          .number()
          .int()
          .min(10)
          .max(5000)
          .optional()
          .describe("Max result lines to return (truncates; default from KATANA_MAX_OUTPUT_LINES or 500)"),
        rate_limit_per_second: z
          .number()
          .int()
          .min(1)
          .max(150)
          .optional()
          .describe("Katana -rl requests per second cap"),
        timeout_seconds: z
          .number()
          .int()
          .min(5)
          .max(300)
          .optional()
          .describe("Per-request timeout passed to Katana (-timeout)"),
        concurrency: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Concurrent fetchers (-c)"),
      }),
    },
  );

  return [katanaCrawl] as const;
}
