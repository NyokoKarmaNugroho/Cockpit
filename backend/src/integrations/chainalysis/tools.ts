import { tool } from "langchain";
import { z } from "zod";
import { checkChainalysisSanctionsAddress } from "./sanctionsApi.js";

export function createChainalysisTools() {
  const chainalysisSanctionsCheck = tool(
    async (input: { address: string }) => {
      return await checkChainalysisSanctionsAddress(input.address);
    },
    {
      name: "chainalysis_sanctions_check",
      description:
        "Check a blockchain address against Chainalysis' public Sanctions API. Returns identifications (empty when no match). Not a legal determination.",
      schema: z.object({
        address: z.string().describe("Address to screen (format depends on chain)"),
      }),
    },
  );

  return [chainalysisSanctionsCheck] as const;
}

