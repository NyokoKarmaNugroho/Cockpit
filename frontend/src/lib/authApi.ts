import { API_BASE_URL } from "./api";

const JSON_HEADERS = { "Content-Type": "application/json" };
const CREDS: RequestCredentials = "include";

export type ChallengeResponse = {
  challengeId: string;
  message: string;
  expiresAt: string;
};

export async function postAuthChallenge(address: string): Promise<ChallengeResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/challenge`, {
    method: "POST",
    headers: JSON_HEADERS,
    credentials: CREDS,
    body: JSON.stringify({ address }),
  });
  const payload = (await response.json().catch(() => null)) as ChallengeResponse | { message?: string; error?: string };
  if (!response.ok) {
    throw new Error(
      (payload as { message?: string }).message ??
        (payload as { error?: string }).error ??
        `Challenge failed (${response.status})`,
    );
  }
  return payload as ChallengeResponse;
}

export async function postAuthVerify(input: {
  challengeId: string;
  address: string;
  signature: string;
}): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/verify`, {
    method: "POST",
    headers: JSON_HEADERS,
    credentials: CREDS,
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string; error?: string };
    throw new Error(payload?.message ?? payload?.error ?? `Verify failed (${response.status})`);
  }
}

export async function postLogout(): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, { method: "POST", credentials: CREDS });
}

export type MeResponse = {
  user: {
    id: string;
    primaryWalletAddress: string;
    createdAt: string;
    updatedAt: string;
  };
};

export async function getMe(): Promise<MeResponse["user"] | null> {
  const response = await fetch(`${API_BASE_URL}/me`, { credentials: CREDS });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`GET /me failed (${response.status})`);
  const payload = (await response.json()) as MeResponse;
  return payload.user;
}

export type BootstrapResponse = {
  user: MeResponse["user"];
  workspace: { id: string; name: string; slug?: string; role: string; createdAt: string };
  flags: {
    composerEnabled: boolean;
    jupiterProxyEnabled: boolean;
    liveChainQueriesEnabled: boolean;
  };
  plan?: {
    id: string;
    label: string;
    creditsRemaining?: number | null;
  };
  recentAnalyses: Array<{
    id: string;
    workspaceId: string;
    title: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
};

export async function getDashboardBootstrap(): Promise<BootstrapResponse | null> {
  const response = await fetch(`${API_BASE_URL}/dashboard/bootstrap`, { credentials: CREDS });
  if (response.status === 401) return null;
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string };
    throw new Error(payload?.message ?? `Bootstrap failed (${response.status})`);
  }
  return (await response.json()) as BootstrapResponse;
}
