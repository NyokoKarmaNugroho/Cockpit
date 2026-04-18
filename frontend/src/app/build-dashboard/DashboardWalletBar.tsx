import { useState } from "react";
import { useSession } from "../../context/SessionContext";

/** Phantom sign-in for dashboard (optional — anon workspace still works without wallet). */
export function DashboardWalletBar() {
  const { user, authLoading, connectPhantom, logout } = useSession();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const short = (addr: string) => `${addr.slice(0, 4)}…${addr.slice(-4)}`;

  return (
    <div className="flex min-w-0 max-w-[min(100%,14rem)] flex-col items-end gap-0.5 sm:max-w-[18rem]">
      {err ? <p className="max-w-full truncate text-[10px] text-rose-400">{err}</p> : null}
      {authLoading ? (
        <span className="text-xs text-zinc-500">Session…</span>
      ) : user ? (
        <div className="flex items-center gap-2">
          <span className="hidden truncate text-xs text-zinc-400 sm:inline" title={user.primaryWalletAddress}>
            {short(user.primaryWalletAddress)}
          </span>
          <button
            type="button"
            onClick={() => {
              setErr(null);
              void logout();
            }}
            className="shrink-0 rounded-lg border border-white/10 px-2 py-1 text-xs font-medium text-zinc-200 hover:bg-white/5"
          >
            Sign out
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setErr(null);
            setBusy(true);
            void connectPhantom()
              .catch((e) => setErr(e instanceof Error ? e.message : "Could not connect"))
              .finally(() => setBusy(false));
          }}
          className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50"
        >
          {busy ? "Signing…" : "Connect wallet"}
        </button>
      )}
    </div>
  );
}
