/**
 * Cockpit API — entrypoint.
 * Auth, bootstrap, workspace settings, cases, and Jupiter proxy.
 */
import "dotenv/config";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import type { CreateAnalysisRequest } from "./contracts/analyses.js";
import type { CreateCaseRequest, LinkAnalysisToCaseRequest, UpdateCaseRequest } from "./contracts/cases.js";
import type {
  CreateOsintDarkMarketplaceRequest,
  CreateOsintDarkProductRequest,
  CreateOsintDarkVendorRequest,
  UpdateOsintDarkMarketplaceRequest,
  UpdateOsintDarkProductRequest,
  UpdateOsintDarkVendorRequest,
} from "./contracts/osintDarkWeb.js";
import {
  addAnalysisToCase,
  createCase,
  getCase,
  listCases,
  removeAnalysisFromCase,
  updateCase,
} from "./services/caseStore.js";
import { getBootstrap, getMe, logout, postAuthChallenge, postAuthVerify } from "./services/cockpitAuthRoutes.js";
import { getDatabaseHealth } from "./services/dbHealth.js";
import { getIntegrationStatuses } from "./services/integrationStatus.js";
import {
  createAnalysisRun,
  getAnalysisRun,
  listAnalysisRuns,
  subscribeAnalysisEvents,
} from "./services/analysisRunStore.js";
import {
  createOsintDarkMarketplace,
  createOsintDarkProduct,
  createOsintDarkVendor,
  deleteOsintDarkMarketplace,
  deleteOsintDarkProduct,
  deleteOsintDarkVendor,
  getOsintDarkWebTree,
  listOsintDarkMarketplaces,
  listOsintDarkProducts,
  listOsintDarkVendors,
  updateOsintDarkMarketplace,
  updateOsintDarkProduct,
  updateOsintDarkVendor,
} from "./services/osintDarkWebStore.js";
import {
  getDefaultWorkspaceForUser,
  getSessionIdFromRequest,
  getSessionRecord,
  renameDefaultWorkspaceForUser,
} from "./services/walletSession.js";

const app = new Hono();
const defaultAllowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const configuredOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = configuredOrigins.length ? configuredOrigins : defaultAllowedOrigins;

function badRequest(c: Context, message: string) {
  return c.json({ error: "validation_error", message }, 400);
}

function osintStoreError(c: Context, error: unknown, routeLabel: string) {
  const msg = error instanceof Error ? error.message : String(error);
  if (
    msg === "case_not_found" ||
    msg === "marketplace_not_found" ||
    msg === "vendor_not_found" ||
    msg === "product_not_found"
  ) {
    return c.json({ error: "not_found", message: msg.replaceAll("_", " ") }, 404);
  }
  if (msg === "case_workspace_mismatch" || msg === "workspace_id_required") {
    return c.json({ error: "validation_error", message: msg.replaceAll("_", " ") }, 400);
  }
  console.error(`${routeLabel}:`, error);
  return c.json({ error: "server_error", message: "OSINT request failed" }, 500);
}

function caseStoreError(c: Context, error: unknown, routeLabel: string) {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg === "workspace_not_found" || msg === "case_not_found" || msg === "analysis_not_found") {
    return c.json({ error: "not_found", message: msg.replaceAll("_", " ") }, 404);
  }
  if (
    msg === "case_title_required" ||
    msg === "invalid_case_status" ||
    msg === "invalid_case_priority" ||
    msg === "analysis_workspace_mismatch"
  ) {
    return c.json({ error: "validation_error", message: msg.replaceAll("_", " ") }, 400);
  }
  console.error(`${routeLabel}:`, error);
  return c.json({ error: "server_error", message: "Case request failed" }, 500);
}

app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (!origin) return allowedOrigins[0] ?? "*";
      return allowedOrigins.includes(origin) ? origin : null;
    },
    credentials: true,
  }),
);

app.get("/", (c) =>
  c.json({
    ok: true,
    service: "cockpit-api",
    message: "Cockpit backend is running.",
    docs: {
      health: "/health",
      authChallenge: "POST /auth/challenge",
      authVerify: "POST /auth/verify",
      me: "GET /me",
      bootstrap: "GET /dashboard/bootstrap",
      integrations: "GET /settings/integrations",
      updateWorkspace: "PATCH /workspaces/:workspaceId",
      createCase: "POST /cases",
      listCases: "GET /cases?workspaceId=...",
      getCase: "GET /cases/:id",
      updateCase: "PATCH /cases/:id",
      linkCaseAnalysis: "POST /cases/:id/analyses",
      unlinkCaseAnalysis: "DELETE /cases/:id/analyses/:analysisId",
      osintDarkWebTree: "GET /cases/:id/osint/dark-web/tree?workspaceId=...",
      osintDarkWebMarketplaces: "GET|POST /cases/:id/osint/dark-web/marketplaces",
      jupiterUltra: "GET /ultra/v1/order?...",
      createAnalysis: "POST /analyses",
      listAnalyses: "GET /analyses?workspaceId=...",
      streamAnalysis: "GET /analyses/:id/stream",
    },
    cors: {
      allowedOrigins,
    },
    ts: new Date().toISOString(),
  }),
);

app.get("/health", async (c) => {
  const db = await getDatabaseHealth();
  return c.json({
    ok: true,
    service: "cockpit-api",
    ts: new Date().toISOString(),
    database: db,
  });
});

app.post("/auth/challenge", postAuthChallenge);
app.post("/auth/verify", postAuthVerify);
app.post("/auth/logout", logout);
app.get("/me", getMe);
app.get("/dashboard/bootstrap", getBootstrap);

app.get("/settings/integrations", (c) => {
  return c.json({ items: getIntegrationStatuses() });
});

app.patch("/workspaces/:workspaceId", async (c) => {
  const sid = getSessionIdFromRequest(c);
  if (!sid) return c.json({ error: "unauthorized", message: "No session" }, 401);
  const rec = getSessionRecord(sid);
  if (!rec) return c.json({ error: "unauthorized", message: "Invalid session" }, 401);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return badRequest(c, "Expected JSON body");
  }

  const name =
    body && typeof body === "object" && "name" in body && typeof (body as { name: unknown }).name === "string"
      ? (body as { name: string }).name.trim()
      : "";
  if (!name) {
    return badRequest(c, "name is required");
  }

  const workspaceId = c.req.param("workspaceId").trim();

  try {
    const workspace = await getDefaultWorkspaceForUser(rec.userId);
    if (!workspace) return c.json({ error: "not_found", message: "Workspace not found" }, 404);
    const matchesWorkspace = workspaceId === workspace.id || workspaceId === (workspace.externalKey ?? "");
    if (!matchesWorkspace) return c.json({ error: "not_found", message: "Workspace not found" }, 404);

    const updated = await renameDefaultWorkspaceForUser(rec.userId, name);
    if (!updated) return c.json({ error: "not_found", message: "Workspace not found" }, 404);

    return c.json({
      workspace: {
        id: updated.id,
        name: updated.name,
        slug: updated.externalKey ?? undefined,
        role: "owner" as const,
        createdAt: updated.createdAt,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === "workspace_name_required") {
      return badRequest(c, "name is required");
    }
    console.error("PATCH /workspaces/:workspaceId:", error);
    return c.json({ error: "server_error", message: "Failed to update workspace" }, 500);
  }
});

const JUPITER_ULTRA_ORDER_DEFAULT = "https://api.jup.ag/ultra/v1/order";

app.get("/ultra/v1/order", async (c) => {
  const key = process.env.JUPITER_ULTRA_API_KEY?.trim();
  if (!key) {
    return c.json(
      { error: "not_configured", message: "Set JUPITER_ULTRA_API_KEY for Jupiter Ultra proxy" },
      503,
    );
  }
  const base = (process.env.JUPITER_ULTRA_ORDER_URL ?? JUPITER_ULTRA_ORDER_DEFAULT).trim();
  const incoming = new URL(c.req.url);
  const target = new URL(base);
  target.search = incoming.search;
  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      headers: { "x-api-key": key },
    });
  } catch (error) {
    console.error("Jupiter Ultra proxy fetch failed:", error);
    return c.json({ error: "upstream_error", message: "Failed to reach Jupiter Ultra" }, 502);
  }
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
});

app.post("/analyses", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return badRequest(c, "Expected JSON body");
  }
  const workspaceId =
    body &&
    typeof body === "object" &&
    "workspaceId" in body &&
    typeof (body as { workspaceId: unknown }).workspaceId === "string"
      ? (body as { workspaceId: string }).workspaceId
      : "";
  const prompt =
    body && typeof body === "object" && "prompt" in body && typeof (body as { prompt: unknown }).prompt === "string"
      ? (body as { prompt: string }).prompt
      : "";

  if (!workspaceId.trim() || !prompt.trim()) {
    return c.json(
      {
        error: "validation_error",
        message: "workspaceId and prompt are required",
      },
      400,
    );
  }

  const req: CreateAnalysisRequest = {
    workspaceId: workspaceId.trim(),
    prompt: prompt.trim(),
  };
  if (body && typeof body === "object" && "title" in body && typeof (body as { title: unknown }).title === "string") {
    req.title = (body as { title: string }).title;
  }
  if (
    body &&
    typeof body === "object" &&
    "clientRequestId" in body &&
    typeof (body as { clientRequestId: unknown }).clientRequestId === "string"
  ) {
    req.clientRequestId = (body as { clientRequestId: string }).clientRequestId;
  }

  try {
    const analysis = await createAnalysisRun(req);
    return c.json({ analysis }, 201);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === "workspace_not_found") {
      return c.json({ error: "not_found", message: "Workspace not found" }, 404);
    }
    console.error("POST /analyses:", error);
    return c.json({ error: "server_error", message: "Failed to create analysis" }, 500);
  }
});

app.get("/analyses", async (c) => {
  const workspaceId = c.req.query("workspaceId") ?? "";
  if (!workspaceId.trim()) {
    return c.json({ error: "validation_error", message: "workspaceId is required" }, 400);
  }
  try {
    return c.json(await listAnalysisRuns(workspaceId.trim()));
  } catch (error) {
    console.error("GET /analyses:", error);
    return c.json({ error: "server_error", message: "Failed to list analyses" }, 500);
  }
});

app.get("/analyses/:id", async (c) => {
  const id = c.req.param("id");
  const run = await getAnalysisRun(id);
  if (!run) return c.json({ error: "not_found", message: "Analysis not found" }, 404);
  return c.json(run);
});

app.get("/cases", async (c) => {
  const workspaceId = c.req.query("workspaceId") ?? "";
  if (!workspaceId.trim()) {
    return badRequest(c, "workspaceId is required");
  }

  try {
    return c.json(await listCases(workspaceId.trim()));
  } catch (error) {
    return caseStoreError(c, error, "GET /cases");
  }
});

app.post("/cases", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return badRequest(c, "Expected JSON body");
  }

  const workspaceId =
    body &&
    typeof body === "object" &&
    "workspaceId" in body &&
    typeof (body as { workspaceId: unknown }).workspaceId === "string"
      ? (body as { workspaceId: string }).workspaceId.trim()
      : "";
  const title =
    body && typeof body === "object" && "title" in body && typeof (body as { title: unknown }).title === "string"
      ? (body as { title: string }).title
      : "";

  if (!workspaceId || !title.trim()) {
    return badRequest(c, "workspaceId and title are required");
  }

  const request: CreateCaseRequest = {
    workspaceId,
    title,
  };
  if (
    body &&
    typeof body === "object" &&
    "description" in body &&
    typeof (body as { description: unknown }).description === "string"
  ) {
    request.description = (body as { description: string }).description;
  }
  if (body && typeof body === "object" && "status" in body && typeof (body as { status: unknown }).status === "string") {
    request.status = (body as { status: CreateCaseRequest["status"] }).status;
  }
  if (
    body &&
    typeof body === "object" &&
    "priority" in body &&
    typeof (body as { priority: unknown }).priority === "string"
  ) {
    request.priority = (body as { priority: CreateCaseRequest["priority"] }).priority;
  }

  try {
    const value = await createCase(request);
    return c.json({ case: value }, 201);
  } catch (error) {
    return caseStoreError(c, error, "POST /cases");
  }
});

app.get("/cases/:id", async (c) => {
  try {
    const value = await getCase(c.req.param("id"));
    if (!value) return c.json({ error: "not_found", message: "Case not found" }, 404);
    return c.json({ case: value });
  } catch (error) {
    return caseStoreError(c, error, "GET /cases/:id");
  }
});

app.patch("/cases/:id", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return badRequest(c, "Expected JSON body");
  }

  const patch: UpdateCaseRequest = {};
  if (body && typeof body === "object" && "title" in body && typeof (body as { title: unknown }).title === "string") {
    patch.title = (body as { title: string }).title;
  }
  if (
    body &&
    typeof body === "object" &&
    "description" in body &&
    typeof (body as { description: unknown }).description === "string"
  ) {
    patch.description = (body as { description: string }).description;
  }
  if (body && typeof body === "object" && "status" in body && typeof (body as { status: unknown }).status === "string") {
    patch.status = (body as { status: UpdateCaseRequest["status"] }).status;
  }
  if (
    body &&
    typeof body === "object" &&
    "priority" in body &&
    typeof (body as { priority: unknown }).priority === "string"
  ) {
    patch.priority = (body as { priority: UpdateCaseRequest["priority"] }).priority;
  }

  if (!Object.keys(patch).length) {
    return badRequest(c, "At least one field must be provided");
  }

  try {
    return c.json({ case: await updateCase(c.req.param("id"), patch) });
  } catch (error) {
    return caseStoreError(c, error, "PATCH /cases/:id");
  }
});

app.post("/cases/:id/analyses", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return badRequest(c, "Expected JSON body");
  }

  const request: LinkAnalysisToCaseRequest = {
    analysisId:
      body &&
      typeof body === "object" &&
      "analysisId" in body &&
      typeof (body as { analysisId: unknown }).analysisId === "string"
        ? (body as { analysisId: string }).analysisId.trim()
        : "",
  };
  if (!request.analysisId) {
    return badRequest(c, "analysisId is required");
  }

  try {
    return c.json({ case: await addAnalysisToCase(c.req.param("id"), request.analysisId) });
  } catch (error) {
    return caseStoreError(c, error, "POST /cases/:id/analyses");
  }
});

app.delete("/cases/:id/analyses/:analysisId", async (c) => {
  try {
    return c.json({ case: await removeAnalysisFromCase(c.req.param("id"), c.req.param("analysisId")) });
  } catch (error) {
    return caseStoreError(c, error, "DELETE /cases/:id/analyses/:analysisId");
  }
});

function bodyWorkspaceId(body: unknown): string {
  if (body && typeof body === "object" && "workspaceId" in body && typeof (body as { workspaceId: unknown }).workspaceId === "string") {
    return (body as { workspaceId: string }).workspaceId.trim();
  }
  return "";
}

/** Dark-web OSINT entity graph (marketplace → vendor → product), scoped by case + workspaceId. */
app.get("/cases/:caseId/osint/dark-web/tree", async (c) => {
  const workspaceId = c.req.query("workspaceId") ?? "";
  if (!workspaceId.trim()) return badRequest(c, "workspaceId is required");
  try {
    return c.json({ tree: await getOsintDarkWebTree(c.req.param("caseId"), workspaceId.trim()) });
  } catch (error) {
    return osintStoreError(c, error, "GET .../osint/dark-web/tree");
  }
});

app.get("/cases/:caseId/osint/dark-web/marketplaces", async (c) => {
  const workspaceId = c.req.query("workspaceId") ?? "";
  if (!workspaceId.trim()) return badRequest(c, "workspaceId is required");
  try {
    return c.json({ marketplaces: await listOsintDarkMarketplaces(c.req.param("caseId"), workspaceId.trim()) });
  } catch (error) {
    return osintStoreError(c, error, "GET .../osint/dark-web/marketplaces");
  }
});

app.post("/cases/:caseId/osint/dark-web/marketplaces", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return badRequest(c, "Expected JSON body");
  }
  const workspaceId = bodyWorkspaceId(body);
  if (!workspaceId) return badRequest(c, "workspaceId is required");
  const req = { workspaceId, ...parseMarketplaceBody(body) } as CreateOsintDarkMarketplaceRequest;
  try {
    const marketplace = await createOsintDarkMarketplace(c.req.param("caseId"), req);
    return c.json({ marketplace }, 201);
  } catch (error) {
    return osintStoreError(c, error, "POST .../osint/dark-web/marketplaces");
  }
});

function parseMarketplaceBody(body: unknown): Omit<CreateOsintDarkMarketplaceRequest, "workspaceId"> {
  if (!body || typeof body !== "object") return {};
  const b = body as Record<string, unknown>;
  return {
    label: typeof b.label === "string" ? b.label : null,
    onionUrl: typeof b.onionUrl === "string" ? b.onionUrl : null,
    faviconHash: typeof b.faviconHash === "string" ? b.faviconHash : null,
    httpHeaders: b.httpHeaders && typeof b.httpHeaders === "object" ? (b.httpHeaders as Record<string, unknown>) : undefined,
    sourceCodeNotes: typeof b.sourceCodeNotes === "string" ? b.sourceCodeNotes : null,
    adminEmail: typeof b.adminEmail === "string" ? b.adminEmail : null,
    extra: b.extra && typeof b.extra === "object" ? (b.extra as Record<string, unknown>) : undefined,
  };
}

function parseMarketplacePatch(body: unknown): Omit<UpdateOsintDarkMarketplaceRequest, "workspaceId"> {
  if (!body || typeof body !== "object") return {};
  const b = body as Record<string, unknown>;
  const out: Omit<UpdateOsintDarkMarketplaceRequest, "workspaceId"> = {};
  if ("label" in b) out.label = typeof b.label === "string" ? b.label : null;
  if ("onionUrl" in b) out.onionUrl = typeof b.onionUrl === "string" ? b.onionUrl : null;
  if ("faviconHash" in b) out.faviconHash = typeof b.faviconHash === "string" ? b.faviconHash : null;
  if ("httpHeaders" in b && b.httpHeaders && typeof b.httpHeaders === "object") out.httpHeaders = b.httpHeaders as Record<string, unknown>;
  if ("sourceCodeNotes" in b) out.sourceCodeNotes = typeof b.sourceCodeNotes === "string" ? b.sourceCodeNotes : null;
  if ("adminEmail" in b) out.adminEmail = typeof b.adminEmail === "string" ? b.adminEmail : null;
  if ("extra" in b && b.extra && typeof b.extra === "object") out.extra = b.extra as Record<string, unknown>;
  return out;
}

app.patch("/cases/:caseId/osint/dark-web/marketplaces/:marketplaceId", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return badRequest(c, "Expected JSON body");
  }
  const workspaceId = bodyWorkspaceId(body);
  if (!workspaceId) return badRequest(c, "workspaceId is required");
  const req = { workspaceId, ...parseMarketplacePatch(body) } as UpdateOsintDarkMarketplaceRequest;
  try {
    return c.json({
      marketplace: await updateOsintDarkMarketplace(c.req.param("caseId"), c.req.param("marketplaceId"), req),
    });
  } catch (error) {
    return osintStoreError(c, error, "PATCH .../marketplaces/:marketplaceId");
  }
});

app.delete("/cases/:caseId/osint/dark-web/marketplaces/:marketplaceId", async (c) => {
  const workspaceId = c.req.query("workspaceId") ?? "";
  if (!workspaceId.trim()) return badRequest(c, "workspaceId is required");
  try {
    await deleteOsintDarkMarketplace(c.req.param("caseId"), c.req.param("marketplaceId"), workspaceId.trim());
    return c.json({ ok: true });
  } catch (error) {
    return osintStoreError(c, error, "DELETE .../marketplaces/:marketplaceId");
  }
});

app.get("/cases/:caseId/osint/dark-web/marketplaces/:marketplaceId/vendors", async (c) => {
  const workspaceId = c.req.query("workspaceId") ?? "";
  if (!workspaceId.trim()) return badRequest(c, "workspaceId is required");
  try {
    return c.json({
      vendors: await listOsintDarkVendors(c.req.param("caseId"), c.req.param("marketplaceId"), workspaceId.trim()),
    });
  } catch (error) {
    return osintStoreError(c, error, "GET .../vendors");
  }
});

function parseVendorBody(body: unknown): Omit<CreateOsintDarkVendorRequest, "workspaceId"> {
  if (!body || typeof body !== "object") return {};
  const b = body as Record<string, unknown>;
  return {
    username: typeof b.username === "string" ? b.username : null,
    joinDate: typeof b.joinDate === "string" ? b.joinDate : null,
    location: typeof b.location === "string" ? b.location : null,
    forumPosts: typeof b.forumPosts === "number" ? b.forumPosts : null,
    pgpKeyId: typeof b.pgpKeyId === "string" ? b.pgpKeyId : null,
    contact: b.contact && typeof b.contact === "object" ? (b.contact as Record<string, unknown>) : undefined,
    cryptoWallets: Array.isArray(b.cryptoWallets) ? b.cryptoWallets : undefined,
    salesCount: typeof b.salesCount === "number" ? b.salesCount : null,
    reviewsText: typeof b.reviewsText === "string" ? b.reviewsText : null,
    shippingInfo: typeof b.shippingInfo === "string" ? b.shippingInfo : null,
    storeDescription: typeof b.storeDescription === "string" ? b.storeDescription : null,
    extra: b.extra && typeof b.extra === "object" ? (b.extra as Record<string, unknown>) : undefined,
  };
}

function parseVendorPatch(body: unknown): Omit<UpdateOsintDarkVendorRequest, "workspaceId"> {
  if (!body || typeof body !== "object") return {};
  const b = body as Record<string, unknown>;
  const out: Omit<UpdateOsintDarkVendorRequest, "workspaceId"> = {};
  if ("username" in b) out.username = typeof b.username === "string" ? b.username : null;
  if ("joinDate" in b) out.joinDate = typeof b.joinDate === "string" ? b.joinDate : null;
  if ("location" in b) out.location = typeof b.location === "string" ? b.location : null;
  if ("forumPosts" in b) out.forumPosts = typeof b.forumPosts === "number" ? b.forumPosts : null;
  if ("pgpKeyId" in b) out.pgpKeyId = typeof b.pgpKeyId === "string" ? b.pgpKeyId : null;
  if ("contact" in b && b.contact && typeof b.contact === "object") out.contact = b.contact as Record<string, unknown>;
  if ("cryptoWallets" in b && Array.isArray(b.cryptoWallets)) out.cryptoWallets = b.cryptoWallets;
  if ("salesCount" in b) out.salesCount = typeof b.salesCount === "number" ? b.salesCount : null;
  if ("reviewsText" in b) out.reviewsText = typeof b.reviewsText === "string" ? b.reviewsText : null;
  if ("shippingInfo" in b) out.shippingInfo = typeof b.shippingInfo === "string" ? b.shippingInfo : null;
  if ("storeDescription" in b) out.storeDescription = typeof b.storeDescription === "string" ? b.storeDescription : null;
  if ("extra" in b && b.extra && typeof b.extra === "object") out.extra = b.extra as Record<string, unknown>;
  return out;
}

app.post("/cases/:caseId/osint/dark-web/marketplaces/:marketplaceId/vendors", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return badRequest(c, "Expected JSON body");
  }
  const workspaceId = bodyWorkspaceId(body);
  if (!workspaceId) return badRequest(c, "workspaceId is required");
  const req = { workspaceId, ...parseVendorBody(body) } as CreateOsintDarkVendorRequest;
  try {
    const vendor = await createOsintDarkVendor(c.req.param("caseId"), c.req.param("marketplaceId"), req);
    return c.json({ vendor }, 201);
  } catch (error) {
    return osintStoreError(c, error, "POST .../vendors");
  }
});

app.patch("/cases/:caseId/osint/dark-web/vendors/:vendorId", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return badRequest(c, "Expected JSON body");
  }
  const workspaceId = bodyWorkspaceId(body);
  if (!workspaceId) return badRequest(c, "workspaceId is required");
  const req = { workspaceId, ...parseVendorPatch(body) } as UpdateOsintDarkVendorRequest;
  try {
    return c.json({ vendor: await updateOsintDarkVendor(c.req.param("caseId"), c.req.param("vendorId"), req) });
  } catch (error) {
    return osintStoreError(c, error, "PATCH .../vendors/:vendorId");
  }
});

app.delete("/cases/:caseId/osint/dark-web/vendors/:vendorId", async (c) => {
  const workspaceId = c.req.query("workspaceId") ?? "";
  if (!workspaceId.trim()) return badRequest(c, "workspaceId is required");
  try {
    await deleteOsintDarkVendor(c.req.param("caseId"), c.req.param("vendorId"), workspaceId.trim());
    return c.json({ ok: true });
  } catch (error) {
    return osintStoreError(c, error, "DELETE .../vendors/:vendorId");
  }
});

function parseProductBody(body: unknown): Omit<CreateOsintDarkProductRequest, "workspaceId"> {
  if (!body || typeof body !== "object") return {};
  const b = body as Record<string, unknown>;
  return {
    title: typeof b.title === "string" ? b.title : null,
    description: typeof b.description === "string" ? b.description : null,
    photoUrls: Array.isArray(b.photoUrls) ? b.photoUrls.filter((u): u is string => typeof u === "string") : undefined,
    photoMetadata: b.photoMetadata && typeof b.photoMetadata === "object" ? (b.photoMetadata as Record<string, unknown>) : undefined,
    reviewsText: typeof b.reviewsText === "string" ? b.reviewsText : null,
    extra: b.extra && typeof b.extra === "object" ? (b.extra as Record<string, unknown>) : undefined,
  };
}

function parseProductPatch(body: unknown): Omit<UpdateOsintDarkProductRequest, "workspaceId"> {
  if (!body || typeof body !== "object") return {};
  const b = body as Record<string, unknown>;
  const out: Omit<UpdateOsintDarkProductRequest, "workspaceId"> = {};
  if ("title" in b) out.title = typeof b.title === "string" ? b.title : null;
  if ("description" in b) out.description = typeof b.description === "string" ? b.description : null;
  if ("photoUrls" in b && Array.isArray(b.photoUrls)) out.photoUrls = b.photoUrls.filter((u): u is string => typeof u === "string");
  if ("photoMetadata" in b && b.photoMetadata && typeof b.photoMetadata === "object")
    out.photoMetadata = b.photoMetadata as Record<string, unknown>;
  if ("reviewsText" in b) out.reviewsText = typeof b.reviewsText === "string" ? b.reviewsText : null;
  if ("extra" in b && b.extra && typeof b.extra === "object") out.extra = b.extra as Record<string, unknown>;
  return out;
}

app.get("/cases/:caseId/osint/dark-web/vendors/:vendorId/products", async (c) => {
  const workspaceId = c.req.query("workspaceId") ?? "";
  if (!workspaceId.trim()) return badRequest(c, "workspaceId is required");
  try {
    return c.json({
      products: await listOsintDarkProducts(c.req.param("caseId"), c.req.param("vendorId"), workspaceId.trim()),
    });
  } catch (error) {
    return osintStoreError(c, error, "GET .../products");
  }
});

app.post("/cases/:caseId/osint/dark-web/vendors/:vendorId/products", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return badRequest(c, "Expected JSON body");
  }
  const workspaceId = bodyWorkspaceId(body);
  if (!workspaceId) return badRequest(c, "workspaceId is required");
  const req = { workspaceId, ...parseProductBody(body) } as CreateOsintDarkProductRequest;
  try {
    const product = await createOsintDarkProduct(c.req.param("caseId"), c.req.param("vendorId"), req);
    return c.json({ product }, 201);
  } catch (error) {
    return osintStoreError(c, error, "POST .../products");
  }
});

app.patch("/cases/:caseId/osint/dark-web/products/:productId", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return badRequest(c, "Expected JSON body");
  }
  const workspaceId = bodyWorkspaceId(body);
  if (!workspaceId) return badRequest(c, "workspaceId is required");
  const req = { workspaceId, ...parseProductPatch(body) } as UpdateOsintDarkProductRequest;
  try {
    return c.json({ product: await updateOsintDarkProduct(c.req.param("caseId"), c.req.param("productId"), req) });
  } catch (error) {
    return osintStoreError(c, error, "PATCH .../products/:productId");
  }
});

app.delete("/cases/:caseId/osint/dark-web/products/:productId", async (c) => {
  const workspaceId = c.req.query("workspaceId") ?? "";
  if (!workspaceId.trim()) return badRequest(c, "workspaceId is required");
  try {
    await deleteOsintDarkProduct(c.req.param("caseId"), c.req.param("productId"), workspaceId.trim());
    return c.json({ ok: true });
  } catch (error) {
    return osintStoreError(c, error, "DELETE .../products/:productId");
  }
});

/** SSE — aligns with `AnalysisStreamEvent` in contracts. */
app.get("/analyses/:id/stream", (c) => {
  const id = c.req.param("id");
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const unsub = await subscribeAnalysisEvents(id, (event) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        if (event.type === "done") {
          unsub?.();
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        }
      });

      if (!unsub) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              message: "Analysis not found",
            } satisfies { type: "error"; message: string })}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return c.newResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
});

app.notFound((c) =>
  c.json(
    {
      ok: false,
      error: "not_found",
      message: `Route ${c.req.method} ${new URL(c.req.url).pathname} was not found.`,
      availableRoutes: [
        "GET /",
        "GET /health",
        "POST /auth/challenge",
        "POST /auth/verify",
        "POST /auth/logout",
        "GET /me",
        "GET /dashboard/bootstrap",
        "GET /settings/integrations",
        "PATCH /workspaces/:workspaceId",
        "GET /ultra/v1/order",
        "POST /analyses",
        "GET /analyses?workspaceId=...",
        "GET /analyses/:id",
        "GET /analyses/:id/stream",
        "POST /cases",
        "GET /cases?workspaceId=...",
        "GET /cases/:id",
        "PATCH /cases/:id",
        "POST /cases/:id/analyses",
        "DELETE /cases/:id/analyses/:analysisId",
        "GET /cases/:caseId/osint/dark-web/tree?workspaceId=...",
        "GET|POST /cases/:caseId/osint/dark-web/marketplaces",
        "PATCH|DELETE /cases/:caseId/osint/dark-web/marketplaces/:marketplaceId",
        "GET|POST /cases/:caseId/osint/dark-web/marketplaces/:marketplaceId/vendors",
        "PATCH|DELETE /cases/:caseId/osint/dark-web/vendors/:vendorId",
        "GET|POST /cases/:caseId/osint/dark-web/vendors/:vendorId/products",
        "PATCH|DELETE /cases/:caseId/osint/dark-web/products/:productId",
      ],
    },
    404,
  ),
);

const port = Number(process.env.PORT) || 8787;

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`cockpit-api listening on http://localhost:${info.port}`);
});

if ("on" in server && typeof (server as { on?: unknown }).on === "function") {
  (server as NodeJS.EventEmitter).on("error", (err: unknown) => {
    const error = err as NodeJS.ErrnoException;
    if (error?.code === "EADDRINUSE") {
      console.error(
        [
          `Port ${port} is already in use (EADDRINUSE).`,
          "Fix: stop the other process, or run on a different port:",
          "  PORT=8788 npm run dev",
          "Debug (macOS):",
          `  lsof -nP -iTCP:${port} -sTCP:LISTEN`,
        ].join("\n"),
      );
      process.exit(1);
    }
    console.error("cockpit-api server error:", err);
    process.exit(1);
  });
}
