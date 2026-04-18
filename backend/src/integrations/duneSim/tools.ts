import { DynamicStructuredTool } from "langchain";
import { z } from "zod";
import { simGet } from "./client.js";

/** Tools backed by Dune Sim — use from worker graphs and optionally the supervisor. */
export function createDuneSimTools(): DynamicStructuredTool[] {
  const evmActivity = new DynamicStructuredTool({
    name: "dune_sim_evm_activity",
    description:
      "Fetch recent EVM on-chain activity for an address (transfers, swaps, decoded calls). Newest first. Use chain_ids as comma-separated numeric chain IDs (e.g. 1,8453,42161).",
    schema: z.object({
      address: z.string().describe("EVM address 0x…"),
      chain_ids: z
        .string()
        .optional()
        .describe("Optional comma-separated chain IDs, e.g. 1,8453"),
      limit: z.number().int().min(1).max(100).optional().describe("Max rows (default 20, max 100)"),
      offset: z.string().optional().describe("Pagination cursor from previous response"),
    }),
    func: async ({ address, chain_ids, limit, offset }) => {
      const path = `/v1/evm/activity/${encodeURIComponent(address)}`;
      const json = await simGet(path, {
        chain_ids,
        limit,
        offset,
      });
      return JSON.stringify(json);
    },
  });

  const evmBalances = new DynamicStructuredTool({
    name: "dune_sim_evm_balances",
    description:
      "Fetch realtime EVM token balances for a wallet across chains. Use chain_ids as comma-separated numeric IDs.",
    schema: z.object({
      address: z.string().describe("EVM address 0x…"),
      chain_ids: z
        .string()
        .optional()
        .describe("Comma-separated chain IDs; omit for default tagged chains"),
      offset: z.string().optional().describe("Pagination cursor"),
    }),
    func: async ({ address, chain_ids, offset }) => {
      const path = `/v1/evm/balances/${encodeURIComponent(address)}`;
      const json = await simGet(path, { chain_ids, offset });
      return JSON.stringify(json);
    },
  });

  const svmBalances = new DynamicStructuredTool({
    name: "dune_sim_svm_balances",
    description:
      "Fetch Solana/Eclipse SPL balances for an SVM address. chains: solana, eclipse, or all.",
    schema: z.object({
      address: z.string().describe("Solana base58 address"),
      chains: z.string().optional().describe("solana, eclipse, or all"),
      limit: z.number().int().optional(),
      offset: z.string().optional(),
    }),
    func: async ({ address, chains, limit, offset }) => {
      const path = `/beta/svm/balances/${encodeURIComponent(address)}`;
      const json = await simGet(path, {
        chains,
        limit,
        offset,
      });
      return JSON.stringify(json);
    },
  });

  const svmTransactions = new DynamicStructuredTool({
    name: "dune_sim_svm_transactions",
    description: "Fetch recent Solana transactions for an address (newest first).",
    schema: z.object({
      address: z.string().describe("Solana base58 address"),
      limit: z.number().int().min(1).max(1000).optional(),
      offset: z.string().optional(),
    }),
    func: async ({ address, limit, offset }) => {
      const path = `/beta/svm/transactions/${encodeURIComponent(address)}`;
      const json = await simGet(path, { limit, offset });
      return JSON.stringify(json);
    },
  });

  return [evmActivity, evmBalances, svmBalances, svmTransactions];
}
