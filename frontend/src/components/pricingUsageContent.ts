/** Copy for the “How usage maps to price” block — single source for layout + a11y. */
export const PRICING_USAGE_ITEMS = [
  {
    title: "Agent tool calls",
    body:
      "Each retrieval, graph step, or screening action your agents invoke counts toward your monthly envelope. Free includes a small allowance; on paid tiers, overage is billed in blocks or you can move up.",
  },
  {
    title: "Tracer canvases",
    body:
      "Live graph sessions for address trails and case workspaces. Free allows one canvas; Starter keeps a modest active set; Team and Enterprise lift or remove that cap.",
  },
  {
    title: "Chains & data sources",
    body:
      "Core bundles include high-throughput Solana and EVM coverage via partner RPC and indexed datasets. Enterprise adds custom indexers and private feeds where contractually available.",
  },
  {
    title: "Compliance & audit",
    body:
      "Exports with citations and human checkpoints scale with Team and Enterprise. Free and Starter include basic exports suitable for internal review.",
  },
] as const;
