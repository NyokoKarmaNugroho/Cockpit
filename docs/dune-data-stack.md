> **Scope:** How Dune/Sim fit investigation-style workflows. This repo has **no** backend client; implement Sim/Dune calls in your **API service**. This note is reference material.

# Dune data stack → Cockpit

How [Dune](https://dune.com) products fit **compliance / investigation** style workflows and how a Cockpit **API service** can wire **Sim** (real-time wallet APIs). Official doc indexes: [Dune `llms.txt`](https://docs.dune.com/llms.txt), [Sim `llms.txt`](https://docs.sim.dune.com/llms.txt).

## Product map (what each surface is for)

| Surface | Role | Doc |
|--------|------|-----|
| **Use cases — Accounting, Audit & AML** | Transaction monitoring, reconciliation, reporting, AML-style investigations; positions Dune vs. generic “crypto charts.” | [Accounting, Audit & AML](https://docs.dune.com/docs/use-cases/accounting-audit-aml.md) |
| **Datashare** | Replicate Dune’s curated tables into **your** Snowflake / BigQuery — join on-chain data with internal KYC, cases, GL in the warehouse; queries never leave your VPC. | [Datashare overview](https://docs.dune.com/datashare/datashare.md) |
| **Data Hub** | SQL (DuneSQL), dashboards, schedules, alerts in the **browser** — analyst-first exploration on shared Dune infra. | [Data Hub overview](https://docs.dune.com/web-app/overview.md) |
| **Data catalog** | Raw / decoded / curated datasets across **100+ chains**; pick tables before writing SQL or API jobs. | [Data catalog](https://docs.dune.com/data-catalog/overview.md) |
| **Data API** | Programmatic **saved query execution**, pipelines, uploads, credits — integrate compliance reports or scheduled extracts into a Cockpit **API service**. | [Data API overview](https://docs.dune.com/api-reference/api-overview.md) |
| **Dune MCP** | Remote MCP (`https://api.dune.com/mcp/v1`) so agents discover tables, run SQL, fetch executions — OAuth or `x-dune-api-key`. | [Dune MCP](https://docs.dune.com/api-reference/agents/mcp.md) |
| **Sim (Dune Sim API)** | **Real-time** balances, activity, txs, token info, webhooks (CU-based); complements **historical** Dune SQL. | [Sim docs](https://docs.sim.dune.com), [LLMs & AI tools](https://docs.sim.dune.com/build-with-ai.md), [Agent reference](https://docs.sim.dune.com/agent-reference.md) |

## How this maps to Cockpit

| Need | Prefer | Cockpit today |
|------|--------|----------------|
| Hot wallet view, activity, Solana/EVM reads in an agent tool | **Sim API** (`X-Sim-Api-Key`) | Implement a Sim client server-side; env `SIM_API_KEY` (never in Vite) |
| Custom SQL over historical decoded data, scheduled reports | **Data Hub** + **Data API** | Add `DUNE_API_KEY` (or team token) server-side; call [executions API](https://docs.dune.com/api-reference/api-overview.md); never expose in Vite |
| Warehouse-native joins (cases × on-chain) | **Datashare** | Ops / data team: grant share to BigQuery/Snowflake; Cockpit reads aggregates via your existing warehouse client, not necessarily Dune HTTP |
| IDE / Cursor agent helping write Sim or Dune SQL | **Sim agent reference** + optional **Dune MCP** | Add MCP in Cursor per Dune docs; index `docs.sim.dune.com` per [Build with AI](https://docs.sim.dune.com/build-with-ai.md) |

## Sim specifics (agents)

- Full LLM-oriented index: [`https://docs.sim.dune.com/llms-full.txt`](https://docs.sim.dune.com/llms-full.txt)  
- Per-page Markdown: append `.md` to doc URLs (e.g. [`evm/activity.md`](https://docs.sim.dune.com/evm/activity.md)).  
- OpenAPI: [`openapi.json`](https://docs.sim.dune.com/openapi.json) (also on [GitHub](https://github.com/duneanalytics/sim-docs/blob/main/openapi.json)).  
- **Rules of thumb:** explicit `chain_ids` for predictable CUs; only use `next_offset` for pagination; check `warnings` on 200; keep keys server-side ([Cloudflare proxy pattern](https://docs.sim.dune.com/proxy.md)).

## Dune MCP (quick reference)

- URL: `https://api.dune.com/mcp/v1`  
- Auth: OAuth (browser) or header `x-dune-api-key` / query `api_key`  
- Long-running tools: some clients need increased MCP **tool timeout** (see Dune MCP doc for Codex workaround).

## Compliance posture

Dune’s AML/accounting page describes **monitoring and reporting** patterns, not a substitute for legal advice or your sanctions program. Pair **warehouse / API analytics** with explicit checks (e.g. [Chainalysis public Sanctions API](./chainalysis-sanctions-api.md) server-side) where your policy requires it.

## See also

- [Helius + RPC Fast (Solana RPC)](./rpc-helius-rpcfast-cockpit.md) — on-chain JSON-RPC, Sender, streaming; complements Dune **analytics** APIs.
- [Tavily (web search / crawl / extract)](./tavily-cockpit-adaptation.md) — web intelligence primitives; complements on-chain + warehouse sources.

---

*Vendor trademarks belong to their owners. Use Dune and Sim per their terms and your org’s data handling policies.*
