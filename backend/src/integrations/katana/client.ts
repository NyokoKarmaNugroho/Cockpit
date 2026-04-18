import { randomBytes } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

export type KatanaRunInput = {
  url: string;
  depth?: number;
  /** Max JSONL lines to return (truncates after parsing). */
  maxOutputLines?: number;
  rateLimitPerSecond?: number;
  timeoutSeconds?: number;
  concurrency?: number;
};

export type KatanaRunResult =
  | {
      ok: true;
      entries: unknown[];
      truncated: boolean;
      totalLines: number;
      stderr: string;
    }
  | { ok: false; error: string };

function isKatanaEnabled(): boolean {
  const v = process.env.KATANA_ENABLED?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

function katanaBin(): string {
  return process.env.KATANA_BIN?.trim() || "katana";
}

function maxLines(): number {
  const n = Number(process.env.KATANA_MAX_OUTPUT_LINES);
  if (Number.isFinite(n) && n > 0) return Math.min(Math.floor(n), 10_000);
  return 500;
}

/**
 * Normalize and validate an http(s) URL for CLI passing (no shell interpolation).
 */
export function assertPublicHttpUrl(url: string): string {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    throw new Error("Invalid URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }
  if (u.username || u.password) {
    throw new Error("URLs with embedded credentials are not allowed");
  }
  return u.toString();
}

function spawnKatana(
  args: string[],
  timeoutMs: number,
): Promise<{ code: number | null; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(katanaBin(), args, {
      stdio: ["ignore", "ignore", "pipe"],
      env: { ...process.env },
    });
    let stderr = "";
    const t = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`Katana timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (err) => {
      clearTimeout(t);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(t);
      resolve({ code, stderr });
    });
  });
}

/**
 * Run ProjectDiscovery Katana against a single seed URL and return parsed JSONL rows.
 * Requires the `katana` binary on PATH or `KATANA_BIN`. Set `KATANA_ENABLED=false` to disable.
 */
export async function runKatana(input: KatanaRunInput): Promise<KatanaRunResult> {
  if (!isKatanaEnabled()) {
    return {
      ok: false,
      error:
        "Katana is disabled. Set KATANA_ENABLED=true on the backend and install the CLI: go install github.com/projectdiscovery/katana/cmd/katana@latest",
    };
  }

  const url = assertPublicHttpUrl(input.url);
  const depth = Math.min(Math.max(input.depth ?? 2, 1), 5);
  const rateLimit = Math.min(Math.max(input.rateLimitPerSecond ?? 10, 1), 150);
  const timeoutSec = Math.min(Math.max(input.timeoutSeconds ?? 45, 5), 300);
  const concurrency = Math.min(Math.max(input.concurrency ?? 5, 1), 50);
  const cap = Math.min(input.maxOutputLines ?? maxLines(), 10_000);

  const outPath = join(tmpdir(), `katana-${randomBytes(12).toString("hex")}.jsonl`);

  const args = [
    "-u",
    url,
    "-d",
    String(depth),
    "-jsonl",
    "-silent",
    "-nc",
    "-duc",
    "-rl",
    String(rateLimit),
    "-timeout",
    String(timeoutSec),
    "-c",
    String(concurrency),
    "-o",
    outPath,
  ];

  const timeoutMs = (timeoutSec + 15) * 1000;

  try {
    const { code, stderr } = await spawnKatana(args, timeoutMs);
    let raw: string;
    try {
      raw = await readFile(outPath, "utf8");
    } catch (readErr) {
      const hint = readErr instanceof Error ? readErr.message : String(readErr);
      if (code !== 0 && code !== null) {
        return {
          ok: false,
          error: `Katana exited with code ${code}. Could not read output file (${hint}). ${stderr.trim() || ""}`,
        };
      }
      return { ok: false, error: `Katana produced no readable output: ${hint}` };
    }
    const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
    const totalLines = lines.length;
    const slice = lines.slice(0, cap);
    const entries: unknown[] = [];
    for (const line of slice) {
      try {
        entries.push(JSON.parse(line) as unknown);
      } catch {
        entries.push(line);
      }
    }
    const truncated = totalLines > slice.length;
    if (code !== 0 && code !== null) {
      return {
        ok: false,
        error: `Katana exited with code ${code}. ${stderr.trim() || "stderr empty"}`,
      };
    }
    return { ok: true, entries, truncated, totalLines, stderr: stderr.trim() };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        ok: false,
        error: `Katana binary not found (${katanaBin()}). Set KATANA_BIN or install Katana: https://github.com/projectdiscovery/katana`,
      };
    }
    return { ok: false, error: msg };
  } finally {
    try {
      await unlink(outPath);
    } catch {
      // ignore
    }
  }
}
