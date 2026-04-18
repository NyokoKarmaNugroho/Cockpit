> **Scope:** Design patterns for a **future** Cockpit analysis API. This repository contains the **marketing frontend** only (`frontend/`). Wallet sessions, SSE, and agent loops apply when you implement a separate API service.

# Hermes-style agent runtime → Cockpit adaptation

This document distills concepts from **Hermes Agent** (Nous Research) and related time-series material, mapped to a **planned** Node/TypeScript API service, wallet sessions, and analysis SSE flow. It is **not** a port of Hermes; it records design patterns worth adapting. Product-facing agent responsibilities remain in `PRD.md` §7.6.

**Sources (read for full detail):**

- [Architecture](https://hermes-agent.nousresearch.com/docs/developer-guide/architecture)
- [Agent Loop Internals](https://hermes-agent.nousresearch.com/docs/developer-guide/agent-loop)
- [Prompt Assembly](https://hermes-agent.nousresearch.com/docs/developer-guide/prompt-assembly)
- [Context Compression and Caching](https://hermes-agent.nousresearch.com/docs/developer-guide/context-compression-and-caching)
- [Gateway Internals](https://hermes-agent.nousresearch.com/docs/developer-guide/gateway-internals)
- [Session Storage](https://hermes-agent.nousresearch.com/docs/developer-guide/session-storage)
- [Provider Runtime Resolution](https://hermes-agent.nousresearch.com/docs/developer-guide/provider-runtime)
- [ACP Internals](https://hermes-agent.nousresearch.com/docs/developer-guide/acp-internals)
- [Cron Internals](https://hermes-agent.nousresearch.com/docs/developer-guide/cron-internals)
- [Environments, Benchmarks & Data Generation](https://hermes-agent.nousresearch.com/docs/developer-guide/environments)
- [Trajectory Format](https://hermes-agent.nousresearch.com/docs/developer-guide/trajectory-format)
- [TimesFM (open source)](https://github.com/google-research/timesfm)
- [The TimesFM model (BigQuery)](https://docs.cloud.google.com/bigquery/docs/timesfm-model)

---

## 1. What to borrow (conceptually)

| Hermes idea | Cockpit adaptation |
|-------------|-------------------|
| Single **`AIAgent`** loop owning model ↔ tool turns | One runner per `Analysis` run: fixed phases, iteration caps, structured SSE events (`status`, `step`, `log`, `final`, `error`). |
| **`prompt_builder`**: layered system prompt + tool schemas | Server-side assembly only: stable “product” layers + workspace/project context; reject client-supplied system prompts except allowlisted overrides. |
| Three **API modes** (`chat_completions`, `codex_responses`, `anthropic_messages`) converging on OpenAI-shaped messages | Internal message type = OpenAI `role` / `content` / `tool_calls`; adapters per provider at the HTTP boundary. |
| **Mode resolution** (explicit arg → provider → URL heuristics → default) | One resolver module: env → workspace config → explicit request → defaults; log resolved `{ provider, api_mode, base_url }` on run start. |
| **Interruptible** HTTP (`_api_call_with_interrupt`) | `AbortSignal` on fetch; tie to SSE disconnect / user cancel; do not append partial assistant output to history on abort. |
| Tools: sequential vs **thread pool** for parallel | Default **sequential** for auditability; optional bounded parallelism for independent read-only tools with ordered SSE replay. |
| **Message alternation** (user/assistant; tool batches) | Validate history before each provider call; repair or reject malformed sequences. |
| **Iteration budgets** (parent + child delegates) | `maxTurns`, `maxToolCalls`, wall-clock; child runs get separate caps (Hermes-style delegation budgets). |
| **Dual compression** (gateway ~85% vs agent ~50% threshold) | “Early warning” trim vs full summarization pass; pluggable **ContextEngine**-style interface in TS. |
| **Anthropic prompt caching** (`system_and_3`) | If using Claude: stable system prefix + rolling breakpoints; avoid mutating cached prefix mid-run. |
| **Gateway** session keys + interrupt + auth | Map to: `wallet` + `workspace` + `analysisId` + optional thread; edge auth + in-loop policy before tools. |
| **Session DB** (SQLite + FTS + lineage) | Postgres: `analyses`, `analysis_events`, optional `messages` table + FTS for investigator search; `parent_analysis_id` for forks/branches. |
| **Provider runtime** + **fallback** | Shared resolver for CLI, API, cron, auxiliary summarizers; document which flows allow fallback vs hard-fail (structured outputs). |
| **ACP** (sync agent in worker thread + async cancel) | Long-running tools: worker boundary + cancel token; bridge events to SSE like Hermes bridges to ACP. |
| **Cron**: fresh agent, no history, recursion guard | Scheduled jobs: new run row, injected skills/config only; disable “schedule another job” tools in that profile. |
| **Environments / trajectories** | Optional JSONL export of runs (ShareGPT-like) for debugging; skip Atropos/RL stack unless building training pipelines. |
| **TimesFM / BigQuery** | Optional: warehouse-side **forecasting / anomaly** on aggregates (costs, queue depth, RPC error rates)—not for covert surveillance of individuals. |

---

## 2. Prompt assembly (cached vs ephemeral)

Hermes separates **cached system prompt state** from **ephemeral API-call additions** to preserve provider caching and clear memory semantics ([Prompt Assembly](https://hermes-agent.nousresearch.com/docs/developer-guide/prompt-assembly)).

**Cockpit mapping:**

1. **Stable layers** (hashable): product identity, safety, tool-use rules, skills index (if any), frozen snapshots of durable memory pointers (not full secrets).
2. **Project context** with explicit priority (Hermes order: `.hermes.md` / `HERMES.md` → `AGENTS.md` → `CLAUDE.md` → `.cursorrules`): Cockpit can use e.g. `COCKPIT.md` / `AGENTS.md` / `CLAUDE.md` with **first match** or explicit merge policy—document one rule.
3. **Ephemeral**: user task, run id, time range, chain focus—appended per turn, not baked into immutable cache keys.

Emit an optional SSE metadata event: **layer manifest** (names + hashes) for support, not full prompt text.

---

## 3. Agent loop and callbacks

The Hermes loop documents tool progress, thinking, reasoning, steps, and streaming callbacks ([Agent Loop Internals](https://hermes-agent.nousresearch.com/docs/developer-guide/agent-loop)).

**Cockpit mapping:** implement typed hooks (`onToolStart`, `onToolEnd`, `onToken`, `onStep`) that map 1:1 to SSE payloads so the HTTP layer stays thin.

---

## 4. Compression and caching

Hermes uses a **pluggable ContextEngine**, default lossy compressor, dual thresholds, and Anthropic cache breakpoints ([Context Compression and Caching](https://hermes-agent.nousresearch.com/docs/developer-guide/context-compression-and-caching)).

**Cockpit mapping:**

- Pipeline: prune stale long tool outputs → align boundaries (never split tool pairs) → summarize middle → preserve tail (`protect_last_n` equivalent).
- Emit SSE `context_compacted` with **before/after token estimates** (not full content) for audit-friendly logs.

---

## 5. Gateway-, session-, and provider-adjacent patterns

- **Session keys** in Hermes encode platform + chat (`agent:main:telegram:private:…`). Cockpit: `wallet` + `workspace` + `analysis` (+ thread) as the isolation key for concurrent runs and interrupts ([Gateway Internals](https://hermes-agent.nousresearch.com/docs/developer-guide/gateway-internals)).
- **Session persistence**: Hermes uses SQLite + FTS + `parent_session_id` ([Session Storage](https://hermes-agent.nousresearch.com/docs/developer-guide/session-storage)). Cockpit: Postgres + optional FTS; `parent_analysis_id` for forked reruns.
- **Provider resolution** precedence and **fallback** rules ([Provider Runtime Resolution](https://hermes-agent.nousresearch.com/docs/developer-guide/provider-runtime)): centralize; avoid shell env accidentally overriding saved workspace config.

---

## 6. ACP, cron, environments, trajectories

- **ACP**: JSON-RPC stdio, worker thread, cancel event ([ACP Internals](https://hermes-agent.nousresearch.com/docs/developer-guide/acp-internals)) — useful reference if Cockpit later exposes an editor-local agent; same cancel semantics as SSE.
- **Cron**: atomic `jobs.json`, tick scheduler, **fresh** agent per job, skill injection, recursion guard ([Cron Internals](https://hermes-agent.nousresearch.com/docs/developer-guide/cron-internals)) — map to optional “scheduled analysis” jobs writing to a dedicated event type so ops noise does not mix with user timelines.
- **Environments**: Atropos/Hermes RL harness ([Environments](https://hermes-agent.nousresearch.com/docs/developer-guide/environments)) — out of scope for MVP unless building RL/benchmarks.
- **Trajectory JSONL**: ShareGPT-compatible export for training/debug ([Trajectory Format](https://hermes-agent.nousresearch.com/docs/developer-guide/trajectory-format)) — optional export from completed runs; keep schema stable if enabled.

---

## 7. TimesFM (forecasting) — optional analytics lane

- **Open model**: [google-research/timesfm](https://github.com/google-research/timesfm) — time-series foundation model (Apache-2.0).
- **BigQuery ML**: [TimesFM in BigQuery](https://docs.cloud.google.com/bigquery/docs/timesfm-model) — forecasting/anomaly-style SQL workflows over large tables.
- **Deep dive (install, API, BQ vs sidecar, Dune pairing):** [timesfm-cockpit-adaptation.md](./timesfm-cockpit-adaptation.md).

**Ethical, product-appropriate uses** (aggregates / operations, not surveillance): expected baseline for RPC/indexer noise; workload and cost forecasting; reliability drift; contextualizing public volume seasonality vs one-off spikes.

---

## 8. Risks and tradeoffs (summary)

1. **Cancel vs consistency**: Abort mid-tool risks partial DB state unless tools are transactional or compensating actions are defined.
2. **Sequential vs parallel tools**: Parallelism reduces latency but complicates SSE ordering and failure attribution.
3. **Compression vs evidence**: Lossy summarization can drop detail investigators need—treat compression policy as a product/legal decision, not only an engineering default.

---

## 9. What not to port in v1

Skip Hermes-scale subsystems unless there is a concrete need: full **Atropos** env hierarchy, multi-backend terminal matrix, RL training modes, 10k-line **gateway** clones, or dataset pipelines aimed at HF-scale training. Prefer a **thin deterministic loop** (timeouts, budgets, abort), **Postgres-backed events**, and **optional** JSONL export / warehouse forecasting.

---

*Hermes Agent documentation is © Nous Research (MIT). Concepts are cited for engineering adaptation; Cockpit is an independent codebase. TimesFM is Google Research open source; BigQuery usage is subject to Google Cloud terms.*
