import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_ANALYSIS_WORKSPACE_ID } from "../lib/api";
import {
  getDashboardBootstrap,
  postAuthChallenge,
  postAuthVerify,
  postLogout,
  type BootstrapResponse,
} from "../lib/authApi";

type SessionValue = {
  workspaceId: string;
  user: BootstrapResponse["user"] | null;
  bootstrap: BootstrapResponse | null;
  authLoading: boolean;
  authError: string | null;
  refreshBootstrap: () => Promise<void>;
  connectPhantom: () => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [workspaceId, setWorkspaceId] = useState(DEFAULT_ANALYSIS_WORKSPACE_ID);
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshBootstrap = useCallback(async () => {
    try {
      const b = await getDashboardBootstrap();
      if (!b) {
        setBootstrap(null);
        setWorkspaceId(DEFAULT_ANALYSIS_WORKSPACE_ID);
        setAuthError(null);
        return;
      }
      setBootstrap(b);
      setWorkspaceId(b.workspace.slug ?? b.workspace.id);
      setAuthError(null);
    } catch (e) {
      setBootstrap(null);
      setWorkspaceId(DEFAULT_ANALYSIS_WORKSPACE_ID);
      setAuthError(e instanceof Error ? e.message : "Bootstrap failed");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setAuthLoading(true);
      try {
        await refreshBootstrap();
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshBootstrap]);

  const connectPhantom = useCallback(async () => {
    const sol = window.solana;
    if (!sol?.isPhantom) {
      window.open("https://phantom.app/", "_blank", "noopener,noreferrer");
      throw new Error("Install Phantom wallet to sign in.");
    }
    await sol.connect();
    const address = sol.publicKey?.toString();
    if (!address) throw new Error("Wallet did not return a public key.");

    const ch = await postAuthChallenge(address);
    const encoded = new TextEncoder().encode(ch.message);
    const signed = await sol.signMessage(encoded, "utf8");
    const sig = signed.signature;
    const sigB64 = btoa(String.fromCharCode(...sig));
    await postAuthVerify({ challengeId: ch.challengeId, address, signature: sigB64 });
    await refreshBootstrap();
  }, [refreshBootstrap]);

  const logout = useCallback(async () => {
    await postLogout();
    setBootstrap(null);
    setWorkspaceId(DEFAULT_ANALYSIS_WORKSPACE_ID);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      workspaceId,
      user: bootstrap?.user ?? null,
      bootstrap,
      authLoading,
      authError,
      refreshBootstrap,
      connectPhantom,
      logout,
    }),
    [workspaceId, bootstrap, authLoading, authError, refreshBootstrap, connectPhantom, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const v = useContext(SessionContext);
  if (!v) throw new Error("useSession must be used within SessionProvider");
  return v;
}

/** Workspace id for API calls — session slug/id when signed in, else default anon key. */
export function useWorkspaceId(): string {
  const v = useContext(SessionContext);
  return v?.workspaceId ?? DEFAULT_ANALYSIS_WORKSPACE_ID;
}
