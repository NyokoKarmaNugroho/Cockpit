# Cockpit — Product Requirements Document (PRD) v1

Tanggal: 2026-04-17
Dokumen pemilik: PM/Eng (draft oleh asisten)
Status: Draft v1 (untuk review)

1) Ringkasan Produk
Cockpit adalah aplikasi web (frontend Vite + React + TypeScript) untuk intelijen blockchain yang menargetkan alur kerja investigasi/analisis. Repo saat ini berisi UI marketing + shell dashboard dan integrasi wallet Phantom di sisi klien; belum ada backend. V1 akan menambah backend minimal agar alur “Get started → connect wallet → masuk dashboard → buat analisis → lihat progres/hasil” benar-benar berfungsi end-to-end.

2) Sasaran (Goals) dan Batasan (Non-Goals)
Goals v1:
- User dapat:
  - Masuk ke dashboard setelah connect Phantom (atau bypass lokal untuk demo).
  - Melihat bootstrap data dasar (profil, workspace, fitur, ringkasan histori dummy).
  - Membuat “analysis run” dari dashboard composer.
  - Melihat progres run via streaming (SSE) dan hasil akhir yang tersimpan sebagai riwayat.
- Backend minimal tersedia:
  - Auth/session berbasis wallet (challenge/verify) + identitas user.
  - Bootstrap endpoint untuk data awal dashboard.
  - Orkestrasi analysis run (create, get, stream events) dengan engine agent internal.
  - Proxy server untuk Jupiter Ultra (menyisipkan x-api-key), tanpa mengekspos API key di browser.

Non-Goals v1:
- Membangun indexer on-chain penuh atau graph engine sendiri.
- Integrasi lengkap multi-chain dan labeling menyeluruh.
- Billing/credits real; cukup placeholder.
- Multi-tenant kompleks, RBAC granular, dan audit log komprehensif.

3) Persona & Use Case Utama
- Investigator/Analyst: Membuat analisis ad hoc, mengumpulkan bukti/evidence, melihat ringkasan.
- AML/Compliance Ops: Melihat histori analisis singkat dan status risiko.

4) Ruang Lingkup v1
In-scope:
- Backend Node.js + TypeScript (satu service tipis boleh) yang menyediakan:
  - Auth wallet Phantom (challenge/verify) dan sesi (JWT atau cookie session).
  - Dashboard bootstrap API.
  - Analyses API: create/get/list + SSE untuk progres run.
  - Proxy Jupiter Ultra.
  - Penyimpanan metadata (Postgres/SQLite) + penyimpanan file/artifact lokal sederhana.
- Frontend penyesuaian ringan untuk konsumsi API di atas (tanpa perubahan UI besar).

Out-of-scope:
- Editor kasus lengkap, settings lengkap, API keys issuance, usage metering real, billing real.
- Indexer data on-chain sendiri atau pipeline ingestion besar.

5) Ringkas Arsitektur Saat Ini (Repo)
- Frontend: Vite + React + React Router 7, Tailwind. Rute:
  - “/” (Landing), “/blog”, “/explore-data”, “/methodology/risk-exposure”, “/pricing”.
  - “/build-dashboard” memakai `DashboardLayout` (views: index, search, investigations, studio, history, cases, api, settings) — **tanpa** gate wallet di UI saat ini.
- Integrasi klien:
  - (Dihapus) Phantom Connect / modal login wallet di frontend.
  - Jupiter Ultra / Helius Sender direncanakan sebagai integrasi **server-side** (proxy + submit tx), bukan helper browser di repo ini.
- Backend: service Node/TS sedang berkembang; orkestrasi analisis mengacu pada **AIAgent** (§7.6): prompt/tool assembly, mode provider, cancelable calls, tool execution, history OpenAI-shaped, compression/retry/fallback, iteration budget, flush memory. Direktori `backend/agent/` menampung engine agent; `backend/dataset/` berisi konten data (mis. RAG/API specs).

6) Alur Pengguna Utama (As-Is → To-Be)
- Landing → Get started (modal atau langsung) → navigasi ke “/build-dashboard”.
- Di dashboard, user menekan “New analysis”/composer → kirim prompt → melihat progres → hasil disimpan ke history.
- To-be: alur di atas memanggil backend nyata: auth, bootstrap, create run, stream, persist.

7) Kebutuhan Fungsional (FRD)
7.1 Auth & Session berbasis Wallet
- `POST /auth/challenge`: backend membuat nonce unik per wallet (Solana pubkey) dan menyimpan sementara.
- `POST /auth/verify`: klien mengirim signature atas challenge; backend verifikasi, lalu membuat session (JWT httpOnly atau cookie session). Jika user baru: buat entitas user + workspace default.
- `GET /me`: kembalikan profil user dan status session.

7.2 Dashboard Bootstrap
- `GET /dashboard/bootstrap`: mengembalikan objek gabungan:
  - user (id, wallet primary, createdAt, lastSeenAt)
  - workspace default (id, name)
  - featureFlags (mis. enableComposer: true)
  - usage/plan placeholder (credits: n/a)
  - recentAnalyses ringkas (<=5 item)

7.3 Analyses Run Orchestration
- `POST /analyses`: membuat run baru (prompt, workspaceId). Backend:
  - catat run status `pending` → `running` → `completed/failed`.
  - jalankan engine agent (internal) untuk menghasilkan event streaming dan output akhir (summary/report, artifacts opsional).
- `GET /analyses/:id`: dapatkan detail run (status, hasil).
- `GET /analyses/:id/events` (SSE): stream progres (event: status, step, message, partials).
- `GET /analyses?workspaceId=...`: daftar run ringkas.

7.4 Proxy Jupiter Ultra
- `GET /ultra/v1/order?...`: backend meneruskan ke `https://api.jup.ag/ultra/v1/order` dengan header `x-api-key` dari server env. Rate-limit & error handling.

7.5 Penyimpanan
- Metadata: Postgres (ideal) atau SQLite (untuk lokal) menyimpan: User, Workspace, Analysis, AnalysisEvent, Artifact.
- Artifacts: filesystem lokal atau object storage (nanti). V1 boleh hanya metadata + hasil teks.

7.6 AIAgent runtime (tanggung jawab)
Komponen **AIAgent** mengorkestrasi panggilan model dan tool untuk satu run analisis (dan sub-agent bila ada). Implementasi boleh berupa modul Python (mis. `prompt_builder.py`) atau setara di TypeScript; kontrak perilaku berikut tetap berlaku.

AIAgent bertanggung jawab untuk:
- **Prompt & tools**: Merakit system prompt efektif dan skema tool (mis. via `prompt_builder.py` atau padanan), termasuk injeksi konteks yang aman dan konsisten.
- **Provider / API mode**: Memilih provider dan mode API yang benar untuk konteks tersebut, mis. `chat_completions`, `codex_responses`, `anthropic_messages` (daftar dapat diperluas seiring integrasi).
- **Panggilan model terputus (interruptible)**: Memanggil model dengan dukungan **pembatalan** (cancellation), mis. signal/AbortController/thread shutdown, agar run dapat dihentikan tanpa membiarkan worker menggantung.
- **Eksekusi tool**: Menjalankan tool calls **sekuensial** atau **konkuren** (mis. thread pool) sesuai kebijakan agent dan keselamatan dependensi antar-tool.
- **Riwayat percakapan**: Mempertahankan history dalam **format pesan OpenAI** (role/content/tool_calls) sebagai sumber kebenaran antar iterasi.
- **Ketahanan konteks**: Menangani **kompresi** konteks bila mendekati batas, **retry** transient, dan **fallback** ke model cadangan bila dikonfigurasi.
- **Anggaran iterasi**: Melacak dan menegakkan **iteration budget** untuk agent induk dan anak (sub-agent), agar run tidak berjalan tanpa batas.
- **Memory persisten**: **Flush** memori persisten (jika dipakai) sebelum konteks hilang atau sebelum shutdown, agar tidak kehilangan state yang harus disimpan.

Catatan: Detail transport (SSE ke klien) tetap di lapisan API; AIAgent fokus pada loop model↔tool dan kebijakan di atas. Pemetaan pola dari dokumentasi open-source (Hermes Agent, kompresi konteks, gateway, dsb.) ke stack Cockpit: `docs/agent-runtime-hermes-adaptation.md`.

8) Spesifikasi API v1 (sketsa kontrak)
Catatan: format ringkas; payload contoh non-final. Autentikasi via session cookie httpOnly atau Bearer JWT.

- POST `/auth/challenge`
  - Body: { wallet: string }
  - 200: { challenge: string, expiresAt: string }
- POST `/auth/verify`
  - Body: { wallet: string, signature: string }
  - 200: { token?: string, user: { id, wallet, createdAt }, workspace: { id, name } }
- GET `/me`
  - 200: { user: { id, wallet, createdAt, lastSeenAt } }
- GET `/dashboard/bootstrap`
  - 200: { user, workspace, featureFlags, usage, recentAnalyses: [{ id, createdAt, status }] }
- POST `/analyses`
  - Body: { prompt: string, workspaceId?: string }
  - 202: { id: string, status: "pending" }
- GET `/analyses/:id`
  - 200: { id, status, prompt, result?: { summary, report }, createdAt, updatedAt }
- GET `/analyses/:id/events` (SSE)
  - text/event-stream; events: { type: "status"|"step"|"log"|"final"|"error", data: any }
- GET `/analyses`
  - Query: workspaceId
  - 200: { items: [{ id, status, createdAt, updatedAt }] }
- GET `/ultra/v1/order`
  - Proxies query string; 200: JSON dari Jupiter Ultra; 429/5xx diteruskan w/ message.

9) Model Data (minimal)
- User { id (uuid), wallet (string, unique), createdAt, lastSeenAt }
- Workspace { id, ownerUserId, name, createdAt }
- Analysis { id, workspaceId, userId, prompt, status (enum), resultSummary?, resultReport?, createdAt, updatedAt }
- AnalysisEvent { id, analysisId, ts, type, payload (json) }
- Artifact { id, analysisId, kind, urlOrPath, meta (json), ts }

10) Kebutuhan Non-Fungsional (NFR)
- Keamanan: session httpOnly; verifikasi signature challenge; simpan API keys di server; CORS ketat (origin frontend).
- Observabilitas: log struktur (request, error, run lifecycle); health endpoint `/health`.
- Kinerja: SSE stabil; run concurrency dasar; timeouts wajar (max 2-5 menit/run v1).
- Ketahanan: backoff untuk panggilan eksternal (Jupiter); validasi input.
- Compliance/Etika: tidak memfasilitasi misuse; tampilkan disclaimer di UI (sudah ada tone di BlogPage).

11) Tonggak (Milestones) & Kriteria Penerimaan
Phase 1 — Fondasi Backend (P0 + P1)
- Node+TS service, env/config, logger, `/health`.
- Auth wallet: `/auth/challenge`, `/auth/verify`, `/me`.
- DB: skema minimal (User, Workspace).
- Acceptance: connect Phantom → verify → `/me` mengembalikan user.

Phase 2 — Dashboard Bootstrap (P2)
- Endpoint `/dashboard/bootstrap` + seed minimal.
- Acceptance: dashboard menampilkan data nyata (user+workspace, recentAnalyses kosong atau 1-2 contoh dari DB).

Phase 3 — Analyses Orchestration (P3)
- Endpoints `/analyses` (POST/GET), `/analyses/:id/events` (SSE), `/analyses?workspaceId`.
- Engine agent internal ("mock tools" cukup: web research placeholder, sintetis report).
- Persistence run + event.
- Acceptance: buat run dari composer → stream progres → status completed → history muncul.

Phase 4 — Proxy & Riwayat (P4 sebagian)
- Proxy `/ultra/v1/order` (kunci di server) + penguatan error.
- History list/detail rapi; artifacts teks disimpan.
- Acceptance: helper frontend Jupiter dapat diarahkan ke proxy; history dapat dibuka ulang.

12) Risiko & Mitigasi
- Risiko: Kompleksitas agent terlalu cepat → Mulai dari tools minimal, fokus kontrak SSE.
- Risiko: SSE tidak stabil di dev proxy → Sediakan opsi WebSocket alternatif jika perlu.
- Risiko: Pengelolaan session/JWT → Pilih satu pola (cookie httpOnly disarankan) + CORS benar.
- Risiko: Kunci API bocor → Semua kunci hanya di server; audit request/response proxy.

13) Telemetri & Analytics (opsional v1)
- Server: hit count per endpoint, error rate, latensi.
- Event produk: analysis created/completed (tanpa PII sensitif).

14) Dependensi
- (Saat ini) tidak ada SDK wallet di frontend; autentikasi berbasis wallet (jika dipilih) dilakukan lewat backend (challenge/verify).
- Jupiter Ultra (proxy backend), Helius Sender (disarankan dari backend/trusted client; jangan menaruh kunci vendor di bundle browser).
- DB (Postgres/SQLite), runtime Node 20+.

15) Pekerjaan Frontend Minimal
- Tambah pemanggilan API:
  - Saat login (jika dipakai): panggil `/auth/challenge` + `/auth/verify`.
  - Saat load dashboard: panggil `/dashboard/bootstrap`.
  - Saat submit composer: `POST /analyses` lalu buka SSE `/analyses/:id/events`.
  - Tampilkan hasil & update history.
- Konfigurasi: endpoint backend (base URL) untuk bootstrap/analisis; integrasi swap/tx tetap server-side.

16) Pertanyaan Terbuka
- Mekanisme session: cookie httpOnly vs Bearer JWT? (rekomendasi: cookie httpOnly)
- DB pilihan default untuk dev: SQLite (cepat) atau Postgres (realistis)?
- Engine agent: paket/framework spesifik apa yang dipakai untuk v1 mock? (boleh mulai simpel tanpa dependensi berat)
- SSE vs WebSocket: tetap SSE untuk kesederhanaan v1, siapkan fallback jika Nginx/proxy bermasalah.

—
Lampiran A — Inventaris Repo (ringkas)
- frontend/: Vite React app; routes di `src/App.tsx`; Get Started flow `components/SiteHeader.tsx`, `context/GetStartedContext.tsx`, `components/GetStartedModal.tsx`; dashboard shell di `src/app/build-dashboard/*` (tanpa gate wallet di UI saat ini).
- backend/: API service (Node/TS); `backend/agent/` untuk engine analisis; spesifikasi perilaku AIAgent di §7.6; `backend/dataset/` untuk data statis; `backend/supabase/migrations/` untuk skema DB.

—
Lampiran B — Catatan Eksplorasi Asal (sebelumnya di PRD.md)

[BEGIN ORIGINAL NOTES]
**Exploring GetStarted flow**

I need to look up specifics about the GetStarted flow, maybe using the code explorer for a broad search of the codebase. My last attempt had a connection issue, so I’ll see if I can still utilize that tool. I should review certain files like SiteHeader, GetStartedTrigger, and others related to the user journey. I’ll also fetch the langchain quickstart docs. It seems the user just wants to identify backend priorities without needing code changes. So, I might suggest creating a README.md for clarity.**Identifying backend priorities**

The user asked me to identify the most sensible priorities for backend implementation, not necessarily to implement anything right now, so this should just be analysis. I’ll focus on examining the user journey from landing to dashboard. Gathering relevant code will help me understand what needs to be prioritized. It's all about assessing what makes the most sense for the backend structure based on this user journey. Time to dive into that code!
Saya akan petakan **journey user dari landing → onboarding → wallet connect → dashboard**, lalu cocokkan dengan **backend yang paling dibutuhkan dulu**, sambil melihat apakah `backend/agent` cocok dijadikan fondasi agent service berbasis Deep Agents. Saya belum akan menulis kode; fokus saya sekarang adalah mengurutkan prioritas implementasi yang paling masuk akal.
**Analyzing backend implementation**

I need to gather some pricing information, but it seems I might already know what I need. I could search for “New analysis” and look at relevant documents. It's important to identify sensible priorities for backend implementation from the user journey to the dashboard. I could structure my findings by journey stage and backend needs, possibly recommending phased priorities. Including existing code references could also help support my points, but I might skip snippets altogether to keep things concise.**Prioritizing implementation tasks**

I should mention file names without including code. The final answer will be in Indonesian, but I need to remember user preferences about programming language usage. Since I’m not coding now, I can focus on prioritizing tasks rather than implementation. 

I could create a priority matrix to structure my thoughts:  
- P0: identity/session layer bridging wallet to backend  
- P1: BFF/API gateway  
- P2: job orchestration for analysis  
- P3: investigation data ingestion/indexer  
- P4: persistence for workspaces/cases  
- P5: settings/integrations management  
- P6: exports/audit/billing  

I'll tailor these priorities to the user journey.**Discussing backend structure**

I need to consider persistence around case management, history, and settings for API pages. It seems I should discuss Deep Agents in the backend since the folder is empty. Maybe I can recommend using Deep Agents for orchestration services rather than as a public API directly, perhaps pairing it with a thin BFF. I could suggest structuring things under both backend/agent and backend/api, even if that doesn't involve any code changes for now, given the empty folder situation.**Crafting recommendations for DashboardComposer**

I’m thinking I might need to gather one more search for DashboardComposer and New Analysis, even if it's possibly irrelevant. We've already covered DashboardLayout and DashboardComposer comprehensively enough. I’ll focus on maintaining brevity and clarity in my final recommendation. Using clear headings and bullet points could help. It might also be useful to indicate the current state of `backend/agent`, which is empty. 

I can recommend an architecture combining backend/api and backend/agent, plus a DB, and consider merging services to simplify things.**Structuring the phased approach**

I think it's a good idea to list out the phases like "Phase 1", "Phase 2," etc. I’ll lay out the structure, including: the journey of reading, priority order with rationale, proposed minimal backend scope for `backend/agent`, and the first version of API endpoints. I might also detail a minimal data model while emphasizing what to avoid initially. 

Directly mapping frontend flows is important, too: Landing CTA leads to `GetStartedModal`, wallet connect, and the final dashboard. It’s necessary to highlight that no backend is needed for landing content, possibly using a simple markdown table with bold bullet pairs. I’ll also mention why "Deep Agents" fits the `backend/agent` role as a worker behind the REST/stream API. Finally, I’ll focus on creating a prioritized backlog.**Defining the project backlog**

I’m outlining a prioritized backlog starting with essential tasks. For P0, I’ll include the wallet challenge/session. In P1, I should focus on the workspace bootstrap API and the analysis run API using streaming with Deep Agents. Then for P2, I'll ensure persistence of runs, history, and artifacts, along with an initial investigation query layer using a mock adapter. Moving to P3, I'll work on real Solana adapters and indexers, and then finally for P4, I'll address cases, settings, API keys, and billing.
Saya sudah punya urutan prioritas yang cukup jelas. Yang paling penting: **jangan mulai dari indexer besar dulu**—dari journey user yang ada sekarang, nilai backend tercepat datang dari **session/workspace bootstrap + agent run orchestration**, baru kemudian data pipeline investigasi.
…
[END ORIGINAL NOTES]
