> **Scope:** Reference for a **server-side** Chainalysis integration. This repo ships the **marketing frontend** only (`frontend/`). Implement the API client in your **API service** (not in the Vite bundle); paths below are illustrative.

# Chainalysis public Sanctions API (Cockpit)

## Where the full write-up lives

- **Official product / signup / current spec:** [public.chainalysis.com](https://public.chainalysis.com) (Sanctions API signup and documentation)  
- Keep a **local markdown note** in your API project (e.g. `docs/Chainalysis.md`) with endpoint details and terms if you need offline reference—do not commit API keys.

## How to call it (server-side)

The API does **not** support browser CORS; keys must stay on the server.

- **Env:** `CHAINALYSIS_API_KEY` in your API service environment (e.g. `.env`, gitignored).
- Implement a small helper module (e.g. `integrations/chainalysis/sanctionsApi.ts`) that wraps `GET https://public.chainalysis.com/api/v1/address/{address}` per Chainalysis docs.

Example:

```ts
import { checkChainalysisSanctionsAddress } from "./integrations/chainalysis/sanctionsApi.js";

const { identifications } = await checkChainalysisSanctionsAddress("0x...");
// Empty array => no sanctions listing returned for that address in this API response.
```

## Scope reminder

The public API is an **information** tool (SDN-linked crypto addresses per Chainalysis). It is **not** a substitute for legal advice, your own sanctions policy, or official OFAC / jurisdiction-specific determinations. Paid Chainalysis products may expose additional categories and clustering beyond this public API.

## Related reading (not Chainalysis)

Broader investigation context (Arkham research, public pages):

- [A Guide to Crypto Crime](https://info.arkm.com/research/a-guide-to-crypto-crime)
- [Online Sleuth: How to Be a Blockchain and Crypto Investigator](https://info.arkm.com/research/online-sleuth-how-to-be-a-blockchain-and-crypto-investigator)

Support (from vendor docs): `sanctions-api-support@chainalysis.com`
