/**
 * Flattens an OpenAPI 3.x document into plain text for embedding.
 * Resolves shallow #/components/... $ref links against the root spec.
 */

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete", "head", "options", "trace"]);

function resolveRef(root: Record<string, unknown>, ref: string): unknown {
  if (!ref.startsWith("#/")) return null;
  const parts = ref.slice(2).split("/");
  let cur: unknown = root;
  for (const p of parts) {
    if (cur === null || typeof cur !== "object" || !(p in (cur as object))) return null;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function stringifySchema(schema: unknown, depth = 0): string {
  if (depth > 6 || schema === undefined) return "";
  if (schema === null) return "null";
  if (typeof schema !== "object") return String(schema);
  const s = schema as Record<string, unknown>;
  const parts: string[] = [];
  if (s.type) parts.push(`type: ${String(s.type)}`);
  if (s.enum) parts.push(`enum: ${JSON.stringify(s.enum)}`);
  if (s.default !== undefined) parts.push(`default: ${JSON.stringify(s.default)}`);
  if (s.format) parts.push(`format: ${String(s.format)}`);
  if (s.description && typeof s.description === "string") parts.push(s.description.slice(0, 500));
  if (s.properties && typeof s.properties === "object") {
    parts.push(`properties: ${Object.keys(s.properties as object).join(", ")}`);
  }
  if (s.items) parts.push(`items: ${stringifySchema(s.items, depth + 1)}`);
  return parts.join(" | ") || JSON.stringify(schema).slice(0, 400);
}

function formatParam(
  specRoot: Record<string, unknown>,
  param: unknown,
  seen = new Set<string>()
): string {
  if (!param || typeof param !== "object") return "";
  const p = param as Record<string, unknown>;
  if (typeof p.$ref === "string") {
    if (seen.has(p.$ref)) return "";
    seen.add(p.$ref);
    const resolved = resolveRef(specRoot, p.$ref);
    return formatParam(specRoot, resolved, seen);
  }
  const bits = [
    p.name != null ? `name: ${String(p.name)}` : "",
    p.in != null ? `in: ${String(p.in)}` : "",
    p.required === true ? "required" : "",
    typeof p.description === "string" ? p.description : "",
    p.schema ? `schema (${stringifySchema(p.schema)})` : "",
  ].filter(Boolean);
  return bits.join("\n");
}

function formatOperation(
  specRoot: Record<string, unknown>,
  path: string,
  method: string,
  op: Record<string, unknown>,
  pathLevelParams: unknown[] = []
): string {
  const lines: string[] = [
    `## ${method.toUpperCase()} ${path}`,
    typeof op.operationId === "string" ? `operationId: ${op.operationId}` : "",
    typeof op.summary === "string" ? op.summary : "",
    typeof op.description === "string" ? op.description : "",
    op.deprecated === true ? "(deprecated)" : "",
  ].filter(Boolean);

  const opParams = (op.parameters as unknown[] | undefined) ?? [];
  const mergedParams = [...pathLevelParams, ...opParams];

  if (mergedParams.length) {
    lines.push("\n### Parameters\n");
    for (const param of mergedParams) {
      const block = formatParam(specRoot, param);
      if (block) lines.push(block, "");
    }
  }

  if (op.tags) lines.push(`\nTags: ${JSON.stringify(op.tags)}`);
  return lines.join("\n");
}

export function openApiJsonToMarkdown(spec: Record<string, unknown>): string {
  const lines: string[] = [];

  const info = spec.info as Record<string, unknown> | undefined;
  if (info) {
    lines.push("# API", "");
    lines.push(`Title: ${String(info.title ?? "")}`);
    lines.push(`Version: ${String(info.version ?? "")}`);
    if (typeof info.summary === "string") lines.push("", info.summary);
    if (typeof info.description === "string") lines.push("", info.description);
    lines.push("");
  }

  const servers = spec.servers as unknown[] | undefined;
  if (servers?.length) {
    lines.push("## Servers", "");
    for (const s of servers) {
      if (s && typeof s === "object" && "url" in s) {
        const u = s as { url: string; description?: string };
        lines.push(`- ${u.url}${u.description ? ` (${u.description})` : ""}`);
      }
    }
    lines.push("");
  }

  const docTags = spec.tags as Array<{ name?: string; description?: string }> | undefined;
  if (docTags?.length) {
    lines.push("## Tag documentation", "");
    for (const t of docTags) {
      if (t?.name) lines.push(`### ${t.name}`, t.description ?? "", "");
    }
  }

  const paths = spec.paths as Record<string, Record<string, unknown>> | undefined;
  if (paths) {
    lines.push("## Operations", "");
    for (const [path, pathItem] of Object.entries(paths)) {
      if (!pathItem || typeof pathItem !== "object") continue;
      const pathLevelParams = (pathItem.parameters as unknown[]) ?? [];
      for (const method of Object.keys(pathItem)) {
        if (method === "parameters" || !HTTP_METHODS.has(method)) continue;
        const operation = pathItem[method] as Record<string, unknown>;
        if (!operation || typeof operation !== "object") continue;
        lines.push(formatOperation(spec, path, method, operation, pathLevelParams), "");
      }
    }
  }

  return lines.join("\n").trim();
}

export function splitTextIntoChunks(
  text: string,
  maxChunkChars = 3500,
  overlapChars = 350
): string[] {
  const t = text.replace(/\r\n/g, "\n").trim();
  if (t.length <= maxChunkChars) return t ? [t] : [];

  const chunks: string[] = [];
  let start = 0;
  while (start < t.length) {
    const end = Math.min(start + maxChunkChars, t.length);
    chunks.push(t.slice(start, end));
    if (end >= t.length) break;
    start = Math.max(0, end - overlapChars);
  }
  return chunks;
}

export function openApiJsonToChunkTexts(
  spec: Record<string, unknown>,
  options?: { maxChunkChars?: number; overlapChars?: number }
): string[] {
  const maxChunkChars = options?.maxChunkChars ?? 3500;
  const overlapChars = options?.overlapChars ?? 350;
  const md = openApiJsonToMarkdown(spec);
  return splitTextIntoChunks(md, maxChunkChars, overlapChars);
}
