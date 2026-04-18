import bs58 from "bs58";
import nacl from "tweetnacl";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { getSupabaseAdmin, isSupabaseAnalysesEnabled } from "../lib/supabaseAdmin.js";
import type { IsoDateTimeString } from "../contracts/common.js";
import type { UserDto } from "../contracts/user.js";

const COOKIE_NAME = "cockpit_session";
const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type ChallengeRecord = {
  message: string;
  address: string;
  exp: number;
};

type SessionRecord = {
  userId: string;
  wallet: string;
  exp: number;
};

const challenges = new Map<string, ChallengeRecord>();
const sessions = new Map<string, SessionRecord>();

/** In-memory users when Supabase is off (local dev auth only). */
const memoryUsersByWallet = new Map<string, { id: string; createdAt: string }>();
const memoryWorkspacesByUser = new Map<string, { id: string; name: string; createdAt: string }>();

function nowIso(): IsoDateTimeString {
  return new Date().toISOString();
}

export function verifySolanaSignature(message: string, signatureInput: string, addressBase58: string): boolean {
  try {
    const pubkey = bs58.decode(addressBase58);
    if (pubkey.length !== 32) return false;
    let sigBytes: Uint8Array;
    const trimmed = signatureInput.trim();
    if (/^[0-9a-f]+$/i.test(trimmed) && trimmed.length === 128) {
      sigBytes = new Uint8Array(64);
      for (let i = 0; i < 64; i++) {
        sigBytes[i] = parseInt(trimmed.slice(i * 2, i * 2 + 2), 16);
      }
    } else {
      try {
        sigBytes = bs58.decode(trimmed);
      } catch {
        const raw = atob(trimmed);
        sigBytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) sigBytes[i] = raw.charCodeAt(i);
      }
    }
    if (sigBytes.length !== 64) return false;
    const msg = new TextEncoder().encode(message);
    return nacl.sign.detached.verify(msg, sigBytes, pubkey);
  } catch {
    return false;
  }
}

export function createChallenge(address: string): { challengeId: string; message: string; expiresAt: IsoDateTimeString } {
  const challengeId = crypto.randomUUID();
  const issued = nowIso();
  const message = [
    "Cockpit sign-in",
    `Challenge: ${challengeId}`,
    `Address: ${address}`,
    `Issued: ${issued}`,
  ].join("\n");
  challenges.set(challengeId, {
    message,
    address,
    exp: Date.now() + CHALLENGE_TTL_MS,
  });
  return {
    challengeId,
    message,
    expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS).toISOString() as IsoDateTimeString,
  };
}

export function getChallenge(challengeId: string): ChallengeRecord | null {
  const c = challenges.get(challengeId);
  if (!c || Date.now() > c.exp) return null;
  return c;
}

export function removeChallenge(challengeId: string): void {
  challenges.delete(challengeId);
}

async function ensureUserForWallet(wallet: string): Promise<{ userId: string }> {
  if (isSupabaseAnalysesEnabled()) {
    const sb = getSupabaseAdmin();
    const { data: existing, error: selE } = await sb.from("users").select("id").eq("wallet", wallet).maybeSingle();
    if (selE) throw selE;
    if (existing) return { userId: existing.id as string };

    const { data: inserted, error: insE } = await sb.from("users").insert({ wallet }).select("id").single();
    if (insE) throw insE;
    const userId = inserted!.id as string;

    const { error: wsE } = await sb.from("workspaces").insert({
      owner_user_id: userId,
      name: "Primary workspace",
    });
    if (wsE) throw wsE;
    return { userId };
  }

  let u = memoryUsersByWallet.get(wallet);
  if (!u) {
    const id = crypto.randomUUID();
    const createdAt = nowIso();
    u = { id, createdAt };
    memoryUsersByWallet.set(wallet, u);
    memoryWorkspacesByUser.set(id, {
      id: crypto.randomUUID(),
      name: "Primary workspace",
      createdAt,
    });
  }
  return { userId: u.id };
}

export async function createSession(wallet: string): Promise<{ sessionId: string; userId: string }> {
  const { userId } = await ensureUserForWallet(wallet);
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, {
    userId,
    wallet,
    exp: Date.now() + SESSION_TTL_MS,
  });
  return { sessionId, userId };
}

export function getSessionRecord(sessionId: string): SessionRecord | null {
  const s = sessions.get(sessionId);
  if (!s) return null;
  if (Date.now() > s.exp) {
    sessions.delete(sessionId);
    return null;
  }
  return s;
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function attachSessionCookie(c: Context, sessionId: string): void {
  setCookie(c, COOKIE_NAME, sessionId, {
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, COOKIE_NAME, { path: "/" });
}

export function getSessionIdFromRequest(c: Context): string | undefined {
  return getCookie(c, COOKIE_NAME) ?? undefined;
}

export async function loadUserDto(userId: string): Promise<UserDto | null> {
  if (isSupabaseAnalysesEnabled()) {
    const sb = getSupabaseAdmin();
    const { data: row, error } = await sb.from("users").select("*").eq("id", userId).maybeSingle();
    if (error) throw error;
    if (!row) return null;
    const ts = (row.last_seen_at ?? row.created_at) as string;
    return {
      id: row.id as string,
      primaryWalletAddress: row.wallet as string,
      createdAt: row.created_at as IsoDateTimeString,
      updatedAt: ts as IsoDateTimeString,
    };
  }
  for (const [w, u] of memoryUsersByWallet) {
    if (u.id === userId) {
      return {
        id: u.id,
        primaryWalletAddress: w,
        createdAt: u.createdAt as IsoDateTimeString,
        updatedAt: u.createdAt as IsoDateTimeString,
      };
    }
  }
  return null;
}

export async function getDefaultWorkspaceForUser(userId: string): Promise<{
  id: string;
  name: string;
  externalKey: string | null;
  createdAt: string;
} | null> {
  if (isSupabaseAnalysesEnabled()) {
    const sb = getSupabaseAdmin();
    const { data: ws, error } = await sb
      .from("workspaces")
      .select("id, name, external_key, created_at")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!ws) return null;
    return {
      id: ws.id as string,
      name: ws.name as string,
      externalKey: (ws.external_key as string | null) ?? null,
      createdAt: ws.created_at as string,
    };
  }
  const ws = memoryWorkspacesByUser.get(userId);
  if (!ws) return null;
  return {
    id: ws.id,
    name: ws.name,
    externalKey: null,
    createdAt: ws.createdAt,
  };
}

export async function renameDefaultWorkspaceForUser(userId: string, nextName: string): Promise<{
  id: string;
  name: string;
  externalKey: string | null;
  createdAt: string;
} | null> {
  const normalized = nextName.replace(/\s+/g, " ").trim();
  if (!normalized) {
    throw new Error("workspace_name_required");
  }

  const workspace = await getDefaultWorkspaceForUser(userId);
  if (!workspace) return null;

  if (isSupabaseAnalysesEnabled()) {
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("workspaces").update({ name: normalized }).eq("id", workspace.id);
    if (error) throw error;
  } else {
    const memoryWorkspace = memoryWorkspacesByUser.get(userId);
    if (!memoryWorkspace) return null;
    memoryWorkspace.name = normalized;
  }

  return {
    ...workspace,
    name: normalized,
  };
}
