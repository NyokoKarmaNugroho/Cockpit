import { getSupabaseAdmin, isSupabaseAnalysesEnabled } from "../lib/supabaseAdmin.js";

export type DatabaseHealth = {
  configured: boolean;
  ok: boolean;
  detail?: string;
};

/** Lightweight probe — does not require analyses writes. */
export async function getDatabaseHealth(): Promise<DatabaseHealth> {
  if (!isSupabaseAnalysesEnabled()) {
    return { configured: false, ok: true, detail: "supabase_not_configured" };
  }
  try {
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("users").select("id").limit(1);
    if (error) {
      return { configured: true, ok: false, detail: error.message };
    }
    return { configured: true, ok: true };
  } catch (e) {
    return {
      configured: true,
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}
