/**
 * Reverse-proxy to Jupiter Ultra — browser calls BFF, BFF adds `x-api-key`.
 * Path must match frontend `fetchUltraOrderViaProxy` (e.g. `/ultra/v1/order?...`).
 */

export type JupiterOrderJson = Record<string, unknown>;
