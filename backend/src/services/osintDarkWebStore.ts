import type { IsoDateTimeString } from "../contracts/common.js";
import type {
  CreateOsintDarkMarketplaceRequest,
  CreateOsintDarkProductRequest,
  CreateOsintDarkVendorRequest,
  OsintDarkMarketplaceDto,
  OsintDarkProductDto,
  OsintDarkVendorDto,
  OsintDarkWebTreeDto,
  UpdateOsintDarkMarketplaceRequest,
  UpdateOsintDarkProductRequest,
  UpdateOsintDarkVendorRequest,
} from "../contracts/osintDarkWeb.js";
import { getSupabaseAdmin, isSupabaseAnalysesEnabled } from "../lib/supabaseAdmin.js";
import { getCase } from "./caseStore.js";

async function assertCaseWorkspace(caseId: string, workspaceId: string): Promise<void> {
  const trimmed = workspaceId.trim();
  if (!trimmed) throw new Error("workspace_id_required");
  const c = await getCase(caseId);
  if (!c) throw new Error("case_not_found");
  if (c.workspaceId !== trimmed) throw new Error("case_workspace_mismatch");
}

function nowIso(): IsoDateTimeString {
  return new Date().toISOString();
}

// ——— memory ———

type MemMp = {
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

type MemV = {
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

type MemP = {
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

const memMarketplaces = new Map<string, MemMp>();
const memVendors = new Map<string, MemV>();
const memProducts = new Map<string, MemP>();

function toMpDto(r: MemMp): OsintDarkMarketplaceDto {
  return {
    id: r.id,
    caseId: r.caseId,
    label: r.label,
    onionUrl: r.onionUrl,
    faviconHash: r.faviconHash,
    httpHeaders: r.httpHeaders,
    sourceCodeNotes: r.sourceCodeNotes,
    adminEmail: r.adminEmail,
    extra: r.extra,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function toVDto(r: MemV): OsintDarkVendorDto {
  return {
    id: r.id,
    marketplaceId: r.marketplaceId,
    username: r.username,
    joinDate: r.joinDate,
    location: r.location,
    forumPosts: r.forumPosts,
    pgpKeyId: r.pgpKeyId,
    contact: r.contact,
    cryptoWallets: r.cryptoWallets,
    salesCount: r.salesCount,
    reviewsText: r.reviewsText,
    shippingInfo: r.shippingInfo,
    storeDescription: r.storeDescription,
    extra: r.extra,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function toPDto(r: MemP): OsintDarkProductDto {
  return {
    id: r.id,
    vendorId: r.vendorId,
    title: r.title,
    description: r.description,
    photoUrls: r.photoUrls,
    photoMetadata: r.photoMetadata,
    reviewsText: r.reviewsText,
    extra: r.extra,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

async function memListMarketplaces(caseId: string, workspaceId: string): Promise<OsintDarkMarketplaceDto[]> {
  await assertCaseWorkspace(caseId, workspaceId);
  return [...memMarketplaces.values()]
    .filter((m) => m.caseId === caseId)
    .map(toMpDto)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

async function memCreateMarketplace(caseId: string, input: CreateOsintDarkMarketplaceRequest): Promise<OsintDarkMarketplaceDto> {
  await assertCaseWorkspace(caseId, input.workspaceId);
  const ts = nowIso();
  const r: MemMp = {
    id: crypto.randomUUID(),
    caseId,
    label: input.label?.trim() ? input.label.trim() : null,
    onionUrl: input.onionUrl?.trim() ? input.onionUrl.trim() : null,
    faviconHash: input.faviconHash?.trim() ? input.faviconHash.trim() : null,
    httpHeaders: input.httpHeaders ?? {},
    sourceCodeNotes: input.sourceCodeNotes?.trim() ? input.sourceCodeNotes.trim() : null,
    adminEmail: input.adminEmail?.trim() ? input.adminEmail.trim() : null,
    extra: input.extra ?? {},
    createdAt: ts,
    updatedAt: ts,
  };
  memMarketplaces.set(r.id, r);
  return toMpDto(r);
}

function memGetMp(id: string): MemMp {
  const r = memMarketplaces.get(id);
  if (!r) throw new Error("marketplace_not_found");
  return r;
}

async function memUpdateMarketplace(
  caseId: string,
  marketplaceId: string,
  input: UpdateOsintDarkMarketplaceRequest,
): Promise<OsintDarkMarketplaceDto> {
  await assertCaseWorkspace(caseId, input.workspaceId);
  const r = memGetMp(marketplaceId);
  if (r.caseId !== caseId) throw new Error("marketplace_not_found");
  if (input.label !== undefined) r.label = input.label?.trim() ? input.label.trim() : null;
  if (input.onionUrl !== undefined) r.onionUrl = input.onionUrl?.trim() ? input.onionUrl.trim() : null;
  if (input.faviconHash !== undefined) r.faviconHash = input.faviconHash?.trim() ? input.faviconHash.trim() : null;
  if (input.httpHeaders !== undefined) r.httpHeaders = input.httpHeaders;
  if (input.sourceCodeNotes !== undefined) r.sourceCodeNotes = input.sourceCodeNotes?.trim() ? input.sourceCodeNotes.trim() : null;
  if (input.adminEmail !== undefined) r.adminEmail = input.adminEmail?.trim() ? input.adminEmail.trim() : null;
  if (input.extra !== undefined) r.extra = input.extra;
  r.updatedAt = nowIso();
  return toMpDto(r);
}

async function memDeleteMarketplace(caseId: string, marketplaceId: string, workspaceId: string): Promise<void> {
  await assertCaseWorkspace(caseId, workspaceId);
  const r = memGetMp(marketplaceId);
  if (r.caseId !== caseId) throw new Error("marketplace_not_found");
  const vendorIds = [...memVendors.values()].filter((v) => v.marketplaceId === marketplaceId).map((v) => v.id);
  for (const vid of vendorIds) {
    for (const p of [...memProducts.values()].filter((x) => x.vendorId === vid)) {
      memProducts.delete(p.id);
    }
    memVendors.delete(vid);
  }
  memMarketplaces.delete(marketplaceId);
}

async function memListVendors(caseId: string, marketplaceId: string, workspaceId: string): Promise<OsintDarkVendorDto[]> {
  await assertCaseWorkspace(caseId, workspaceId);
  const mp = memGetMp(marketplaceId);
  if (mp.caseId !== caseId) throw new Error("marketplace_not_found");
  return [...memVendors.values()]
    .filter((v) => v.marketplaceId === marketplaceId)
    .map(toVDto)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

async function memCreateVendor(
  caseId: string,
  marketplaceId: string,
  input: CreateOsintDarkVendorRequest,
): Promise<OsintDarkVendorDto> {
  await assertCaseWorkspace(caseId, input.workspaceId);
  const mp = memGetMp(marketplaceId);
  if (mp.caseId !== caseId) throw new Error("marketplace_not_found");
  const ts = nowIso();
  const r: MemV = {
    id: crypto.randomUUID(),
    marketplaceId,
    username: input.username?.trim() ? input.username.trim() : null,
    joinDate: input.joinDate?.trim() ? input.joinDate.trim() : null,
    location: input.location?.trim() ? input.location.trim() : null,
    forumPosts: input.forumPosts ?? null,
    pgpKeyId: input.pgpKeyId?.trim() ? input.pgpKeyId.trim() : null,
    contact: input.contact ?? {},
    cryptoWallets: input.cryptoWallets ?? [],
    salesCount: input.salesCount ?? null,
    reviewsText: input.reviewsText?.trim() ? input.reviewsText.trim() : null,
    shippingInfo: input.shippingInfo?.trim() ? input.shippingInfo.trim() : null,
    storeDescription: input.storeDescription?.trim() ? input.storeDescription.trim() : null,
    extra: input.extra ?? {},
    createdAt: ts,
    updatedAt: ts,
  };
  memVendors.set(r.id, r);
  return toVDto(r);
}

function memGetV(id: string): MemV {
  const r = memVendors.get(id);
  if (!r) throw new Error("vendor_not_found");
  return r;
}

async function memUpdateVendor(caseId: string, vendorId: string, input: UpdateOsintDarkVendorRequest): Promise<OsintDarkVendorDto> {
  await assertCaseWorkspace(caseId, input.workspaceId);
  const r = memGetV(vendorId);
  const mp = memGetMp(r.marketplaceId);
  if (mp.caseId !== caseId) throw new Error("vendor_not_found");
  if (input.username !== undefined) r.username = input.username?.trim() ? input.username.trim() : null;
  if (input.joinDate !== undefined) r.joinDate = input.joinDate?.trim() ? input.joinDate.trim() : null;
  if (input.location !== undefined) r.location = input.location?.trim() ? input.location.trim() : null;
  if (input.forumPosts !== undefined) r.forumPosts = input.forumPosts;
  if (input.pgpKeyId !== undefined) r.pgpKeyId = input.pgpKeyId?.trim() ? input.pgpKeyId.trim() : null;
  if (input.contact !== undefined) r.contact = input.contact;
  if (input.cryptoWallets !== undefined) r.cryptoWallets = input.cryptoWallets;
  if (input.salesCount !== undefined) r.salesCount = input.salesCount;
  if (input.reviewsText !== undefined) r.reviewsText = input.reviewsText?.trim() ? input.reviewsText.trim() : null;
  if (input.shippingInfo !== undefined) r.shippingInfo = input.shippingInfo?.trim() ? input.shippingInfo.trim() : null;
  if (input.storeDescription !== undefined)
    r.storeDescription = input.storeDescription?.trim() ? input.storeDescription.trim() : null;
  if (input.extra !== undefined) r.extra = input.extra;
  r.updatedAt = nowIso();
  return toVDto(r);
}

async function memDeleteVendor(caseId: string, vendorId: string, workspaceId: string): Promise<void> {
  await assertCaseWorkspace(caseId, workspaceId);
  const r = memGetV(vendorId);
  const mp = memGetMp(r.marketplaceId);
  if (mp.caseId !== caseId) throw new Error("vendor_not_found");
  for (const p of [...memProducts.values()].filter((x) => x.vendorId === vendorId)) {
    memProducts.delete(p.id);
  }
  memVendors.delete(vendorId);
}

async function memListProducts(caseId: string, vendorId: string, workspaceId: string): Promise<OsintDarkProductDto[]> {
  await assertCaseWorkspace(caseId, workspaceId);
  const v = memGetV(vendorId);
  const mp = memGetMp(v.marketplaceId);
  if (mp.caseId !== caseId) throw new Error("vendor_not_found");
  return [...memProducts.values()]
    .filter((p) => p.vendorId === vendorId)
    .map(toPDto)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

async function memCreateProduct(caseId: string, vendorId: string, input: CreateOsintDarkProductRequest): Promise<OsintDarkProductDto> {
  await assertCaseWorkspace(caseId, input.workspaceId);
  const v = memGetV(vendorId);
  const mp = memGetMp(v.marketplaceId);
  if (mp.caseId !== caseId) throw new Error("vendor_not_found");
  const ts = nowIso();
  const r: MemP = {
    id: crypto.randomUUID(),
    vendorId,
    title: input.title?.trim() ? input.title.trim() : null,
    description: input.description?.trim() ? input.description.trim() : null,
    photoUrls: input.photoUrls ?? [],
    photoMetadata: input.photoMetadata ?? {},
    reviewsText: input.reviewsText?.trim() ? input.reviewsText.trim() : null,
    extra: input.extra ?? {},
    createdAt: ts,
    updatedAt: ts,
  };
  memProducts.set(r.id, r);
  return toPDto(r);
}

function memGetP(id: string): MemP {
  const r = memProducts.get(id);
  if (!r) throw new Error("product_not_found");
  return r;
}

async function memUpdateProduct(caseId: string, productId: string, input: UpdateOsintDarkProductRequest): Promise<OsintDarkProductDto> {
  await assertCaseWorkspace(caseId, input.workspaceId);
  const r = memGetP(productId);
  const v = memGetV(r.vendorId);
  const mp = memGetMp(v.marketplaceId);
  if (mp.caseId !== caseId) throw new Error("product_not_found");
  if (input.title !== undefined) r.title = input.title?.trim() ? input.title.trim() : null;
  if (input.description !== undefined) r.description = input.description?.trim() ? input.description.trim() : null;
  if (input.photoUrls !== undefined) r.photoUrls = input.photoUrls;
  if (input.photoMetadata !== undefined) r.photoMetadata = input.photoMetadata;
  if (input.reviewsText !== undefined) r.reviewsText = input.reviewsText?.trim() ? input.reviewsText.trim() : null;
  if (input.extra !== undefined) r.extra = input.extra;
  r.updatedAt = nowIso();
  return toPDto(r);
}

async function memDeleteProduct(caseId: string, productId: string, workspaceId: string): Promise<void> {
  await assertCaseWorkspace(caseId, workspaceId);
  const r = memGetP(productId);
  const v = memGetV(r.vendorId);
  const mp = memGetMp(v.marketplaceId);
  if (mp.caseId !== caseId) throw new Error("product_not_found");
  memProducts.delete(productId);
}

async function memGetTree(caseId: string, workspaceId: string): Promise<OsintDarkWebTreeDto> {
  await assertCaseWorkspace(caseId, workspaceId);
  const mps = [...memMarketplaces.values()].filter((m) => m.caseId === caseId);
  const marketplaces: OsintDarkWebTreeDto["marketplaces"] = [];
  for (const mp of mps.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))) {
    const vendors: OsintDarkWebTreeDto["marketplaces"][0]["vendors"] = [];
    const vs = [...memVendors.values()].filter((v) => v.marketplaceId === mp.id);
    for (const v of vs.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))) {
      const products = [...memProducts.values()]
        .filter((p) => p.vendorId === v.id)
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        .map(toPDto);
      vendors.push({ vendor: toVDto(v), products });
    }
    marketplaces.push({ marketplace: toMpDto(mp), vendors });
  }
  return { caseId, marketplaces };
}

// ——— DB ———

type DbMp = {
  id: string;
  case_id: string;
  label: string | null;
  onion_url: string | null;
  favicon_hash: string | null;
  http_headers: Record<string, unknown>;
  source_code_notes: string | null;
  admin_email: string | null;
  extra: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type DbV = {
  id: string;
  marketplace_id: string;
  username: string | null;
  join_date: string | null;
  location: string | null;
  forum_posts: number | null;
  pgp_key_id: string | null;
  contact: Record<string, unknown>;
  crypto_wallets: unknown[];
  sales_count: number | null;
  reviews_text: string | null;
  shipping_info: string | null;
  store_description: string | null;
  extra: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type DbP = {
  id: string;
  vendor_id: string;
  title: string | null;
  description: string | null;
  photo_urls: string[];
  photo_metadata: Record<string, unknown>;
  reviews_text: string | null;
  extra: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

function dbMp(row: DbMp): OsintDarkMarketplaceDto {
  return {
    id: row.id,
    caseId: row.case_id,
    label: row.label,
    onionUrl: row.onion_url,
    faviconHash: row.favicon_hash,
    httpHeaders: row.http_headers ?? {},
    sourceCodeNotes: row.source_code_notes,
    adminEmail: row.admin_email,
    extra: row.extra ?? {},
    createdAt: row.created_at as IsoDateTimeString,
    updatedAt: row.updated_at as IsoDateTimeString,
  };
}

function dbV(row: DbV): OsintDarkVendorDto {
  return {
    id: row.id,
    marketplaceId: row.marketplace_id,
    username: row.username,
    joinDate: row.join_date,
    location: row.location,
    forumPosts: row.forum_posts,
    pgpKeyId: row.pgp_key_id,
    contact: row.contact ?? {},
    cryptoWallets: Array.isArray(row.crypto_wallets) ? row.crypto_wallets : [],
    salesCount: row.sales_count,
    reviewsText: row.reviews_text,
    shippingInfo: row.shipping_info,
    storeDescription: row.store_description,
    extra: row.extra ?? {},
    createdAt: row.created_at as IsoDateTimeString,
    updatedAt: row.updated_at as IsoDateTimeString,
  };
}

function dbP(row: DbP): OsintDarkProductDto {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    title: row.title,
    description: row.description,
    photoUrls: row.photo_urls ?? [],
    photoMetadata: row.photo_metadata ?? {},
    reviewsText: row.reviews_text,
    extra: row.extra ?? {},
    createdAt: row.created_at as IsoDateTimeString,
    updatedAt: row.updated_at as IsoDateTimeString,
  };
}

async function dbListMarketplaces(caseId: string, workspaceId: string): Promise<OsintDarkMarketplaceDto[]> {
  await assertCaseWorkspace(caseId, workspaceId);
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("osint_dark_marketplaces")
    .select("*")
    .eq("case_id", caseId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as DbMp[] | null)?.map(dbMp) ?? [];
}

async function dbCreateMarketplace(caseId: string, input: CreateOsintDarkMarketplaceRequest): Promise<OsintDarkMarketplaceDto> {
  await assertCaseWorkspace(caseId, input.workspaceId);
  const sb = getSupabaseAdmin();
  const payload = {
    case_id: caseId,
    label: input.label?.trim() ? input.label.trim() : null,
    onion_url: input.onionUrl?.trim() ? input.onionUrl.trim() : null,
    favicon_hash: input.faviconHash?.trim() ? input.faviconHash.trim() : null,
    http_headers: input.httpHeaders ?? {},
    source_code_notes: input.sourceCodeNotes?.trim() ? input.sourceCodeNotes.trim() : null,
    admin_email: input.adminEmail?.trim() ? input.adminEmail.trim() : null,
    extra: input.extra ?? {},
  };
  const { data, error } = await sb.from("osint_dark_marketplaces").insert(payload).select("*").single();
  if (error) throw error;
  return dbMp(data as DbMp);
}

async function dbUpdateMarketplace(
  caseId: string,
  marketplaceId: string,
  input: UpdateOsintDarkMarketplaceRequest,
): Promise<OsintDarkMarketplaceDto> {
  await assertCaseWorkspace(caseId, input.workspaceId);
  const sb = getSupabaseAdmin();
  const patch: Record<string, unknown> = { updated_at: nowIso() };
  if (input.label !== undefined) patch.label = input.label?.trim() ? input.label.trim() : null;
  if (input.onionUrl !== undefined) patch.onion_url = input.onionUrl?.trim() ? input.onionUrl.trim() : null;
  if (input.faviconHash !== undefined) patch.favicon_hash = input.faviconHash?.trim() ? input.faviconHash.trim() : null;
  if (input.httpHeaders !== undefined) patch.http_headers = input.httpHeaders;
  if (input.sourceCodeNotes !== undefined) patch.source_code_notes = input.sourceCodeNotes?.trim() ? input.sourceCodeNotes.trim() : null;
  if (input.adminEmail !== undefined) patch.admin_email = input.adminEmail?.trim() ? input.adminEmail.trim() : null;
  if (input.extra !== undefined) patch.extra = input.extra;
  const { data, error } = await sb
    .from("osint_dark_marketplaces")
    .update(patch)
    .eq("id", marketplaceId)
    .eq("case_id", caseId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("marketplace_not_found");
  return dbMp(data as DbMp);
}

async function dbDeleteMarketplace(caseId: string, marketplaceId: string, workspaceId: string): Promise<void> {
  await assertCaseWorkspace(caseId, workspaceId);
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("osint_dark_marketplaces")
    .delete()
    .eq("id", marketplaceId)
    .eq("case_id", caseId)
    .select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("marketplace_not_found");
}

async function dbListVendors(caseId: string, marketplaceId: string, workspaceId: string): Promise<OsintDarkVendorDto[]> {
  await assertCaseWorkspace(caseId, workspaceId);
  const sb = getSupabaseAdmin();
  const { data: mp, error: e1 } = await sb.from("osint_dark_marketplaces").select("id").eq("id", marketplaceId).eq("case_id", caseId).maybeSingle();
  if (e1) throw e1;
  if (!mp) throw new Error("marketplace_not_found");
  const { data, error } = await sb
    .from("osint_dark_vendors")
    .select("*")
    .eq("marketplace_id", marketplaceId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as DbV[] | null)?.map(dbV) ?? [];
}

async function dbCreateVendor(caseId: string, marketplaceId: string, input: CreateOsintDarkVendorRequest): Promise<OsintDarkVendorDto> {
  await assertCaseWorkspace(caseId, input.workspaceId);
  const sb = getSupabaseAdmin();
  const { data: mp, error: e1 } = await sb.from("osint_dark_marketplaces").select("id").eq("id", marketplaceId).eq("case_id", caseId).maybeSingle();
  if (e1) throw e1;
  if (!mp) throw new Error("marketplace_not_found");
  const payload = {
    marketplace_id: marketplaceId,
    username: input.username?.trim() ? input.username.trim() : null,
    join_date: input.joinDate?.trim() ? input.joinDate.trim() : null,
    location: input.location?.trim() ? input.location.trim() : null,
    forum_posts: input.forumPosts ?? null,
    pgp_key_id: input.pgpKeyId?.trim() ? input.pgpKeyId.trim() : null,
    contact: input.contact ?? {},
    crypto_wallets: input.cryptoWallets ?? [],
    sales_count: input.salesCount ?? null,
    reviews_text: input.reviewsText?.trim() ? input.reviewsText.trim() : null,
    shipping_info: input.shippingInfo?.trim() ? input.shippingInfo.trim() : null,
    store_description: input.storeDescription?.trim() ? input.storeDescription.trim() : null,
    extra: input.extra ?? {},
  };
  const { data, error } = await sb.from("osint_dark_vendors").insert(payload).select("*").single();
  if (error) throw error;
  return dbV(data as DbV);
}

async function dbUpdateVendor(caseId: string, vendorId: string, input: UpdateOsintDarkVendorRequest): Promise<OsintDarkVendorDto> {
  await assertCaseWorkspace(caseId, input.workspaceId);
  const sb = getSupabaseAdmin();
  const { data: vrow, error: e0 } = await sb.from("osint_dark_vendors").select("id, marketplace_id").eq("id", vendorId).maybeSingle();
  if (e0) throw e0;
  if (!vrow) throw new Error("vendor_not_found");
  const { data: mprow, error: e1 } = await sb
    .from("osint_dark_marketplaces")
    .select("case_id")
    .eq("id", (vrow as { marketplace_id: string }).marketplace_id)
    .maybeSingle();
  if (e1) throw e1;
  if ((mprow as { case_id: string } | null)?.case_id !== caseId) throw new Error("vendor_not_found");

  const patch: Record<string, unknown> = { updated_at: nowIso() };
  if (input.username !== undefined) patch.username = input.username?.trim() ? input.username.trim() : null;
  if (input.joinDate !== undefined) patch.join_date = input.joinDate?.trim() ? input.joinDate.trim() : null;
  if (input.location !== undefined) patch.location = input.location?.trim() ? input.location.trim() : null;
  if (input.forumPosts !== undefined) patch.forum_posts = input.forumPosts;
  if (input.pgpKeyId !== undefined) patch.pgp_key_id = input.pgpKeyId?.trim() ? input.pgpKeyId.trim() : null;
  if (input.contact !== undefined) patch.contact = input.contact;
  if (input.cryptoWallets !== undefined) patch.crypto_wallets = input.cryptoWallets;
  if (input.salesCount !== undefined) patch.sales_count = input.salesCount;
  if (input.reviewsText !== undefined) patch.reviews_text = input.reviewsText?.trim() ? input.reviewsText.trim() : null;
  if (input.shippingInfo !== undefined) patch.shipping_info = input.shippingInfo?.trim() ? input.shippingInfo.trim() : null;
  if (input.storeDescription !== undefined)
    patch.store_description = input.storeDescription?.trim() ? input.storeDescription.trim() : null;
  if (input.extra !== undefined) patch.extra = input.extra;

  const { data, error } = await sb.from("osint_dark_vendors").update(patch).eq("id", vendorId).select("*").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("vendor_not_found");
  return dbV(data as DbV);
}

async function dbDeleteVendor(caseId: string, vendorId: string, workspaceId: string): Promise<void> {
  await assertCaseWorkspace(caseId, workspaceId);
  const sb = getSupabaseAdmin();
  const { data: vrow, error: e1 } = await sb.from("osint_dark_vendors").select("id, marketplace_id").eq("id", vendorId).maybeSingle();
  if (e1) throw e1;
  if (!vrow) throw new Error("vendor_not_found");
  const { data: mprow, error: e2 } = await sb
    .from("osint_dark_marketplaces")
    .select("case_id")
    .eq("id", (vrow as { marketplace_id: string }).marketplace_id)
    .maybeSingle();
  if (e2) throw e2;
  if ((mprow as { case_id: string } | null)?.case_id !== caseId) throw new Error("vendor_not_found");
  const { error } = await sb.from("osint_dark_vendors").delete().eq("id", vendorId);
  if (error) throw error;
}

async function dbListProducts(caseId: string, vendorId: string, workspaceId: string): Promise<OsintDarkProductDto[]> {
  await assertCaseWorkspace(caseId, workspaceId);
  const sb = getSupabaseAdmin();
  const { data: vrow, error: e1 } = await sb.from("osint_dark_vendors").select("id, marketplace_id").eq("id", vendorId).maybeSingle();
  if (e1) throw e1;
  if (!vrow) throw new Error("vendor_not_found");
  const { data: mprow, error: e2 } = await sb
    .from("osint_dark_marketplaces")
    .select("case_id")
    .eq("id", (vrow as { marketplace_id: string }).marketplace_id)
    .maybeSingle();
  if (e2) throw e2;
  if ((mprow as { case_id: string } | null)?.case_id !== caseId) throw new Error("vendor_not_found");

  const { data, error } = await sb
    .from("osint_dark_products")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as DbP[] | null)?.map(dbP) ?? [];
}

async function dbCreateProduct(caseId: string, vendorId: string, input: CreateOsintDarkProductRequest): Promise<OsintDarkProductDto> {
  await assertCaseWorkspace(caseId, input.workspaceId);
  const sb = getSupabaseAdmin();
  const { data: vrow, error: e1 } = await sb.from("osint_dark_vendors").select("id, marketplace_id").eq("id", vendorId).maybeSingle();
  if (e1) throw e1;
  if (!vrow) throw new Error("vendor_not_found");
  const { data: mprow, error: e2 } = await sb
    .from("osint_dark_marketplaces")
    .select("case_id")
    .eq("id", (vrow as { marketplace_id: string }).marketplace_id)
    .maybeSingle();
  if (e2) throw e2;
  if ((mprow as { case_id: string } | null)?.case_id !== caseId) throw new Error("vendor_not_found");

  const payload = {
    vendor_id: vendorId,
    title: input.title?.trim() ? input.title.trim() : null,
    description: input.description?.trim() ? input.description.trim() : null,
    photo_urls: input.photoUrls ?? [],
    photo_metadata: input.photoMetadata ?? {},
    reviews_text: input.reviewsText?.trim() ? input.reviewsText.trim() : null,
    extra: input.extra ?? {},
  };
  const { data, error } = await sb.from("osint_dark_products").insert(payload).select("*").single();
  if (error) throw error;
  return dbP(data as DbP);
}

async function dbUpdateProduct(caseId: string, productId: string, input: UpdateOsintDarkProductRequest): Promise<OsintDarkProductDto> {
  await assertCaseWorkspace(caseId, input.workspaceId);
  const sb = getSupabaseAdmin();
  const { data: prow, error: e0 } = await sb.from("osint_dark_products").select("id, vendor_id").eq("id", productId).maybeSingle();
  if (e0) throw e0;
  if (!prow) throw new Error("product_not_found");
  const vid = (prow as { vendor_id: string }).vendor_id;
  const { data: vrow, error: e1 } = await sb.from("osint_dark_vendors").select("marketplace_id").eq("id", vid).maybeSingle();
  if (e1) throw e1;
  if (!vrow) throw new Error("product_not_found");
  const { data: mprow, error: e2 } = await sb
    .from("osint_dark_marketplaces")
    .select("case_id")
    .eq("id", (vrow as { marketplace_id: string }).marketplace_id)
    .maybeSingle();
  if (e2) throw e2;
  if ((mprow as { case_id: string } | null)?.case_id !== caseId) throw new Error("product_not_found");

  const patch: Record<string, unknown> = { updated_at: nowIso() };
  if (input.title !== undefined) patch.title = input.title?.trim() ? input.title.trim() : null;
  if (input.description !== undefined) patch.description = input.description?.trim() ? input.description.trim() : null;
  if (input.photoUrls !== undefined) patch.photo_urls = input.photoUrls;
  if (input.photoMetadata !== undefined) patch.photo_metadata = input.photoMetadata;
  if (input.reviewsText !== undefined) patch.reviews_text = input.reviewsText?.trim() ? input.reviewsText.trim() : null;
  if (input.extra !== undefined) patch.extra = input.extra;
  const { data, error } = await sb.from("osint_dark_products").update(patch).eq("id", productId).select("*").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("product_not_found");
  return dbP(data as DbP);
}

async function dbDeleteProduct(caseId: string, productId: string, workspaceId: string): Promise<void> {
  await assertCaseWorkspace(caseId, workspaceId);
  const sb = getSupabaseAdmin();
  const { data: prow, error: e0 } = await sb.from("osint_dark_products").select("id, vendor_id").eq("id", productId).maybeSingle();
  if (e0) throw e0;
  if (!prow) throw new Error("product_not_found");
  const vid = (prow as { vendor_id: string }).vendor_id;
  const { data: vrow, error: e1 } = await sb.from("osint_dark_vendors").select("marketplace_id").eq("id", vid).maybeSingle();
  if (e1) throw e1;
  if (!vrow) throw new Error("product_not_found");
  const { data: mprow, error: e2 } = await sb
    .from("osint_dark_marketplaces")
    .select("case_id")
    .eq("id", (vrow as { marketplace_id: string }).marketplace_id)
    .maybeSingle();
  if (e2) throw e2;
  if ((mprow as { case_id: string } | null)?.case_id !== caseId) throw new Error("product_not_found");
  const { error } = await sb.from("osint_dark_products").delete().eq("id", productId);
  if (error) throw error;
}

async function dbGetTree(caseId: string, workspaceId: string): Promise<OsintDarkWebTreeDto> {
  const mps = await dbListMarketplaces(caseId, workspaceId);
  const marketplaces: OsintDarkWebTreeDto["marketplaces"] = [];
  for (const mp of mps) {
    const vendorsRaw = await dbListVendors(caseId, mp.id, workspaceId);
    const vendors: OsintDarkWebTreeDto["marketplaces"][0]["vendors"] = [];
    for (const v of vendorsRaw) {
      const products = await dbListProducts(caseId, v.id, workspaceId);
      vendors.push({ vendor: v, products });
    }
    marketplaces.push({ marketplace: mp, vendors });
  }
  return { caseId, marketplaces };
}

export async function getOsintDarkWebTree(caseId: string, workspaceId: string): Promise<OsintDarkWebTreeDto> {
  if (!isSupabaseAnalysesEnabled()) return memGetTree(caseId, workspaceId);
  return dbGetTree(caseId, workspaceId);
}

export async function listOsintDarkMarketplaces(caseId: string, workspaceId: string): Promise<OsintDarkMarketplaceDto[]> {
  if (!isSupabaseAnalysesEnabled()) return memListMarketplaces(caseId, workspaceId);
  return dbListMarketplaces(caseId, workspaceId);
}

export async function createOsintDarkMarketplace(
  caseId: string,
  input: CreateOsintDarkMarketplaceRequest,
): Promise<OsintDarkMarketplaceDto> {
  if (!isSupabaseAnalysesEnabled()) return memCreateMarketplace(caseId, input);
  return dbCreateMarketplace(caseId, input);
}

export async function updateOsintDarkMarketplace(
  caseId: string,
  marketplaceId: string,
  input: UpdateOsintDarkMarketplaceRequest,
): Promise<OsintDarkMarketplaceDto> {
  if (!isSupabaseAnalysesEnabled()) return memUpdateMarketplace(caseId, marketplaceId, input);
  return dbUpdateMarketplace(caseId, marketplaceId, input);
}

export async function deleteOsintDarkMarketplace(caseId: string, marketplaceId: string, workspaceId: string): Promise<void> {
  if (!isSupabaseAnalysesEnabled()) return memDeleteMarketplace(caseId, marketplaceId, workspaceId);
  return dbDeleteMarketplace(caseId, marketplaceId, workspaceId);
}

export async function listOsintDarkVendors(
  caseId: string,
  marketplaceId: string,
  workspaceId: string,
): Promise<OsintDarkVendorDto[]> {
  if (!isSupabaseAnalysesEnabled()) return memListVendors(caseId, marketplaceId, workspaceId);
  return dbListVendors(caseId, marketplaceId, workspaceId);
}

export async function createOsintDarkVendor(
  caseId: string,
  marketplaceId: string,
  input: CreateOsintDarkVendorRequest,
): Promise<OsintDarkVendorDto> {
  if (!isSupabaseAnalysesEnabled()) return memCreateVendor(caseId, marketplaceId, input);
  return dbCreateVendor(caseId, marketplaceId, input);
}

export async function updateOsintDarkVendor(
  caseId: string,
  vendorId: string,
  input: UpdateOsintDarkVendorRequest,
): Promise<OsintDarkVendorDto> {
  if (!isSupabaseAnalysesEnabled()) return memUpdateVendor(caseId, vendorId, input);
  return dbUpdateVendor(caseId, vendorId, input);
}

export async function deleteOsintDarkVendor(caseId: string, vendorId: string, workspaceId: string): Promise<void> {
  if (!isSupabaseAnalysesEnabled()) return memDeleteVendor(caseId, vendorId, workspaceId);
  return dbDeleteVendor(caseId, vendorId, workspaceId);
}

export async function listOsintDarkProducts(caseId: string, vendorId: string, workspaceId: string): Promise<OsintDarkProductDto[]> {
  if (!isSupabaseAnalysesEnabled()) return memListProducts(caseId, vendorId, workspaceId);
  return dbListProducts(caseId, vendorId, workspaceId);
}

export async function createOsintDarkProduct(
  caseId: string,
  vendorId: string,
  input: CreateOsintDarkProductRequest,
): Promise<OsintDarkProductDto> {
  if (!isSupabaseAnalysesEnabled()) return memCreateProduct(caseId, vendorId, input);
  return dbCreateProduct(caseId, vendorId, input);
}

export async function updateOsintDarkProduct(
  caseId: string,
  productId: string,
  input: UpdateOsintDarkProductRequest,
): Promise<OsintDarkProductDto> {
  if (!isSupabaseAnalysesEnabled()) return memUpdateProduct(caseId, productId, input);
  return dbUpdateProduct(caseId, productId, input);
}

export async function deleteOsintDarkProduct(caseId: string, productId: string, workspaceId: string): Promise<void> {
  if (!isSupabaseAnalysesEnabled()) return memDeleteProduct(caseId, productId, workspaceId);
  return dbDeleteProduct(caseId, productId, workspaceId);
}
