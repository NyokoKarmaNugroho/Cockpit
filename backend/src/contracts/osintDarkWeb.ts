import type { IsoDateTimeString } from "./common.js";

/** Marketplace-level indicators (onion URL, headers, favicon hash, etc.). */
export type OsintDarkMarketplaceDto = {
  id: string;
  caseId: string;
  label: string | null;
  onionUrl: string | null;
  faviconHash: string | null;
  httpHeaders: Record<string, unknown>;
  sourceCodeNotes: string | null;
  adminEmail: string | null;
  extra: Record<string, unknown>;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type CreateOsintDarkMarketplaceRequest = {
  workspaceId: string;
  label?: string | null;
  onionUrl?: string | null;
  faviconHash?: string | null;
  httpHeaders?: Record<string, unknown>;
  sourceCodeNotes?: string | null;
  adminEmail?: string | null;
  extra?: Record<string, unknown>;
};

export type UpdateOsintDarkMarketplaceRequest = {
  workspaceId: string;
  label?: string | null;
  onionUrl?: string | null;
  faviconHash?: string | null;
  httpHeaders?: Record<string, unknown>;
  sourceCodeNotes?: string | null;
  adminEmail?: string | null;
  extra?: Record<string, unknown>;
};

export type OsintDarkVendorDto = {
  id: string;
  marketplaceId: string;
  username: string | null;
  joinDate: string | null;
  location: string | null;
  forumPosts: number | null;
  pgpKeyId: string | null;
  contact: Record<string, unknown>;
  cryptoWallets: unknown[];
  salesCount: number | null;
  reviewsText: string | null;
  shippingInfo: string | null;
  storeDescription: string | null;
  extra: Record<string, unknown>;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type CreateOsintDarkVendorRequest = {
  workspaceId: string;
  username?: string | null;
  joinDate?: string | null;
  location?: string | null;
  forumPosts?: number | null;
  pgpKeyId?: string | null;
  contact?: Record<string, unknown>;
  cryptoWallets?: unknown[];
  salesCount?: number | null;
  reviewsText?: string | null;
  shippingInfo?: string | null;
  storeDescription?: string | null;
  extra?: Record<string, unknown>;
};

export type UpdateOsintDarkVendorRequest = {
  workspaceId: string;
  username?: string | null;
  joinDate?: string | null;
  location?: string | null;
  forumPosts?: number | null;
  pgpKeyId?: string | null;
  contact?: Record<string, unknown>;
  cryptoWallets?: unknown[];
  salesCount?: number | null;
  reviewsText?: string | null;
  shippingInfo?: string | null;
  storeDescription?: string | null;
  extra?: Record<string, unknown>;
};

export type OsintDarkProductDto = {
  id: string;
  vendorId: string;
  title: string | null;
  description: string | null;
  photoUrls: string[];
  photoMetadata: Record<string, unknown>;
  reviewsText: string | null;
  extra: Record<string, unknown>;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type CreateOsintDarkProductRequest = {
  workspaceId: string;
  title?: string | null;
  description?: string | null;
  photoUrls?: string[];
  photoMetadata?: Record<string, unknown>;
  reviewsText?: string | null;
  extra?: Record<string, unknown>;
};

export type UpdateOsintDarkProductRequest = {
  workspaceId: string;
  title?: string | null;
  description?: string | null;
  photoUrls?: string[];
  photoMetadata?: Record<string, unknown>;
  reviewsText?: string | null;
  extra?: Record<string, unknown>;
};

/** Nested tree for one case (marketplaces → vendors → products). */
export type OsintDarkWebTreeDto = {
  caseId: string;
  marketplaces: Array<{
    marketplace: OsintDarkMarketplaceDto;
    vendors: Array<{ vendor: OsintDarkVendorDto; products: OsintDarkProductDto[] }>;
  }>;
};
