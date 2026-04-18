import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | null = null;
let warnedInvalidSupabaseUrl = false;

/**
 * Resolves the REST API base URL for @supabase/supabase-js.
 * Postgres connection strings (postgresql:// / postgres://) are not valid — use
 * https://<project-ref>.supabase.co from Dashboard → Settings → API, or
 * http://127.0.0.1:54321 for local `supabase start`.
 */
export function resolveSupabaseHttpUrl(raw?: string | null): string | null {
  const s = raw?.trim().replace(/^["']|["']$/g, "") ?? "";
  if (!s) return null;
  if (s.startsWith("postgres://") || s.startsWith("postgresql://")) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return `${u.origin}${u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "")}`;
  } catch {
    return null;
  }
}

/** Service-role client for server-side writes (bypasses RLS). */
export function isSupabaseAnalysesEnabled(): boolean {
  const raw = process.env.SUPABASE_URL;
  const url = resolveSupabaseHttpUrl(raw);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (raw?.trim() && !url && !warnedInvalidSupabaseUrl) {
    warnedInvalidSupabaseUrl = true;
    console.warn(
      "[supabase] SUPABASE_URL must be an http(s) API URL for @supabase/supabase-js " +
        "(not postgres://). Use https://<ref>.supabase.co or http://127.0.0.1:54321 for local. " +
        "Falling back to in-memory analyses and wallet auth.",
    );
  }
  return !!(url && key);
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = resolveSupabaseHttpUrl(process.env.SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL (http://127.0.0.1:54321 local or https://…supabase.co) and SUPABASE_SERVICE_ROLE_KEY are required for persisted analyses",
    );
  }
  if (!admin) {
    admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}
