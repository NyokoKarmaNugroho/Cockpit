> **Scope:** RPC and streaming options for Solana apps. The marketing site does **not** embed RPC keys; use a **server-side proxy** or env in your API service. This note is reference material.

# Helius + RPC Fast (Solana RPC) → Cockpit

How **[Helius](https://www.helius.dev)** and **[RPC Fast](https://docs.rpcfast.com)** fit **read RPC**, **transaction landing**, and **streaming** for a Solana-heavy app. Official doc indexes: [Helius `llms.txt`](https://www.helius.dev/llms.txt), [RPC Fast `llms.txt`](https://docs.rpcfast.com/llms.txt).

This is **engineering guidance**, not a vendor comparison scorecard. Pick providers per latency, SLAs, compliance, and contract—not logo order.

---

## 1. Helius — product map

| Surface | Role | Entry doc |
|--------|------|-------------|
| **Solana RPC (HTTP)** | Standard JSON-RPC with Helius routing and enhanced indexing where applicable | [RPC overview](https://www.helius.dev/docs/solana-rpc-nodes.md), [HTTP API index](https://www.helius.dev/docs/api-reference/rpc/http/llms.txt) |
| **Gatekeeper (Edge)** | Optional **lower-latency** RPC/WSS host; **same API key**—swap `mainnet.helius-rpc.com` → **`beta.helius-rpc.com`** (HTTP + `wss://`) | [Migration guide](https://www.helius.dev/docs/gatekeeper/migration-guide.md), [Overview](https://www.helius.dev/docs/gatekeeper/overview.md) |
| **WebSockets** | Subscriptions for slots, accounts, logs, etc.; Helius positions streaming as **LaserStream-backed** for standard WSS | [WebSocket docs](https://www.helius.dev/docs/rpc/websocket.md), [WS API index](https://www.helius.dev/docs/api-reference/rpc/websocket/llms.txt) |
| **Enhanced WebSockets** | **`accountSubscribe`**, **`transactionSubscribe`**, filters, parsed tx payloads (plan-gated vs standard WSS) | [accountSubscribe](https://www.helius.dev/docs/enhanced-websockets/account-subscribe.md), [transactionSubscribe](https://www.helius.dev/docs/enhanced-websockets/transaction-subscribe.md), [gRPC / LaserStream](https://www.helius.dev/docs/grpc/quickstart.md), [endpoints](https://www.helius.dev/docs/api-reference/endpoints) |
| **LaserStream (gRPC)** | Low-latency streams, historical replay, auto-reconnect—alternative to self-hosted **Yellowstone**-style gRPC | [LaserStream](https://www.helius.dev/docs/laserstream.md), [LaserStream gRPC](https://www.helius.dev/docs/laserstream/grpc.md) |
| **DAS API** | Digital Asset Standard: assets by owner, search, compressed NFTs, metadata—prefer over raw `getProgramAccounts` for many wallet UIs | [DAS / asset guides](https://www.helius.dev/blog/all-you-need-to-know-about-solanas-new-das-api.md) |
| **Helius Sender** | `sendTransaction` over HTTPS routes aimed at **high landing rate** (staked paths + **Jito** per Helius messaging) | [Sender](https://www.helius.dev/docs/sender), [Sender API index](https://www.helius.dev/docs/api-reference/sender/llms.txt) |
| **Priority Fee API** | Estimate fees from accounts or serialized txs | [Priority Fee API](https://www.helius.dev/docs/priority-fee-api.md) |
| **Webhooks** | Event-driven notifications (tx types, NFT events, etc.) | [Webhooks](https://www.helius.dev/docs/webhooks.md), [webhooks API index](https://www.helius.dev/docs/api-reference/webhooks/llms.txt) |
| **Enhanced / parsed transactions** | Human-friendly transaction history for explorers and compliance-style review | [Enhanced transactions](https://www.helius.dev/docs) (see llms index) |
| **Account / key safety** | Dashboard access rules, **secure URL**, **RPC proxy**; rotation and usage monitoring | [Protect your keys](https://www.helius.dev/docs/rpc/protect-your-keys.md), [helius-rpc-proxy (Cloudflare Worker)](https://github.com/helius-labs/helius-rpc-proxy) |
| **Sending transactions (manual)** | Production patterns beyond a single `sendTransaction` call | [Sending overview](https://www.helius.dev/docs/sending-transactions/overview.md), [send manually](https://www.helius.dev/docs/sending-transactions/send-manually.md) |
| **Historical / archival RPC** | Full chain history; standard methods plus enhanced history for wallets and compliance-style timelines | [Historical data overview](https://www.helius.dev/docs/rpc/historical-data.md), [getTransactionsForAddress](https://www.helius.dev/docs/rpc/gettransactionsforaddress.md) |
| **Indexing (build your own DB)** | Pattern for backfilling Postgres/ClickHouse and staying current via streams | [How to index Solana data](https://www.helius.dev/docs/rpc/how-to-index-solana-data.md) |
| **Wallet API (Beta)** | REST bundle for identity, balances, history, transfers, funded-by (`api.helius.xyz`) | [Wallet API overview](https://www.helius.dev/docs/wallet-api/overview.md) |
| **RPC optimization** | CU simulation, priority fees, batched reads, V2 pagination, WSS vs polling, commitment choice, retries | [Optimization techniques](https://www.helius.dev/docs/rpc/optimization-techniques.md), [Optimizing transactions](https://www.helius.dev/docs/sending-transactions/optimizing-transactions.md) |

**Auth model (typical):** API key as **`?api-key=`** on RPC and WSS URLs. **Do not** embed that key in a public frontend bundle; proxy through your backend or use **keyless** surfaces only where documented.

**Helius Sender note:** Helius documents a **keyless HTTPS** Sender surface (commonly `https://sender.helius-rpc.com/fast` with JSON-RPC `sendTransaction` and **no API key in the URL**). Cockpit previously shipped a small browser helper for this path; it has been removed in favor of **server-mediated** submission (or another trusted client) so you can enforce auth, quotas, and abuse controls before landing user-controlled transactions.

### 1.1 Enhanced WebSockets — `accountSubscribe` and `transactionSubscribe`

Helius documents these on the **same WebSocket hosts** as standard Solana WSS (`wss://mainnet.helius-rpc.com`, `wss://devnet.helius-rpc.com`) with **`?api-key=`** auth ([endpoints](https://www.helius.dev/docs/api-reference/endpoints)). If you use **Gatekeeper** for mainnet, use **`wss://beta.helius-rpc.com`** instead (§1.3). Treat the key like any RPC secret: **Node/backend or worker**, not a bundled browser app.

#### [`accountSubscribe`](https://www.helius.dev/docs/enhanced-websockets/account-subscribe.md)

- **Purpose:** Subscribe to one **account pubkey** (base58); receive **`accountNotification`** when **lamports** or **account data** changes (matches [Solana’s WebSocket accountSubscribe](https://solana.com/docs/rpc/websocket#accountsubscribe) behavior).
- **Params:** pubkey (required); optional object with **`encoding`** (`base58` default, `base64`, `base64+zstd`, `jsonParsed`) and **`commitment`** (`finalized` default, `confirmed`, `processed`).
- **Ops:** Send periodic **WebSocket ping** (e.g. every 30s) so idle subscriptions are not dropped ([Helius example](https://www.helius.dev/docs/enhanced-websockets/account-subscribe.md)).
- **Cockpit mapping:** Watch a **program config PDA**, treasury vault, or escrow account from a **server-side** connector; forward normalized events to **SSE** or your job queue for investigator dashboards—avoid exposing subscription targets or API keys to the client.

#### [`transactionSubscribe`](https://www.helius.dev/docs/enhanced-websockets/transaction-subscribe.md)

- **Purpose:** Stream **`transactionNotification`** for txs matching a **`TransactionSubscribeFilter`**.
- **Filter (high level):** `vote`, `failed`, `signature`, **`accountInclude`** / **`accountExclude`** / **`accountRequired`** (OR vs AND semantics per field—see doc). Helius notes filters can include **up to ~50,000 addresses** in those arrays (verify current limits in billing/docs).
- **Options:** `commitment`, `encoding`, **`transactionDetails`** (`full`, `signatures`, `accounts`, `none`), `showRewards`, **`maxSupportedTransactionVersion`** (set to **`0`** if you need **v0 + legacy** and **`transactionDetails` of `accounts` or `full`** per Helius [note](https://www.helius.dev/docs/enhanced-websockets/transaction-subscribe.md)).
- **Lifecycle:** Subscribe response returns a **subscription id**; use **`transactionUnsubscribe`** with that id to tear down; a few in-flight messages may arrive after unsubscribe.
- **Cockpit mapping:** Tail **program allowlists** (e.g. known DEX program IDs) for **indexer / alert** pipelines; pair with HTTP **DAS `getAsset`** or RPC for enrichment (patterns in the doc, e.g. Jupiter DCA / pump.fun examples—reuse only where product policy allows).

### 1.2 RPC optimization — performance and cost

Helius summarizes latency, credit usage, and reliability patterns in [**Solana RPC optimization: performance and cost best practices**](https://www.helius.dev/docs/rpc/optimization-techniques.md). Cockpit should adopt these on any **backend RPC proxy** or worker.

| Theme | Practice (see guide for code) |
|--------|-------------------------------|
| **Transactions** | **`simulateTransaction`** to read `unitsConsumed`, then **`ComputeBudgetProgram.setComputeUnitLimit`** with a margin (e.g. ceil × 1.1). Use **`getPriorityFeeEstimate`** (or the [Priority Fee API](https://www.helius.dev/docs/priority-fee-api.md)) and **`setComputeUnitPrice`**. Prefer **`sendRawTransaction`** with explicit retry/confirm policy (`skipPreflight` / `maxRetries` tradeoffs per doc). |
| **Large reads** | Prefer **`getProgramAccountsV2`** / **`getTokenAccountsByOwnerV2`** with **cursor `paginationKey`**, **bounded `limit`**, and optional **`changedSinceSlot`** for incremental sync—avoid unbounded `getProgramAccounts` timeouts. |
| **Account reads** | **`dataSlice`** on `getAccountInfo` when only part of account data is needed; **`getMultipleAccountsInfo`** to batch pubkeys. |
| **Token balances** | **`jsonParsed`** on `getTokenAccountsByOwner` so amounts are available without **N+1** `getTokenAccountBalance` calls. |
| **Tx history** | Prefer **`getTransactionsForAddress`** (§6.2) over **`getSignaturesForAddress` + `getTransaction`** loops for full history including ATAs—fewer round-trips (see guide’s “Transaction history” comparison). |
| **Live updates** | **WebSocket** subscriptions (`onAccountChange`, **`logsSubscribe`**, §1.1 Enhanced methods) instead of **polling** `getAccountInfo` on an interval. |
| **Resilience** | Exponential backoff on **429** / rate limits; **chunk** large in-memory result sets before follow-up RPCs; optional **round-robin `Connection`** pool across endpoints (keys stay server-side). |
| **Commitment** | Match **processed** / **confirmed** / **finalized** to the risk of the action (guide gives rule-of-thumb latencies—treat as order-of-magnitude, not SLAs). |
| **Hygiene** | Close subscriptions; cache idempotent reads; avoid **`finalized`** when **`confirmed`** suffices. |

**Cockpit:** encode the above in the **analysis agent tool layer** and any **indexer workers** so investigator runs stay inside **credit and rate** budgets; log **RPC method + latency** in structured events for support, not raw API keys.

### 1.3 Gatekeeper — optional RPC / WebSocket host swap

**Gatekeeper** is Helius’s **edge** entry point for mainnet JSON-RPC and standard WebSockets: replace the hostname **`mainnet.helius-rpc.com`** with **`beta.helius-rpc.com`**, keep **`?api-key=`** unchanged ([migration guide](https://www.helius.dev/docs/gatekeeper/migration-guide.md)). **WebSockets** use **`wss://beta.helius-rpc.com/?api-key=…`** instead of `wss://mainnet…`.

| Step | Action |
|------|--------|
| **Migrate** | Point `Connection` / `fetch` RPC URL and any **`accountSubscribe` / `logsSubscribe`** WSS URL at **`beta.helius-rpc.com`**. |
| **Validate** | Exercise auth (401 usually means missing `api-key`), latency vs production region, and **429** behavior. |
| **Roll out** | Use **`SOLANA_RPC_URL`** / **`USE_HELIUS_GATEKEEPER`** (or a feature flag) for gradual or percentage rollout; see guide examples. |
| **Rollback** | Revert host to **`mainnet.helius-rpc.com`** (and matching `wss://`) with the same key. |

Helius states Gatekeeper responses should match the standard endpoint; if formats diverge, treat as a support issue. **Sender** (`sender.helius-rpc.com`) is **not** part of this hostname swap in the published migration doc—only **RPC + WSS** hosts listed there.

**Cockpit:** centralize **`buildHeliusRpcUrl()` / `buildHeliusWsUrl()`** in the backend so one env flip enables Gatekeeper for proxies, workers, and §1.1 connectors without scattering literals.

### 1.4 Protecting Helius API keys

Primary reference: [**Protect your Solana API keys**](https://www.helius.dev/docs/rpc/protect-your-keys.md). Client-side or leaked **`?api-key=`** URLs can drive **quota exhaustion**, **unexpected charges**, and **unauthorized data access**.

| Layer | What it is | Cockpit note |
|--------|------------|----------------|
| **Your own RPC proxy** | Helius publishes **[helius-rpc-proxy](https://github.com/helius-labs/helius-rpc-proxy)** — a **Cloudflare Worker** that forwards JSON-RPC and **WebSockets** to Helius while keeping **`HELIUS_API_KEY`** as an **encrypted Worker secret**. Point browsers/SDKs at the **worker URL** instead of `mainnet.helius-rpc.com/?api-key=…`. | Strong default if the frontend needs read RPC without a full Cockpit API: tighten **`CORS_ALLOW_ORIGIN`**, consider **Cloudflare WAF**, and (per repo README) restrict the Helius key in the dashboard to **Cloudflare egress IPs** ([cloudflare.com/ips](https://www.cloudflare.com/ips-v4)). |
| **Dashboard access control** | **Allowed domains** (dapp origins), **allowed IPs**, **allowed CIDRs** (public ranges only) on the API key. | Use for production/staging hostnames and for **server egress** IPs (CI, k8s NAT, static app servers). |
| **Helius secure URL** | Hostname from the dashboard **without** a query-string API key; intended for **browser/mobile** clients. | Helius documents **~5 RPS per IP** for secure URLs—fine for light UI reads, not a substitute for backend-heavy investigation tooling. |

**Operational habits** (from the same doc): keys only in **environment variables**, separate keys per **dev/staging/prod**, **rotate** on suspicion, watch the dashboard for spikes and odd geos.

**Cockpit:** the first-class pattern remains a **server-side RPC proxy** with `HELIUS_API_KEY` in the API service env; alternatively deploy **helius-rpc-proxy** and set **`VITE_SOLANA_RPC_URL`** (or equivalent) to the worker origin **only**—never commit keys. **Sender** can use a **keyless** HTTPS path for submits; do not conflate that with unlimited read RPC access.

---

## 2. RPC Fast — product map (Solana-relevant)

| Surface | Role | Entry doc |
|--------|------|-------------|
| **Solana SaaS RPC** | HTTP + WebSocket JSON-RPC; positioning for **low-latency** apps, DeFi, analytics | [Introduction](https://docs.rpcfast.com/rpc-fast-saas-solana/introduction.md), [Getting started](https://docs.rpcfast.com/rpc-fast-saas-solana/getting-started.md) |
| **Billing** | **Compute Units (CUs)** instead of pure per-request pricing on Solana SaaS | [Billing](https://docs.rpcfast.com/rpc-fast-saas-solana/billing.md), [Solana RPC methods](https://docs.rpcfast.com/rpc-fast-saas-solana/solana-rpc-methods.md) |
| **Data streaming** | Yellowstone-class **gRPC**, **Shredstream** (Jito), **Aperture gRPC** (beta) — reduce polling | [Data streaming](https://docs.rpcfast.com/rpc-fast-saas-solana/data-streaming.md), [Yellowstone gRPC](https://docs.rpcfast.com/rpc-fast-saas-solana/data-streaming/yellowstone-grpc.md), [Shredstream](https://docs.rpcfast.com/solana-dedicated-nodes/jito-shredstream-grpc.md) |
| **Sending transactions** | Dedicated send path; **bloXroute Solana Trader API** + **SWQoS** docs for partnership routing | [Sending transactions](https://docs.rpcfast.com/rpc-fast-saas-solana/sending-transactions.md), [SWQoS](https://docs.rpcfast.com/rpc-fast-saas-solana/sending-transactions/swqos.md) |
| **Dedicated / HA nodes** | Self-hosted or managed **dedicated** validators + optional Shredstream / Yellowstone | [Solana dedicated node](https://docs.rpcfast.com/solana-dedicated-nodes/solana-dedicated-node.md), [HA cluster](https://docs.rpcfast.com/solana-dedicated-nodes/solana-ha-cluster-of-nodes.md) |
| **HFT / latency** | Playbooks and latency measurement | [Low-latency playbook](https://docs.rpcfast.com/solana-dedicated-nodes/low-latency-solana-playbook-for-hft.md), [How to check RPC latency](https://docs.rpcfast.com/solana-dedicated-nodes/solana-node-performance/how-to-check-solana-rpc-latency.md) |
| **EVM (same vendor)** | Separate product line: **JWT** + **CUs** per method | [EVM introduction](https://docs.rpcfast.com/rpc-fast-saas-evm/introduction.md), [JWT](https://docs.rpcfast.com/rpc-fast-saas-evm/json-web-token-jwt.md) — use when Cockpit adds EVM chains, not mixed into Solana key handling |

---

## 3. How this maps to Cockpit

| Need | Prefer | Cockpit today |
|------|--------|----------------|
| Land signed swaps / txs without exposing a Helius API key | **Helius Sender** (`/fast` or regional endpoints per Helius Sender docs) | Implement via **API service / proxy** (recommended) rather than a browser helper |
| Read RPC (`getBalance`, `getLatestBlockhash`, simulation, account reads) with a **paid** provider | **Backend proxy** + env `HELIUS_API_KEY` or RPC Fast credentials | Not wired in repo yet |
| Browser **read** RPC without embedding `?api-key=` | **Helius secure URL** (rate-limited) or **[helius-rpc-proxy](https://github.com/helius-labs/helius-rpc-proxy)** worker URL as `VITE_SOLANA_RPC_URL` | Lock down **CORS** + Helius **allowed IP/CIDR** to Cloudflare if using the worker (§1.4) |
| Wallet NFTs / tokens / cNFTs in dashboard | **Helius DAS** (or equivalent) **server-side** | Add backend route; never ship provider API keys in Vite |
| Full wallet / case timeline (tx + ATA activity, filters, pagination) | **`getTransactionsForAddress`** on proxied RPC, or **Wallet API** `…/history` / `…/transfers` | Server-only; mind **credits** (gTFA) and Wallet API **beta** stability |
| Backfill Cockpit-owned investigation index | **gTFA** + **LaserStream** (or webhooks) per [indexing guide](https://www.helius.dev/docs/rpc/how-to-index-solana-data.md) | ETL jobs in a worker service; store provenance (slot, signature, source method) |
| Real-time indexers, alerts, “live” dashboard tiles | **Helius Webhooks** or **LaserStream**; **RPC Fast Yellowstone / Shredstream** on dedicated plans | Design choice: align with one primary streaming vendor per environment to simplify ops |
| **Account** or **filtered tx** live stream over WSS | **`accountSubscribe`** / **`transactionSubscribe`** (this doc §1.1) on `wss://mainnet.helius-rpc.com?api-key=` | **Backend worker only**; bridge to SSE or queue; [accountSubscribe](https://www.helius.dev/docs/enhanced-websockets/account-subscribe.md), [transactionSubscribe](https://www.helius.dev/docs/enhanced-websockets/transaction-subscribe.md) |
| Priority fee hints before `sendTransaction` | **Helius Priority Fee API** | Optional future integration next to Sender |
| Lower latency / credits on bulk Solana reads | **Helius optimization guide** (§1.2): V2 pagination, `jsonParsed`, `dataSlice`, batching, WSS vs polling | Implement in backend proxy + agent tools; [optimization techniques](https://www.helius.dev/docs/rpc/optimization-techniques.md) |
| Lower-latency **Helius mainnet** RPC + WSS (same key) | **Gatekeeper** host **`beta.helius-rpc.com`** (§1.3) | Optional env-driven URL builder; [migration guide](https://www.helius.dev/docs/gatekeeper/migration-guide.md) |
| Multi-provider redundancy | Two accounts, health checks, explicit failover in **backend** only | Document failover; avoid double-billing client browsers with two keys |

**Overlap (conceptual):** both vendors offer **Solana JSON-RPC**, **WebSockets**, and **gRPC-class streaming** (Helius **LaserStream** vs RPC Fast **Yellowstone / Shredstream**). Helius additionally bundles **DAS**, **Sender**, and **webhooks** in one developer dashboard; RPC Fast emphasizes **dedicated hardware**, **HA clusters**, and **EVM** lines for multi-chain shops. For Cockpit’s **investigation / compliance** posture, favor **auditable server-side** RPC and logs over ad hoc browser endpoints.

---

## 4. Security and compliance

1. **Treat RPC URLs with API keys like secrets** — loggers, referrers, and browser devtools leak query strings. Prefer **server-side** `fetch` to `https://mainnet.helius-rpc.com/?api-key=…` from Node, not `import.meta.env` in the client. Follow [**Protect your keys**](https://www.helius.dev/docs/rpc/protect-your-keys.md) and §**1.4** (dashboard rules, **secure URL**, **[helius-rpc-proxy](https://github.com/helius-labs/helius-rpc-proxy)**).
2. **RPC Fast EVM** uses **JWT** in headers — same rule: issue short-lived tokens on the server, not in static frontend config.
3. **Compliance**: RPC providers see **transaction and account data** you query; route sensitive workloads per **DPA** and region requirements. This doc does not replace legal review.

---

## 5. Optional environment variables (see `.env.example`)

Suggested naming (not all implemented in code yet):

- **`HELIUS_API_KEY`** — backend only; used to build proxied RPC/DAS/webhook admin calls.
- **`SOLANA_RPC_URL`** — backend-only full URL **or** base URL + key assembly in one module so keys never appear in error messages.

RPC Fast often exposes a **customer endpoint host** + **key/JWT** per their console—mirror the same **server-only** pattern.

---

## 6. Helius — historical data, indexing, `getTransactionsForAddress`, Wallet API

Primary sources: [Historical data](https://www.helius.dev/docs/rpc/historical-data.md), [How to index Solana data](https://www.helius.dev/docs/rpc/how-to-index-solana-data.md), [`getTransactionsForAddress`](https://www.helius.dev/docs/rpc/gettransactionsforaddress.md), [Wallet API overview](https://www.helius.dev/docs/wallet-api/overview.md).

### 6.1 Historical data (archival RPC)

Helius documents **archival** access for methods such as **`getBlock`**, **`getBlocks`**, **`getBlockTime`**, **`getTransaction`**, **`getSignaturesForAddress`**, **`getInflationReward`**, and the enhanced **`getTransactionsForAddress`**. The [historical data overview](https://www.helius.dev/docs/rpc/historical-data.md) positions Helius as running **dedicated archival infrastructure** (contrasted in vendor copy with shared BigTable–style stacks) for latency-sensitive historical pulls.

**Investigator-relevant distinction:** native **`getSignaturesForAddress`** does **not** include transactions that only touch **associated token accounts (ATAs)** owned by the wallet. For **complete token history** (including ATA flows), Helius points teams to **`getTransactionsForAddress`** instead of signatures-only loops.

### 6.2 `getTransactionsForAddress` (gTFA)

This is a **Helius-only** JSON-RPC method (not standard Solana RPC). Highlights from the [full tutorial](https://www.helius.dev/docs/rpc/gettransactionsforaddress.md):

| Topic | Detail |
|--------|--------|
| **Billing / access** | **50 credits per request**; requires a **Developer** plan or higher (see Helius billing docs for current tiers). |
| **Payload shape** | Can return up to **100** full transactions when `transactionDetails: "full"`, or **1,000** signatures in lighter modes—confirm limits in the live API reference. |
| **Sorting** | **`sortOrder`**: chronological (`asc`) or newest-first (`desc`). |
| **Filters** | Slot / **blockTime** windows, **status** (`succeeded` / `failed`), signature allow/deny lists, etc. |
| **`tokenAccounts`** | **`none`** — only txs that reference the wallet pubkey directly. **`balanceChanged`** (often recommended) — wallet **or** ATA balance changes, while filtering noise. **`all`** — any tx touching the wallet or any owned token account. |
| **Legacy gap** | Token-account–aware behavior depends on post–**Dec 2022** metadata (slot **111,491,819**). Older history may need Helius’s documented **workaround** for legacy token-account discovery. |
| **Networks** | **Mainnet**: supported with unlimited retention in docs; **Devnet**: supported with **~2 weeks** retention; **Testnet**: not supported for this method. |

**Cockpit pattern:** call gTFA only from a **backend** RPC proxy using `HELIUS_API_KEY`; log **request id + address + time window**, not raw API keys; paginate with the documented **`paginationToken`** until the case backfill is complete.

### 6.3 How to index Solana data (ETL mental model)

The [indexing guide](https://www.helius.dev/docs/rpc/how-to-index-solana-data.md) describes why most products **do not** serve complex filters directly from chain RPC, and instead maintain a **private index** (e.g. PostgreSQL):

1. **Backfill** history (archival RPC / gTFA / `getBlock` strategies).  
2. **Stream** new confirmed blocks (e.g. **LaserStream**, webhooks, or WebSocket subscriptions).  
3. **Parse and transform** (programs, transfers, labels).  
4. **Write** to a queryable database for dashboards and APIs.

**Backfill strategies (ordered by Helius recommendation):**

1. **`getTransactionsForAddress`** — single-call segments with filters, pagination, optional **`transactionDetails: "full"`**, reverse search, ATA inclusion via **`tokenAccounts`**.  
2. **`getSignaturesForAddress` + `getTransaction`** — classic loop (`before` cursor); extra round-trips, concurrency/retry logic, and **no ATA txs** in the signatures list.  
3. **`getBlock`** — slot-range / explorer-style ingestion when block-scoped data is the natural grain.

For **keeping the index warm**, the same doc points to **LaserStream** (or equivalent streaming) after backfill.

### 6.4 Wallet API (Beta)

The [Wallet API overview](https://www.helius.dev/docs/wallet-api/overview.md) describes **REST** endpoints on **`https://api.helius.xyz`** (paths like **`/v1/wallet/{address}/…`**) for:

- **Identity** — labeled / categorized entities where coverage exists.  
- **Balances** — SPL / Token-2022 / NFTs with **USD** hints (pricing cadence per Helius).  
- **History** — transaction history with **balance changes**.  
- **Transfers** — token movements with counterparties.  
- **Funded-by** — original funding source for attribution workflows.

**Auth:** **`api-key`** query param or **`X-Api-Key`** header (prefer header in server logs). **Amounts** are often **human-readable** (divided by decimals); some fields expose **`amountRaw`** as a string for exact integer math—see the overview’s table.

**Cockpit caveats:**

- Treat as **beta**: response shapes may change; version your client and integration tests.  
- Use **only from the backend**; same DPA / retention policies as RPC.  
- Align product copy with **policy and legal**: labels are **heuristic/vendor attribution**, not adjudicated facts.

---

## 7. Related Cockpit docs

- [Dune data stack](./dune-data-stack.md) — historical / real-time **analytics** APIs (Sim, Data API), complementary to chain **RPC** and Helius **Wallet API**.
- [TimesFM adaptation](./timesfm-cockpit-adaptation.md) — optional **aggregate** forecasting (e.g. RPC error-rate baselines), not per-wallet surveillance.

---

*Vendor names and trademarks belong to their owners. Use Helius and RPC Fast per their current terms, pricing, and regional offerings. Credit costs and plan gates for `getTransactionsForAddress` and Wallet API are defined in Helius billing docs—verify before budgeting.*
