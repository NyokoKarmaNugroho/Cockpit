import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useAnalysis } from "../../../context/AnalysisContext";
import { useSession } from "../../../context/SessionContext";
import { listIntegrationStatuses, renameWorkspace, type IntegrationStatusItem } from "../../../lib/api";
import { DashboardStubPage } from "../components/DashboardStubPage";
import { DASHBOARD_SEGMENT_LABELS } from "../dashboardRouteTitles";

type SettingsCardProps = {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
};

function SettingsCard({ title, eyebrow, action, children }: SettingsCardProps) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-zinc-900/50 p-5 shadow-inner">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          {eyebrow ? <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{eyebrow}</p> : null}
          <h2 className="mt-1 text-base font-semibold text-zinc-100">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function toneForIntegration(item: IntegrationStatusItem): string {
  return item.configured
    ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
    : "text-amber-300 bg-amber-500/10 border-amber-500/20";
}

function toneForConnection(status: "checking" | "ready" | "unreachable"): string {
  switch (status) {
    case "ready":
      return "text-emerald-300 bg-emerald-500/10 border-emerald-500/20";
    case "unreachable":
      return "text-rose-300 bg-rose-500/10 border-rose-500/20";
    default:
      return "text-zinc-300 bg-white/5 border-white/10";
  }
}

export function SettingsPage() {
  const { workspaceId, apiBaseUrl, apiConnectionStatus, recheckApiConnection, analyses } = useAnalysis();
  const { bootstrap, user, authLoading, refreshBootstrap, connectPhantom, logout } = useSession();
  const [integrations, setIntegrations] = useState<IntegrationStatusItem[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(true);
  const [integrationsError, setIntegrationsError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState(bootstrap?.workspace.name ?? "");
  const [workspaceMessage, setWorkspaceMessage] = useState<string | null>(null);
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  useEffect(() => {
    setWorkspaceName(bootstrap?.workspace.name ?? "");
  }, [bootstrap?.workspace.name]);

  useEffect(() => {
    let cancelled = false;
    setIntegrationsLoading(true);
    void listIntegrationStatuses()
      .then((items) => {
        if (cancelled) return;
        setIntegrations(items);
        setIntegrationsError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setIntegrationsError(error instanceof Error ? error.message : "Failed to load integrations.");
      })
      .finally(() => {
        if (!cancelled) setIntegrationsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const configuredIntegrations = useMemo(
    () => integrations.filter((item) => item.configured).length,
    [integrations],
  );

  async function handleWorkspaceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bootstrap) return;
    setWorkspaceMessage(null);
    setSavingWorkspace(true);

    try {
      await renameWorkspace(bootstrap.workspace.slug ?? bootstrap.workspace.id, workspaceName);
      await refreshBootstrap();
      setWorkspaceMessage("Workspace name updated.");
    } catch (error) {
      setWorkspaceMessage(error instanceof Error ? error.message : "Failed to update workspace.");
    } finally {
      setSavingWorkspace(false);
    }
  }

  async function handleConnectWallet() {
    setSessionBusy(true);
    setSessionMessage(null);
    try {
      await connectPhantom();
      setSessionMessage("Wallet connected.");
    } catch (error) {
      setSessionMessage(error instanceof Error ? error.message : "Could not connect wallet.");
    } finally {
      setSessionBusy(false);
    }
  }

  async function handleLogout() {
    setSessionBusy(true);
    setSessionMessage(null);
    try {
      await logout();
      setSessionMessage("Signed out of Cockpit.");
    } catch (error) {
      setSessionMessage(error instanceof Error ? error.message : "Failed to sign out.");
    } finally {
      setSessionBusy(false);
    }
  }

  return (
    <DashboardStubPage
      title={DASHBOARD_SEGMENT_LABELS.settings}
      description="Workspace preferences, integration readiness, API connectivity, and session controls for the current dashboard workspace."
    >
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SettingsCard title="Workspace profile" eyebrow="Identity">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">Current workspace</dt>
              <dd className="mt-2 text-sm font-medium text-zinc-100">{bootstrap?.workspace.name ?? "Anonymous workspace"}</dd>
              <p className="mt-2 text-xs text-zinc-500">ID: {bootstrap?.workspace.slug ?? bootstrap?.workspace.id ?? workspaceId}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">Access mode</dt>
              <dd className="mt-2 text-sm font-medium text-zinc-100">{user ? "Wallet-backed session" : "Anonymous mode"}</dd>
              <p className="mt-2 text-xs text-zinc-500">
                {user ? `Role: ${bootstrap?.workspace.role ?? "owner"}` : "Connect a wallet to personalize workspace metadata."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">Created</dt>
              <dd className="mt-2 text-sm font-medium text-zinc-100">
                {bootstrap?.workspace.createdAt ? new Date(bootstrap.workspace.createdAt).toLocaleString() : "Local session"}
              </dd>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">Recent runs loaded</dt>
              <dd className="mt-2 text-sm font-medium text-zinc-100">{analyses.length}</dd>
              <p className="mt-2 text-xs text-zinc-500">Analyses currently available in dashboard history.</p>
            </div>
          </dl>

          {bootstrap ? (
            <form className="space-y-3" onSubmit={(event) => void handleWorkspaceSubmit(event)}>
              <label className="block text-sm text-zinc-300">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">Rename workspace</span>
                <input
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
                  placeholder="Primary workspace"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={savingWorkspace || workspaceName.trim() === bootstrap.workspace.name.trim()}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingWorkspace ? "Saving…" : "Save workspace name"}
                </button>
                {workspaceMessage ? <p className="text-sm text-zinc-400">{workspaceMessage}</p> : null}
              </div>
            </form>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-4 text-sm text-zinc-400">
              Anonymous mode uses the shared dashboard workspace key <span className="font-medium text-zinc-200">{workspaceId}</span>.
            </div>
          )}
        </SettingsCard>

        <SettingsCard
          title="Session and access"
          eyebrow="Authentication"
          action={authLoading ? <span className="text-xs text-zinc-500">Checking session…</span> : null}
        >
          <div className="rounded-2xl border border-white/5 bg-black/20 p-4 text-sm text-zinc-300">
            {user ? (
              <>
                <p className="font-medium text-zinc-100">{user.primaryWalletAddress}</p>
                <p className="mt-2 text-zinc-400">Signed in with Phantom. Workspace data and cases will stay attached to this wallet session.</p>
              </>
            ) : (
              <>
                <p className="font-medium text-zinc-100">No wallet connected</p>
                <p className="mt-2 text-zinc-400">You can still investigate in anonymous mode, but workspace personalization stays read-only.</p>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <button
                type="button"
                disabled={sessionBusy}
                onClick={() => void handleLogout()}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-medium text-zinc-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sessionBusy ? "Signing out…" : "Sign out"}
              </button>
            ) : (
              <button
                type="button"
                disabled={sessionBusy}
                onClick={() => void handleConnectWallet()}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sessionBusy ? "Connecting…" : "Connect wallet"}
              </button>
            )}
            {sessionMessage ? <p className="text-sm text-zinc-400">{sessionMessage}</p> : null}
          </div>
        </SettingsCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SettingsCard
          title="API connectivity"
          eyebrow="Runtime"
          action={
            <button
              type="button"
              onClick={() => void recheckApiConnection()}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 px-3 text-sm font-medium text-zinc-200 hover:bg-white/5"
            >
              Recheck
            </button>
          }
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${toneForConnection(apiConnectionStatus)}`}>
              {apiConnectionStatus}
            </span>
            <p className="text-sm text-zinc-400">Base URL: <span className="text-zinc-200">{apiBaseUrl}</span></p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Composer</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">{bootstrap?.flags.composerEnabled ? "Enabled" : "Unavailable"}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Jupiter proxy</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">{bootstrap?.flags.jupiterProxyEnabled ? "Configured" : "Not configured"}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Live chain queries</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">{bootstrap?.flags.liveChainQueriesEnabled ? "Enabled" : "Unavailable"}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Plan</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">{bootstrap?.plan?.label ?? "Development"}</p>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard title="Integration readiness" eyebrow="Backend env">
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <p>
              <span className="font-medium text-zinc-100">{configuredIntegrations}</span> of <span className="font-medium text-zinc-100">{integrations.length}</span> integrations are configured.
            </p>
          </div>

          {integrationsError ? <p className="text-sm text-rose-300">{integrationsError}</p> : null}

          {integrationsLoading ? (
            <p className="text-sm text-zinc-400">Loading integration status…</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {integrations.map((item) => (
                <article key={item.id} className="rounded-2xl border border-white/5 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{item.label}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">{item.category}</p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${toneForIntegration(item)}`}>
                      {item.configured ? "configured" : "missing"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">{item.note}</p>
                  <p className="mt-3 text-xs text-zinc-500">Env: {item.envVars.join(", ")}</p>
                </article>
              ))}
            </div>
          )}
        </SettingsCard>
      </div>
    </DashboardStubPage>
  );
}
