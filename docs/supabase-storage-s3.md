> **Scope:** Supabase Storage S3 API patterns. Optional for any project using Supabase; not required to run the **marketing** app in `frontend/`.

# Supabase Storage — S3-compatible API and authentication

Supabase exposes Storage over an **S3-compatible endpoint** so you can use the AWS SDK, `aws s3`, and other S3 tools. Official guide: [**S3 Authentication**](https://supabase.com/docs/guides/storage/s3/authentication).

Generate credentials and copy **endpoint** + **region** from the project dashboard: [Storage settings](https://supabase.com/dashboard/project/_/storage/settings).

---

## 1. Two authentication modes

| Mode | Credentials | Access | Use when |
|------|-------------|--------|----------|
| **S3 access keys** | Access Key ID + Secret Access Key from dashboard | **Full** Storage API access; **bypasses RLS** on buckets | **Server-side only** — ETL, workers, trusted backends |
| **Session token** | `accessKeyId`: project ref · `secretAccessKey`: **anon** key · `sessionToken`: **user JWT** | Operations **scoped to the user**; **RLS** on the Storage schema applies | Server acting on behalf of a user, or **client** S3 SDK when policy allows |

**Never** commit S3 access keys or service role keys to the repo; use your API or worker `.env` (gitignored) or your secret manager.

---

## 2. Endpoint and performance

For **large uploads**, prefer the **direct storage hostname** ([docs](https://supabase.com/docs/guides/storage/s3/authentication)):

- Use `https://<project_ref>.storage.supabase.co` (not only `https://<project_ref>.supabase.co`) for better throughput.

S3 API path shape:

```text
https://<project_ref>.storage.supabase.co/storage/v1/s3
```

Configure clients with **`forcePathStyle: true`** and the **`region`** shown in project settings.

### Example: `@aws-sdk/client-s3` (server, access keys)

```typescript
import { S3Client } from "@aws-sdk/client-s3";

const client = new S3Client({
  forcePathStyle: true,
  region: process.env.SUPABASE_STORAGE_REGION!,
  endpoint: process.env.SUPABASE_STORAGE_S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.SUPABASE_STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.SUPABASE_STORAGE_SECRET_ACCESS_KEY!,
  },
});
```

### Example: session token (user-scoped, RLS)

```typescript
import { S3Client } from "@aws-sdk/client-s3";
// After supabase.auth.getSession() — token forwarded to Storage; RLS enforced server-side.
const client = new S3Client({
  forcePathStyle: true,
  region: "project_region",
  endpoint: "https://<project_ref>.storage.supabase.co/storage/v1/s3",
  credentials: {
    accessKeyId: "<project_ref>",
    secretAccessKey: "<anon_publishable_key>",
    sessionToken: session.access_token,
  },
});
```

The Supabase guide notes that **`getSession()`** is usually discouraged for **auth decisions** (session from local storage); here the access token is only **forwarded** to Storage, which **validates** the JWT server-side—so it is appropriate when you are not using session payload for client-side authorization ([S3 Authentication](https://supabase.com/docs/guides/storage/s3/authentication)).

**Self-hosted:** `accessKeyId` for session mode may be `STORAGE_TENANT_ID` per [self-hosted S3](https://supabase.com/docs/guides/self-hosting/self-hosted-s3#session-token).

---

## 3. How this maps to Cockpit

- **PRD** (artifacts): object storage is a natural home for **exports, PDFs, and large blobs**; S3-compatible access keys fit **backend** ingest and **batch jobs** (e.g. reference dataset derivatives) without piping everything through multipart HTTP to the REST Storage API.
- **Investigation posture:** prefer **bucket policies + RLS** and **user JWT** session tokens when end users upload or download case files; reserve **global S3 keys** for admin/maintenance paths only.
- **Frontend:** if you expose S3 from the browser with session tokens, keep using **anon** key as `secretAccessKey` and rely on **RLS**—do not put S3 **secret access keys** in Vite.

---

## 4. Related

- [Reference datasets → Supabase (Postgres)](./reference-datasets-supabase.md) — table data; this doc is **file** storage.
- [Supabase dashboard — Storage settings](https://supabase.com/dashboard/project/_/storage/settings)

---

*Supabase is a trademark of Supabase Inc. Follow current dashboard labels and regional endpoints for your project.*
