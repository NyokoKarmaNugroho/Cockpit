interface ImportMetaEnv {
  /** Site origin for canonical / Open Graph (no trailing slash). Preview: override to your preview URL. */
  readonly VITE_SITE_URL?: string;
  /** Set to `"true"` so all "Get started" actions go to `/build-dashboard` instead of the onboarding modal. */
  readonly VITE_GET_STARTED_DIRECT_DASHBOARD?: string;
  /** Supabase project URL (Settings → API). */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon / publishable key (safe for browser; RLS still applies). */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** Cockpit backend base URL, used for analysis API + SSE stream. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css";

/** Phantom (and compatible) Solana wallet injected in the browser. */
interface SolanaWalletProvider {
  readonly isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toString(): string } }>;
  publicKey?: { toString(): string };
  signMessage: (message: Uint8Array, display?: string) => Promise<{ signature: Uint8Array }>;
}

interface Window {
  solana?: SolanaWalletProvider;
}
