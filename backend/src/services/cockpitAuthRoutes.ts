import type { Context } from "hono";
import type { AuthChallengeRequest, AuthVerifyRequest } from "../contracts/auth.js";
import type { DashboardBootstrapResponse } from "../contracts/bootstrap.js";
import { listAnalysisRuns } from "./analysisRunStore.js";
import {
  attachSessionCookie,
  clearSessionCookie,
  createChallenge,
  createSession,
  getChallenge,
  removeChallenge,
  deleteSession,
  getDefaultWorkspaceForUser,
  getSessionIdFromRequest,
  getSessionRecord,
  loadUserDto,
  verifySolanaSignature,
} from "./walletSession.js";

function badRequest(c: Context, message: string) {
  return c.json({ error: "validation_error", message }, 400);
}

export async function postAuthChallenge(c: Context) {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return badRequest(c, "Expected JSON body");
  }
  const addr =
    body && typeof body === "object" && "address" in body && typeof (body as AuthChallengeRequest).address === "string"
      ? (body as AuthChallengeRequest).address.trim()
      : "";
  if (!addr) return badRequest(c, "address is required");

  const out = createChallenge(addr);
  return c.json({
    challengeId: out.challengeId,
    message: out.message,
    expiresAt: out.expiresAt,
  });
}

export async function postAuthVerify(c: Context) {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return badRequest(c, "Expected JSON body");
  }
  const b = body as Partial<AuthVerifyRequest>;
  const challengeId = typeof b.challengeId === "string" ? b.challengeId.trim() : "";
  const address = typeof b.address === "string" ? b.address.trim() : "";
  const signature = typeof b.signature === "string" ? b.signature.trim() : "";
  if (!challengeId || !address || !signature) {
    return badRequest(c, "challengeId, address, and signature are required");
  }

  const ch = getChallenge(challengeId);
  if (!ch || ch.address !== address) {
    return c.json({ error: "invalid_challenge", message: "Challenge expired or unknown" }, 401);
  }

  if (!verifySolanaSignature(ch.message, signature, address)) {
    return c.json({ error: "invalid_signature", message: "Signature verification failed" }, 401);
  }

  removeChallenge(challengeId);

  const { sessionId } = await createSession(address);
  attachSessionCookie(c, sessionId);

  const rec = getSessionRecord(sessionId);
  if (!rec) return c.json({ error: "server_error", message: "Session not created" }, 500);

  const user = await loadUserDto(rec.userId);
  if (!user) return c.json({ error: "server_error", message: "User not found" }, 500);

  return c.json({
    user,
    accessToken: sessionId,
    tokenExpiresAt: new Date(rec.exp).toISOString(),
  });
}

export async function logout(c: Context) {
  const sid = getSessionIdFromRequest(c);
  if (sid) deleteSession(sid);
  clearSessionCookie(c);
  return c.json({ ok: true as const });
}

export async function getMe(c: Context) {
  const sid = getSessionIdFromRequest(c);
  if (!sid) return c.json({ error: "unauthorized", message: "No session" }, 401);
  const rec = getSessionRecord(sid);
  if (!rec) return c.json({ error: "unauthorized", message: "Invalid session" }, 401);

  const user = await loadUserDto(rec.userId);
  if (!user) return c.json({ error: "not_found", message: "User not found" }, 404);
  return c.json({ user });
}

export async function getBootstrap(c: Context) {
  const sid = getSessionIdFromRequest(c);
  if (!sid) return c.json({ error: "unauthorized", message: "No session" }, 401);
  const rec = getSessionRecord(sid);
  if (!rec) return c.json({ error: "unauthorized", message: "Invalid session" }, 401);

  const user = await loadUserDto(rec.userId);
  if (!user) return c.json({ error: "not_found", message: "User not found" }, 404);

  const ws = await getDefaultWorkspaceForUser(rec.userId);
  if (!ws) return c.json({ error: "not_found", message: "No workspace" }, 404);

  const workspaceKey = ws.externalKey ?? ws.id;
  let recentAnalyses: DashboardBootstrapResponse["recentAnalyses"] = [];
  try {
    const page = await listAnalysisRuns(workspaceKey);
    recentAnalyses = page.items.slice(0, 5);
  } catch {
    /* non-fatal */
  }

  const jupiterConfigured = !!process.env.JUPITER_ULTRA_API_KEY?.trim();

  const payload: DashboardBootstrapResponse = {
    user,
    workspace: {
      id: ws.id,
      name: ws.name,
      slug: ws.externalKey ?? undefined,
      role: "owner",
      createdAt: ws.createdAt as import("../contracts/common.js").IsoDateTimeString,
    },
    flags: {
      composerEnabled: true,
      jupiterProxyEnabled: jupiterConfigured,
      liveChainQueriesEnabled: true,
    },
    plan: {
      id: "placeholder",
      label: "Development",
      creditsRemaining: null,
    },
    recentAnalyses,
  };

  return c.json(payload);
}
