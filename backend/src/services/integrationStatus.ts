import { isSupabaseAnalysesEnabled } from "../lib/supabaseAdmin.js";

export type IntegrationStatusItem = {
  id: string;
  label: string;
  category: "model" | "data" | "osint" | "platform";
  configured: boolean;
  envVars: string[];
  note: string;
};

function hasValue(value?: string | null): boolean {
  return !!value?.trim();
}

function isEnabled(value?: string | null, defaultValue = true): boolean {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return defaultValue;
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export function getIntegrationStatuses(): IntegrationStatusItem[] {
  return [
    {
      id: "openrouter",
      label: "OpenRouter",
      category: "model",
      configured: hasValue(process.env.OPENROUTER_API_KEY),
      envVars: ["OPENROUTER_API_KEY"],
      note: "Primary LLM provider for Cockpit analysis runs.",
    },
    {
      id: "chainalysis",
      label: "Chainalysis Sanctions",
      category: "data",
      configured: hasValue(process.env.CHAINALYSIS_API_KEY),
      envVars: ["CHAINALYSIS_API_KEY"],
      note: "Address sanctions screening for OFAC-aligned checks.",
    },
    {
      id: "dune-sim",
      label: "Dune Sim",
      category: "data",
      configured: hasValue(process.env.SIM_API_KEY),
      envVars: ["SIM_API_KEY", "SIM_API_BASE_URL"],
      note: "Simulation and blockchain data queries.",
    },
    {
      id: "firecrawl",
      label: "Firecrawl",
      category: "osint",
      configured: isEnabled(process.env.FIRECRAWL_ENABLED) && hasValue(process.env.FIRECRAWL_API_KEY),
      envVars: ["FIRECRAWL_ENABLED", "FIRECRAWL_API_KEY", "FIRECRAWL_API_URL"],
      note: "Hosted crawl/scrape pipeline for websites and documents.",
    },
    {
      id: "tavily",
      label: "Tavily",
      category: "osint",
      configured: hasValue(process.env.TAVILY_API_KEY),
      envVars: ["TAVILY_API_KEY"],
      note: "Search and evidence retrieval for external web research.",
    },
    {
      id: "shodan",
      label: "Shodan",
      category: "osint",
      configured: hasValue(process.env.SHODAN_API_KEY),
      envVars: ["SHODAN_API_KEY"],
      note: "Infrastructure search for exposed internet services.",
    },
    {
      id: "hudson-rock",
      label: "Hudson Rock",
      category: "osint",
      configured: isEnabled(process.env.HUDSON_ROCK_ENABLED) && hasValue(process.env.HUDSON_ROCK_BASE_URL),
      envVars: ["HUDSON_ROCK_ENABLED", "HUDSON_ROCK_BASE_URL"],
      note: "Community infostealer OSINT endpoints.",
    },
    {
      id: "seal-intel",
      label: "SEAL Intel",
      category: "osint",
      configured:
        isEnabled(process.env.SEAL_INTEL_ENABLED) &&
        hasValue(process.env.SEAL_INTEL_OPENCTI_HOST) &&
        hasValue(process.env.SEAL_INTEL_API_KEY) &&
        hasValue(process.env.SEAL_INTEL_IDENTITY_ID),
      envVars: [
        "SEAL_INTEL_ENABLED",
        "SEAL_INTEL_OPENCTI_HOST",
        "SEAL_INTEL_API_KEY",
        "SEAL_INTEL_IDENTITY_ID",
      ],
      note: "Threat-intel enrichment via Security Alliance OpenCTI.",
    },
    {
      id: "katana",
      label: "Katana CLI",
      category: "osint",
      configured: isEnabled(process.env.KATANA_ENABLED, false),
      envVars: ["KATANA_ENABLED", "KATANA_BIN", "KATANA_MAX_OUTPUT_LINES"],
      note: "Local crawler binary for scoped recon workflows.",
    },
    {
      id: "jupiter-ultra",
      label: "Jupiter Ultra",
      category: "data",
      configured: hasValue(process.env.JUPITER_ULTRA_API_KEY),
      envVars: ["JUPITER_ULTRA_API_KEY", "JUPITER_ULTRA_ORDER_URL"],
      note: "Swap-order proxy used by market and token workflows.",
    },
    {
      id: "supabase",
      label: "Supabase persistence",
      category: "platform",
      configured: isSupabaseAnalysesEnabled(),
      envVars: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
      note: "Persistent analyses, workspace auth, and case storage.",
    },
  ];
}
