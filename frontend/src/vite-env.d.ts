interface ImportMetaEnv {
  /** Site origin for canonical / Open Graph (no trailing slash). Preview: override to your preview URL. */
  readonly VITE_SITE_URL?: string;
  /** Supabase project URL (Settings → API). */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon / publishable key (safe for browser; RLS still applies). */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css";
