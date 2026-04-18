import { tool } from "langchain";
import { z } from "zod";

/**
 * Six-step intelligence cycle for the OSINT coordinator and sub-agents.
 * Aligns supervisor delegation and worker outputs with collection-to-feedback discipline.
 */

export const OSINT_COORDINATOR_LIFECYCLE_STEPS = [
  {
    step: 1,
    name: "Planning and Direction",
    summary:
      "Define intelligence requirements, goals, and scope so collection and analysis stay targeted and lawful.",
  },
  {
    step: 2,
    name: "Collection",
    summary:
      "Gather raw data from diverse public sources (social media, web, public records, dark web where policy allows).",
  },
  {
    step: 3,
    name: "Processing and Exploitation",
    summary:
      "Organize, translate, and clean raw data into structured, usable form for analysis.",
  },
  {
    step: 4,
    name: "Analysis and Production",
    summary:
      "Connect facts, identify patterns, and turn processed information into intelligence with clear confidence and limitations.",
  },
  {
    step: 5,
    name: "Dissemination",
    summary:
      "Deliver the intelligence product to stakeholders in a form suited to decisions and audit needs.",
  },
  {
    step: 6,
    name: "Feedback",
    summary:
      "Review with stakeholders to refine requirements and improve the next cycle.",
  },
] as const;

/** Block for system prompts (supervisor + workers). */
export const OSINT_COORDINATOR_LIFECYCLE_PROMPT = `## OSINT coordinator lifecycle (use implicitly on every investigation)
1. **Planning and Direction** — Define intelligence requirements, goals, and scope; keep efforts targeted and authorized.
2. **Collection** — Gather raw data from appropriate public sources (including tools available to you where permitted).
3. **Processing and Exploitation** — Structure, clean, and normalize raw inputs for analysis.
4. **Analysis and Production** — Link findings, state patterns and confidence, separate facts from inference.
5. **Dissemination** — Present results clearly for stakeholders (executive summary, evidence trail, limitations).
6. **Feedback** — Note what to refine next run (gaps, new questions, scope changes).`;

export function createOsintLifecycleTools() {
  const osintCoordinatorLifecycle = tool(
    async () => ({
      steps: OSINT_COORDINATOR_LIFECYCLE_STEPS,
      prompt_fragment: OSINT_COORDINATOR_LIFECYCLE_PROMPT,
      note: "Sub-agents should map their work to these phases; the supervisor should align delegation and final outputs with dissemination and feedback.",
    }),
    {
      name: "osint_coordinator_lifecycle",
      description:
        "Returns the six-step OSINT coordinator lifecycle: Planning and Direction, Collection, Processing and Exploitation, Analysis and Production, Dissemination, Feedback. Use to structure tasks, reports, and handoffs between Cockpit supervisor and specialist sub-agents. Static reference; no network call.",
      schema: z.object({}),
    },
  );

  return [osintCoordinatorLifecycle] as const;
}
