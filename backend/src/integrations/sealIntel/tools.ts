import { tool } from "langchain";
import { z } from "zod";
import {
  getSealWebContentClient,
  isSealIntelWriteEnabled,
  parseWebContent,
  type ObservableType,
} from "./client.js";

const SEAL_NOTE =
  "SEAL Intel (Security Alliance OpenCTI): consults block/trust labels and indicators for domain, URL, or IP observables. Requires SEAL_INTEL_OPENCTI_HOST, SEAL_INTEL_API_KEY, SEAL_INTEL_IDENTITY_ID. Write actions need SEAL_INTEL_WRITE_ENABLED=true — use only with authorization.";

const observableSchema = z.object({
  observable_type: z
    .enum(["domain-name", "url", "ipv4-addr", "ipv6-addr"])
    .describe("STIX cyber-observable type for the value"),
  value: z
    .string()
    .min(1)
    .max(2048)
    .describe("Domain (e.g. example.com), full http(s) URL, or IPv4/IPv6 address"),
});

async function runWithContent<T>(
  observableType: ObservableType,
  value: string,
  fn: (content: ReturnType<typeof parseWebContent>) => Promise<T>,
): Promise<T> {
  const content = parseWebContent(observableType, value);
  return fn(content);
}

export function createSealIntelTools() {
  const sealIntelWebContentStatus = tool(
    async (input: z.infer<typeof observableSchema>) => {
      return await runWithContent(
        input.observable_type as ObservableType,
        input.value,
        (content) => getSealWebContentClient().getWebContentStatus(content),
      );
    },
    {
      name: "seal_intel_web_content_status",
      description: `${SEAL_NOTE} Read-only: returns status unknown | blocked | trusted and optional actor metadata from SEAL/OpenCTI.`,
      schema: observableSchema,
    },
  );

  const sealIntelBlockWebContent = tool(
    async (input: z.infer<typeof observableSchema>) => {
      if (!isSealIntelWriteEnabled()) {
        throw new Error("SEAL Intel write blocked: set SEAL_INTEL_WRITE_ENABLED=true (authorized use only)");
      }
      return await runWithContent(
        input.observable_type as ObservableType,
        input.value,
        (content) => getSealWebContentClient().blockWebContent(content),
      );
    },
    {
      name: "seal_intel_block_web_content",
      description: `${SEAL_NOTE} Writes: mark observable as blocklisted / indicator in OpenCTI. Authorized workflows only.`,
      schema: observableSchema,
    },
  );

  const sealIntelUnblockWebContent = tool(
    async (input: z.infer<typeof observableSchema>) => {
      if (!isSealIntelWriteEnabled()) {
        throw new Error("SEAL Intel write blocked: set SEAL_INTEL_WRITE_ENABLED=true (authorized use only)");
      }
      return await runWithContent(
        input.observable_type as ObservableType,
        input.value,
        (content) => getSealWebContentClient().unblockWebContent(content),
      );
    },
    {
      name: "seal_intel_unblock_web_content",
      description: `${SEAL_NOTE} Writes: revoke block indicator / update labels. Authorized workflows only.`,
      schema: observableSchema,
    },
  );

  const sealIntelTrustWebContent = tool(
    async (input: z.infer<typeof observableSchema>) => {
      if (!isSealIntelWriteEnabled()) {
        throw new Error("SEAL Intel write blocked: set SEAL_INTEL_WRITE_ENABLED=true (authorized use only)");
      }
      return await runWithContent(
        input.observable_type as ObservableType,
        input.value,
        (content) => getSealWebContentClient().trustWebContent(content),
      );
    },
    {
      name: "seal_intel_trust_web_content",
      description: `${SEAL_NOTE} Writes: mark web content as trusted in OpenCTI. Authorized workflows only.`,
      schema: observableSchema,
    },
  );

  const sealIntelUntrustWebContent = tool(
    async (input: z.infer<typeof observableSchema>) => {
      if (!isSealIntelWriteEnabled()) {
        throw new Error("SEAL Intel write blocked: set SEAL_INTEL_WRITE_ENABLED=true (authorized use only)");
      }
      return await runWithContent(
        input.observable_type as ObservableType,
        input.value,
        (content) => getSealWebContentClient().untrustWebContent(content),
      );
    },
    {
      name: "seal_intel_untrust_web_content",
      description: `${SEAL_NOTE} Writes: remove trusted label from observable. Authorized workflows only.`,
      schema: observableSchema,
    },
  );

  const readOnly = [sealIntelWebContentStatus] as const;
  if (!isSealIntelWriteEnabled()) {
    return [...readOnly];
  }
  return [
    ...readOnly,
    sealIntelBlockWebContent,
    sealIntelUnblockWebContent,
    sealIntelTrustWebContent,
    sealIntelUntrustWebContent,
  ] as const;
}
