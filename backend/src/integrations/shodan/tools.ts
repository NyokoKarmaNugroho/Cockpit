import { tool } from "langchain";
import { z } from "zod";
import {
  SHODAN_ONION_RESEARCH_QUERY_TECHNIQUES,
  shodanHostCount,
  shodanHostIp,
  shodanHostSearch,
} from "./client.js";

const SHODAN_SEARCH_DESC = `Search Shodan banners (GET /shodan/host/search). Uses Shodan query syntax and filters (https://www.shodan.io/search/filters). Consumes API query credits per Shodan rules when filters or paging apply.

For research into hosts that may expose **Tor / .onion-related** indicators in indexed data, three common **query techniques** (run as separate searches or combined with AND/OR carefully):
${SHODAN_ONION_RESEARCH_QUERY_TECHNIQUES.map(
  (t) =>
    `${t.technique}. **${t.name}** — ${t.description} Example queries: ${t.example_queries.join(", ")}`,
).join("\n")}

Always operate within authorization, Shodan terms, and law; Shodan does not index the Tor network itself—results are clearnet/internet-facing systems that may reference onion strings or Tor-related software.`;

export function createShodanTools() {
  const shodanSearch = tool(
    async (input: { query: string; page?: number; facets?: string }) => {
      return await shodanHostSearch(input.query, {
        page: input.page,
        facets: input.facets,
      });
    },
    {
      name: "shodan_search",
      description: SHODAN_SEARCH_DESC,
      schema: z.object({
        query: z
          .string()
          .min(1)
          .max(2000)
          .describe("Shodan search query (filters as filter:value, e.g. port:443 country:US)"),
        page: z.number().int().min(1).max(1000).optional().describe("Results page (100 per page; extra pages may use credits)"),
        facets: z
          .string()
          .optional()
          .describe("Comma-separated facet properties (e.g. org,country) for summary buckets"),
      }),
    },
  );

  const shodanCount = tool(
    async (input: { query: string; facets?: string }) => {
      return await shodanHostCount(input.query, { facets: input.facets });
    },
    {
      name: "shodan_count",
      description:
        "Shodan search without host rows (GET /shodan/host/count) — returns total and optional facet summaries only; does not consume query credits the same way as full search. Use to estimate result set size before paging shodan_search.",
      schema: z.object({
        query: z.string().min(1).max(2000).describe("Same Shodan query syntax as shodan_search"),
        facets: z.string().optional().describe("Comma-separated facets for breakdown"),
      }),
    },
  );

  const shodanHost = tool(
    async (input: { ip: string; history?: boolean; minify?: boolean }) => {
      return await shodanHostIp(input.ip, {
        history: input.history,
        minify: input.minify,
      });
    },
    {
      name: "shodan_host",
      description:
        "Host intelligence for a single IPv4/IPv6 address (GET /shodan/host/{ip}): services, banners, ports. Use after IPs appear in shodan_search. Optional history=all banners; minify=ports + summary only.",
      schema: z.object({
        ip: z.string().min(3).max(128).describe("Host IP address"),
        history: z.boolean().optional().describe("Include historical banners"),
        minify: z.boolean().optional().describe("Only ports + general host info, no full banners"),
      }),
    },
  );

  const shodanOnionMethodology = tool(
    async () => ({
      techniques: SHODAN_ONION_RESEARCH_QUERY_TECHNIQUES,
      note: "These are example query families for Shodan — verify filters against current Shodan documentation. Not legal or attribution advice.",
    }),
    {
      name: "shodan_onion_research_methodology",
      description:
        "Returns the three documented query-technique families for locating internet-facing servers whose indexed banners may reference .onion / Tor-related indicators (no API call, no credits). Pair with shodan_search using example_queries as starting points.",
      schema: z.object({}),
    },
  );

  return [shodanSearch, shodanCount, shodanHost, shodanOnionMethodology] as const;
}
