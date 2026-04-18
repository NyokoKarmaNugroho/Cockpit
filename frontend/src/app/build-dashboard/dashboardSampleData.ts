/** Sample series for Chart.js — swap with live queries later. */
export const kpi = {
  alertsOpen: 24,
  alertsDelta: 12,
  casesActive: 8,
  exposureUsd: 1_840_000,
  taintAvgPct: 3.2,
};

export const volumeByWeek = {
  labels: ["W1", "W2", "W3", "W4", "W5", "W6"],
  investigations: [42, 38, 55, 49, 61, 58],
  enriched: [28, 31, 36, 34, 44, 41],
};

export const riskMix = {
  labels: ["Sanctions", "High taint", "Structuring-like", "Clean"],
  values: [8, 14, 22, 156],
};

export type InvestigationRow = {
  id: string;
  entity: string;
  chain: string;
  risk: "low" | "med" | "high";
  updated: string;
  owner: string;
};

export const tableRows: InvestigationRow[] = [
  { id: "INV-2041", entity: "Cluster A-91", chain: "Solana", risk: "high", updated: "2026-04-16", owner: "Ops" },
  { id: "INV-2038", entity: "Bridge hop #12", chain: "ETH", risk: "med", updated: "2026-04-15", owner: "AML" },
  { id: "INV-2032", entity: "OTC desk X", chain: "Multi", risk: "low", updated: "2026-04-14", owner: "Ops" },
  { id: "INV-2029", entity: "Mixer peel", chain: "BTC", risk: "high", updated: "2026-04-14", owner: "Research" },
  { id: "INV-2021", entity: "Stable exit path", chain: "Solana", risk: "med", updated: "2026-04-12", owner: "AML" },
];
