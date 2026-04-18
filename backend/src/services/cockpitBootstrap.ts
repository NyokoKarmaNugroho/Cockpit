import { getSupabaseAdmin, isSupabaseAnalysesEnabled } from "../lib/supabaseAdmin.js";

const anonWallet = () => process.env.COCKPIT_ANON_WALLET?.trim() || "cockpit-anonymous";
const defaultWorkspaceKey = () =>
  process.env.COCKPIT_DEFAULT_WORKSPACE_KEY?.trim() || "cockpit-default-workspace";

let bootstrapPromise: Promise<void> | null = null;

/** Ensures anonymous user + default workspace (no wallet auth). Idempotent. */
export function ensureCockpitBootstrap(): Promise<void> {
  if (!isSupabaseAnalysesEnabled()) return Promise.resolve();
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const sb = getSupabaseAdmin();
      const wallet = anonWallet();
      const extKey = defaultWorkspaceKey();

      const { data: existingUser, error: selU } = await sb
        .from("users")
        .select("id")
        .eq("wallet", wallet)
        .maybeSingle();
      if (selU) throw selU;

      let userId = existingUser?.id as string | undefined;
      if (!userId) {
        const { data: inserted, error: insU } = await sb
          .from("users")
          .insert({ wallet })
          .select("id")
          .single();
        if (insU) throw insU;
        userId = inserted!.id as string;
      }

      const { data: existingWs, error: selW } = await sb
        .from("workspaces")
        .select("id")
        .eq("external_key", extKey)
        .maybeSingle();
      if (selW) throw selW;

      if (!existingWs) {
        const { error: insW } = await sb.from("workspaces").insert({
          owner_user_id: userId,
          name: "Cockpit default",
          external_key: extKey,
        });
        if (insW) throw insW;
      }
    })().catch((e) => {
      bootstrapPromise = null;
      throw e;
    });
  }
  return bootstrapPromise;
}

export function getDefaultWorkspaceKey(): string {
  return defaultWorkspaceKey();
}

export function getAnonWallet(): string {
  return anonWallet();
}
