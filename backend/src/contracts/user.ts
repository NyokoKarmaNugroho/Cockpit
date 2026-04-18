import type { IsoDateTimeString } from "./common.js";

/** GET /me */
export type UserDto = {
  id: string;
  /** Primary Solana address used at signup/auth */
  primaryWalletAddress: string;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};
