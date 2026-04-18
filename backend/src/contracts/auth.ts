import type { IsoDateTimeString } from "./common.js";
import type { UserDto } from "./user.js";

/** POST /auth/challenge */
export type AuthChallengeRequest = {
  /** Solana base58 address from the connected wallet */
  address: string;
};

export type AuthChallengeResponse = {
  /** Opaque id to send back with the signed payload */
  challengeId: string;
  /** Message or nonce the wallet must sign (SIWS-style or custom) */
  message: string;
  expiresAt: IsoDateTimeString;
};

/** POST /auth/verify */
export type AuthVerifyRequest = {
  challengeId: string;
  address: string;
  /** Base64 or hex signature — format agreed with client */
  signature: string;
};

export type AuthVerifyResponse = {
  user: UserDto;
  /** HttpOnly cookie set by server is preferred; this is optional for SPA */
  accessToken?: string;
  tokenExpiresAt?: IsoDateTimeString;
};

/** POST /auth/logout — body optional if using cookies only */
export type AuthLogoutRequest = Record<string, never>;

export type AuthLogoutResponse = {
  ok: true;
};

/** JWT/session claims — internal or for client decode if using JWT */
export type SessionClaims = {
  sub: string;
  /** user id */
  userId: string;
  walletAddress: string;
  iat?: number;
  exp?: number;
};
