/**
 * Loads the Find Case Law OpenAPI spec from `backend/dataset/`, chunks, embeds, and writes to Supabase.
 *
 * Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 * Loads `backend/.env` explicitly (same file no matter which directory you run from).
 */
import { config as loadEnv } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, "..");
loadEnv({ path: join(backendRoot, ".env") });

import { ingestFindCaseLawRag } from "../src/rag/ingestFindCaseLawRag.js";

async function main() {
  const { sourceId, chunkCount } = await ingestFindCaseLawRag();
  console.log(`Ingested Find Case Law RAG: source_id=${sourceId}, chunks=${chunkCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
