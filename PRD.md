# Cockpit — Product Requirements Document (PRD) v1

Tanggal: 2026-04-17
Dokumen pemilik: PM/Eng (draft oleh asisten)
Status: Draft v1 (untuk review)

1) Ringkasan Produk
Cockpit adalah aplikasi web (frontend Vite + React + TypeScript) untuk intelijen blockchain yang menargetkan alur kerja investigasi/analisis. **Repo publik saat ini berisi situs marketing saja** (landing, blog, pricing, panduan data). Backend, dashboard investigasi, dan agen analisis dapat dikembangkan sebagai produk/infra terpisah; dokumen ini tetap menjelaskan visi produk lengkap untuk perencanaan.

2) Sasaran (Goals) dan Batasan (Non-Goals)

**Ruang lingkup repo publik (saat ini)**  
Hanya **situs marketing**: landing, blog, pricing, explore-data, metodologi risiko. Tidak ada dashboard investigasi, composer analisis, atau service API di repositori ini.

**Visi produk / fase mendatang** (dapat diimplementasikan di repo atau infra terpisah):

Goals v1 (produk, bukan necessarily repo ini):
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

**Repo publik ini (in-scope aktual):**  
Frontend marketing saja; konten publik dan alur Get Started (modal) tanpa koneksi wajib ke API Cockpit.

**Produk / implementasi terpisah (in-scope perencanaan PRD, di luar atau bersama repo lain):**
- Backend Node.js + TypeScript (satu service tipis boleh) yang menyediakan:
  - Auth wallet Phantom (challenge/verify) dan sesi (JWT atau cookie session).
  - Dashboard bootstrap API.
  - Analyses API: create/get/list + SSE untuk progres run.
  - Proxy Jupiter Ultra.
  - Penyimpanan metadata (Postgres/SQLite) + penyimpanan file/artifact lokal sederhana.
- Frontend penyesuaian untuk konsumsi API di atas (dashboard, composer) bila produk tersebut dipilih untuk dikembangkan.

Out-of-scope:
- Editor kasus lengkap, settings lengkap, API keys issuance, usage metering real, billing real.
- Indexer data on-chain sendiri atau pipeline ingestion besar.

5) Ringkas Arsitektur Saat Ini (Repo)
- **Hanya frontend publik**: Vite + React + React Router 7, Tailwind. Rute: `/` (Landing), `/blog`, `/explore-data`, `/methodology/risk-exposure`, `/pricing`.
- **Tidak disertakan di repo ini**: backend API, dashboard investigasi, dataset besar, atau migrasi database — dapat dikembangkan di repo/infra terpisah jika diperlukan.
- Integrasi klien (fase berikutnya, di luar repo ini): auth wallet, proxy Jupiter Ultra, agen analisis, dll. mengikuti §7.

6) Alur Pengguna Utama (As-Is → To-Be)
- Landing → Get started (modal) → materi produk publik (pricing, panduan data, metodologi).
- Dashboard dan analisis streaming direncanakan sebagai fase produk terpisah (bukan bagian dari build situs marketing ini).

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

15) Pekerjaan Frontend (bila dashboard + backend dipasangkan)
- Tambah pemanggilan API:
  - Saat login (jika dipakai): panggil `/auth/challenge` + `/auth/verify`.
  - Saat load dashboard: panggil `/dashboard/bootstrap`.
  - Saat submit composer: `POST /analyses` lalu buka SSE `/analyses/:id/events`.
  - Tampilkan hasil & update history.
- Konfigurasi: endpoint backend (base URL) untuk bootstrap/analisis; integrasi swap/tx tetap server-side.  
  **Catatan:** build marketing saat ini tidak menyertakan dashboard ini; §15 menggambarkan pekerjaan frontend produk penuh.

16) Pertanyaan Terbuka
- Mekanisme session: cookie httpOnly vs Bearer JWT? (rekomendasi: cookie httpOnly)
- DB pilihan default untuk dev: SQLite (cepat) atau Postgres (realistis)?
- Engine agent: paket/framework spesifik apa yang dipakai untuk v1 mock? (boleh mulai simpel tanpa dependensi berat)
- SSE vs WebSocket: tetap SSE untuk kesederhanaan v1, siapkan fallback jika Nginx/proxy bermasalah.

—
Lampiran A — Inventaris repo (saat ini)

- **`frontend/`** — aplikasi Vite + React + TypeScript; rute di `src/App.tsx`; alur Get Started: `components/SiteHeader.tsx`, `context/GetStartedContext.tsx`, `components/GetStartedModal.tsx`, `components/GetStartedTrigger.tsx`; halaman publik di `src/pages/`.
- **`docs/`** — catatan teknis dan integrasi (indeks: [`docs/README.md`](docs/README.md)); tidak wajib untuk menjalankan situs.
- **Tidak ada** folder `backend/`, dashboard investigasi, atau dataset besar di repo ini. §7–16 PRD ini menjelaskan kontrak dan model data untuk **perencanaan produk** bila layanan API dikembangkan terpisah.

—
Lampiran B — Catatan eksplorasi

Catatan kerja internal panjang telah dihapus dari PRD. Ringkasan prioritas implementasi backend (session → bootstrap → orkestrasi run → data) tetap tercermin di §11 Tonggak. Untuk materi teknis tambahan, lihat [`docs/README.md`](docs/README.md).
