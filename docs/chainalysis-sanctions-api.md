# Chainalysis public Sanctions API (Cockpit)

## Where the full write-up lives

- **Long-form reference** (introduction, definitions, endpoint, terms): [`backend/dataset/Chainalysis.md`](../backend/dataset/Chainalysis.md)
- **Official product / signup / current spec**: [public.chainalysis.com](https://public.chainalysis.com) (Sanctions API signup and documentation)

## How Cockpit calls it

Use the **backend** helper only. The API does **not** support browser CORS; keys must stay on the server.

- Module: [`backend/src/integrations/chainalysis/sanctionsApi.ts`](../backend/src/integrations/chainalysis/sanctionsApi.ts)
- Env: `CHAINALYSIS_API_KEY` in `backend/.env` (see `backend/.env.example`)

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
