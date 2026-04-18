import { HumanMessage } from "@langchain/core/messages";
import type { DeepAgent } from "deepagents";
import type { AnalysisStreamEvent } from "../contracts/analyses.js";
import type { IsoDateTimeString } from "../contracts/common.js";

function nowIso(): IsoDateTimeString {
  return new Date().toISOString();
}

function chunkText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (
          part &&
          typeof part === "object" &&
          "type" in part &&
          (part as { type: string }).type === "text" &&
          "text" in part
        ) {
          return String((part as { text: string }).text);
        }
        return "";
      })
      .join("");
  }
  return "";
}

export type RunAnalysisParams = {
  analysisId: string;
  prompt: string;
  /** Emit contract-shaped SSE events (status, token, error, done). */
  emit: (event: AnalysisStreamEvent) => void;
};

let supervisorGraphPromise: Promise<DeepAgent> | null = null;

async function getCockpitSupervisorGraph(): Promise<DeepAgent> {
  if (!supervisorGraphPromise) {
    supervisorGraphPromise = import("../langgraph/cockpitSupervisor.js").then((m) => m.graph);
  }
  return supervisorGraphPromise;
}

/**
 * Streams model tokens into `emit`; ends with `done` on success or `error` + failed status on failure.
 */
export async function runAnalysis(params: RunAnalysisParams): Promise<string> {
  const { analysisId, prompt, emit } = params;

  let full = "";
  try {
    // Deep Agent graph (Cockpit supervisor): supports tools + async subagents.
    // `createDeepAgent()` returns a LangGraph-compatible runnable with `.stream()` / `.invoke()`.
    const cockpitSupervisorGraph = await getCockpitSupervisorGraph();
    const stream = await cockpitSupervisorGraph.stream({
      messages: [new HumanMessage(prompt)],
    });

    for await (const chunk of stream) {
      // The underlying stream yields message chunks; normalize to text deltas for SSE.
      const delta =
        chunk && typeof chunk === "object" && "content" in chunk
          ? chunkText((chunk as { content?: unknown }).content)
          : chunkText(chunk);
      if (delta) {
        full += delta;
        emit({ type: "token", delta });
      }
    }
    emit({ type: "status", status: "completed", at: nowIso() });
    emit({ type: "done", analysisId });
    return full;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emit({ type: "error", message });
    emit({ type: "status", status: "failed", at: nowIso() });
    emit({ type: "done", analysisId });
    throw err;
  }
}
