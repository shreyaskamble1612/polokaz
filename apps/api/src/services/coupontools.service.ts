import { and, db, deal, eq, inArray, notInArray, merchants } from "@polokaz/db";
import { useCoupontoolsLogger } from "../logger";

const logger = useCoupontoolsLogger();

export type CoupontoolsCampaign = Record<string, unknown>;

type CoupontoolsMerchantPayload = {
  businessName: string;
  contactEmail: string;
};

type CoupontoolsCreateCampaignPayload = {
  merchantExternalId?: string | null;
  title: string;
  description: string;
  category: string;
  dealType: "coupon" | "voucher" | "loyalty";
  discountValue: string;
  expiresAt: string | null;
};

type SyncResult = {
  inserted: number;
  updated: number;
  deactivated: number;
};

type LocalDealPayload = {
  coupontoolsId: string;
  title: string;
  description: string | null;
  merchantId: string | null;
  merchantName: string;
  category: string;
  dealType: "coupon" | "voucher" | "loyalty";
  status: "active" | "inactive" | "pending_moderation" | "rejected";
  expiresAt: Date | null;
  redemptionData: Record<string, unknown> | null;
  syncedAt: Date;
  coupontoolsCouponId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  discount: string | null;
  discountValue: string | null;
  merchantLogo: string | null;
  merchantWebsite: string | null;
  images: string[] | null;
  thumbnailUrl: string | null;
  featured: boolean;
  priority: number;
  metadata: Record<string, unknown> | null;
  coupontoolsData: Record<string, unknown>;
  updatedAt: Date;
};

const CATEGORY_MAP: Record<string, string> = {
  restaurant: "Food & Dining",
  restaurants: "Food & Dining",
  cafe: "Food & Dining",
  cafes: "Food & Dining",
  food: "Food & Dining",
  dining: "Food & Dining",
  clothing: "Retail",
  fashion: "Retail",
  shopping: "Retail",
  retail: "Retail",
  gym: "Health & Beauty",
  fitness: "Health & Beauty",
  beauty: "Health & Beauty",
  wellness: "Health & Beauty",
  health: "Health & Beauty",
  travel: "Travel",
  hotel: "Travel",
  hotels: "Travel",
  entertainment: "Entertainment",
  leisure: "Entertainment",
  services: "Services",
};

const STATUS_MAP: Record<string, LocalDealPayload["status"]> = {
  published: "active",
  active: "active",
  archived: "inactive",
  deleted: "inactive",
  draft: "pending_moderation",
  template: "pending_moderation",
  pending: "pending_moderation",
  rejected: "rejected",
};

const DEAL_TYPE_MAP: Record<string, LocalDealPayload["dealType"]> = {
  coupon: "coupon",
  voucher: "voucher",
  loyalty_card: "loyalty",
  loyalty: "loyalty",
};

let activeSyncPromise: Promise<SyncResult> | null = null;

function parseDecimal(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  let str = String(value).trim();
  str = str.replace(/^[$\u00A2-\u00A5\u20AC\u20A0-\u20CF]/, "");
  str = str.replace(/%$/, "");
  str = str.trim();
  const parsed = parseFloat(str);
  if (/^[+-]?\d+(?:\.\d+)?$/.test(str)) {
    return Number.isNaN(parsed) ? null : parsed.toFixed(2);
  }
  return null;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }

  return null;
}

export class CoupontoolsService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly apiSecret: string | null;

  constructor() {
    const apiKey = process.env.COUPONTOOLS_API_KEY?.trim();
    const apiUrl = process.env.COUPONTOOLS_API_URL?.trim();

    if (!apiKey) {
      throw new Error("COUPONTOOLS_API_KEY is required.");
    }

    if (!apiUrl) {
      throw new Error("COUPONTOOLS_API_URL is required.");
    }

    this.apiKey = apiKey;
    this.apiUrl = apiUrl.replace(/\/$/, "");
    this.apiSecret = process.env.COUPONTOOLS_API_SECRET?.trim() || null;
  }

  async fetchAllCampaigns(): Promise<CoupontoolsCampaign[]> {
    const url = `${this.apiUrl}/coupon/list`;
    logger.info("Fetching Coupontools campaigns", { url, at: new Date().toISOString() });

    const payload = await this.postRequest<{
      coupon_info?: CoupontoolsCampaign[];
      coupon?: CoupontoolsCampaign[];
      coupons?: CoupontoolsCampaign[];
      campaign?: CoupontoolsCampaign[];
      campaigns?: CoupontoolsCampaign[];
      status?: { status?: string };
    }>("/coupon/list", { only_active: false });

    if (payload.status?.status && payload.status.status !== "OK") {
      throw new Error(`Coupontools returned status ${payload.status.status}`);
    }

    return (
      payload.coupon_info ??
      payload.coupon ??
      payload.coupons ??
      payload.campaign ??
      payload.campaigns ??
      []
    );
  }

  async createMerchantAccount(payload: CoupontoolsMerchantPayload) {
    const response = await this.postWithFallback<
      {
        id?: string | number;
        merchant_id?: string | number;
        subaccount_id?: string | number;
        data?: {
          id?: string | number;
          merchant_id?: string | number;
          subaccount_id?: string | number;
        };
      }
    >(
      [
        process.env.COUPONTOOLS_CREATE_MERCHANT_PATH?.trim(),
        "/merchant/create",
        "/subaccount/create",
      ],
      {
        business_name: payload.businessName,
        contact_email: payload.contactEmail,
        company: payload.businessName,
        email: payload.contactEmail,
      },
    );

    const merchantId = pickString(
      response?.merchant_id,
      response?.subaccount_id,
      response?.id,
      response?.data?.merchant_id,
      response?.data?.subaccount_id,
      response?.data?.id,
    );

    if (!merchantId) {
      throw new Error("Coupontools merchant creation did not return an ID.");
    }

    return { coupontoolsMerchantId: merchantId, payload: response };
  }

  async createCampaign(payload: CoupontoolsCreateCampaignPayload) {
    const response = await this.postWithFallback<
      {
        id?: string | number;
        campaign_id?: string | number;
        coupon_id?: string | number;
        code?: string | number;
        coupon_info?: {
          ID?: string | number;
          id?: string | number;
          code?: string | number;
        };
        data?: {
          id?: string | number;
          campaign_id?: string | number;
          coupon_id?: string | number;
          code?: string | number;
        };
      }
    >(
      [
        "/coupon/create",
      ],
      {
        template: process.env.COUPONTOOLS_DEFAULT_TEMPLATE_ID || "1191621",
        name: payload.title,
        title: payload.title,
        subtitle: payload.description || undefined,
        expiry_date: payload.expiresAt
          ? payload.expiresAt.replace("T", " ").substring(0, 16)
          : undefined,
      },
    );

    const coupontoolsId = pickString(
      response?.campaign_id,
      response?.coupon_id,
      response?.id,
      response?.code,
      response?.coupon_info?.ID,
      response?.coupon_info?.id,
      response?.data?.campaign_id,
      response?.data?.coupon_id,
      response?.data?.id,
      response?.data?.code,
    );

    if (!coupontoolsId) {
      throw new Error("Coupontools campaign creation did not return an ID.");
    }

    return { coupontoolsId, payload: response };
  }

  async activateCampaign(coupontoolsId: string) {
    return this.postWithFallback(
      [
        process.env.COUPONTOOLS_ACTIVATE_CAMPAIGN_PATH?.trim(),
        "/coupon/status",
        "/campaign/status",
      ],
      {
        coupon_id: coupontoolsId,
        campaign_id: coupontoolsId,
        id: coupontoolsId,
        status: "published",
      },
    );
  }

  mapCampaignToLocalDeal(campaign: CoupontoolsCampaign): LocalDealPayload | null {
    const coupontoolsId = pickString(
      campaign.ID,
      campaign.id,
      campaign.campaign,
      campaign.code,
    );

    if (!coupontoolsId) {
      logger.warn("Skipping Coupontools campaign without ID", { campaign });
      return null;
    }

    const now = new Date();
    const rawCategory = pickString(
      campaign.coupon_category_name,
      campaign.category_name,
      campaign.category,
      campaign.coupon_tags,
      campaign.tags,
    );
    const rawStatus = pickString(campaign.status, campaign.campaign_status)?.toLowerCase() ?? "active";
    const rawDealType = pickString(
      campaign.type,
      campaign.deal_type,
      campaign.campaign_type,
      campaign.directory_type,
    )?.toLowerCase() ?? "coupon";
    const image = pickString(
      campaign.coupon_image,
      campaign.banner1,
      campaign.thumbnail,
      campaign.thumbnail_url,
      campaign.image,
      campaign.image_url,
    );

    return {
      coupontoolsId,
      title: pickString(campaign.title, campaign.name, campaign.friendly_name) ?? "Deal",
      description: pickString(campaign.description, campaign.subtitle),
      merchantId: pickString(campaign.subaccount, campaign.merchant_id, campaign.customid),
      merchantName:
        pickString(campaign.merchant_name, campaign.subaccount_name, campaign.company) ?? "Merchant",
      category: this.mapCategory(rawCategory),
      dealType: this.mapDealType(rawDealType),
      status: this.mapStatus(rawStatus),
      expiresAt: parseDate(
        pickString(campaign.expirydate, campaign.expiry_date, campaign.expiration_date, campaign.end_date),
      ),
      redemptionData: this.extractRedemptionData(campaign),
      syncedAt: now,
      coupontoolsCouponId: pickString(campaign.code, campaign.coupon_code) ?? coupontoolsId,
      startDate: parseDate(pickString(campaign.start_date, campaign.valid_from)),
      endDate: parseDate(
        pickString(campaign.expirydate, campaign.expiry_date, campaign.expiration_date, campaign.end_date),
      ),
      discount: pickString(campaign.coupon_value, campaign.discount_value),
      discountValue: parseDecimal(pickString(campaign.coupon_value, campaign.discount_value)),
      merchantLogo: pickString(campaign.logo_url, campaign.merchant_logo),
      merchantWebsite: pickString(campaign.website, campaign.merchant_website, campaign.poweredbylink),
      images: image ? [image] : null,
      thumbnailUrl: image,
      featured: false,
      priority: 0,
      metadata: rawCategory ? { originalCategory: rawCategory } : null,
      coupontoolsData: campaign,
      updatedAt: now,
    };
  }

  async syncDeals(): Promise<SyncResult> {
    if (activeSyncPromise) {
      logger.info("Reusing in-flight Coupontools sync");
      return activeSyncPromise;
    }

    activeSyncPromise = this.performSyncDeals();

    try {
      return await activeSyncPromise;
    } finally {
      activeSyncPromise = null;
    }
  }

  private async performSyncDeals(): Promise<SyncResult> {
    const campaigns = await this.fetchAllCampaigns();
    const mappedDeals = campaigns
      .map((campaign) => this.mapCampaignToLocalDeal(campaign))
      .filter((dealPayload): dealPayload is LocalDealPayload => dealPayload !== null);

    // Fetch all merchants to resolve CouponTools subaccount IDs to local merchant UUIDs
    const merchantsList = await db
      .select({ id: merchants.id, coupontoolsMerchantId: merchants.coupontoolsMerchantId })
      .from(merchants);
    const merchantMap = new Map<string, string>();
    for (const m of merchantsList) {
      if (m.coupontoolsMerchantId) {
        merchantMap.set(m.coupontoolsMerchantId, m.id);
      }
    }

    const ids = mappedDeals.map((item) => item.coupontoolsId);
    const existingRows = ids.length
      ? await db
          .select({ coupontoolsId: deal.coupontoolsId })
          .from(deal)
          .where(ids.length === 1 ? eq(deal.coupontoolsId, ids[0]) : inArray(deal.coupontoolsId, ids))
      : [];
    const existingIds = new Set(existingRows.map((row) => row.coupontoolsId));

    let inserted = 0;
    let updated = 0;

    for (const payload of mappedDeals) {
      // Resolve the CouponTools merchant ID to the local merchant UUID
      if (payload.merchantId) {
        payload.merchantId = merchantMap.get(payload.merchantId) || null;
      }
      const existed = existingIds.has(payload.coupontoolsId);

      await db
        .insert(deal)
        .values(payload)
        .onConflictDoUpdate({
          target: deal.coupontoolsId,
          set: {
            title: payload.title,
            description: payload.description,
            merchantId: payload.merchantId,
            merchantName: payload.merchantName,
            category: payload.category,
            dealType: payload.dealType,
            status: payload.status,
            expiresAt: payload.expiresAt,
            redemptionData: payload.redemptionData,
            syncedAt: payload.syncedAt,
            coupontoolsCouponId: payload.coupontoolsCouponId,
            startDate: payload.startDate,
            endDate: payload.endDate,
            discount: payload.discount,
            discountValue: payload.discountValue,
            merchantLogo: payload.merchantLogo,
            merchantWebsite: payload.merchantWebsite,
            images: payload.images,
            thumbnailUrl: payload.thumbnailUrl,
            featured: payload.featured,
            priority: payload.priority,
            metadata: payload.metadata,
            coupontoolsData: payload.coupontoolsData,
            updatedAt: payload.updatedAt,
          },
        });

      if (existed) {
        updated += 1;
      } else {
        inserted += 1;
      }
    }

    const now = new Date();
    const deactivatedRows =
      ids.length === 0
        ? await db
            .update(deal)
            .set({ status: "inactive", syncedAt: now, updatedAt: now })
            .where(eq(deal.status, "active"))
            .returning({ id: deal.id })
        : await db
            .update(deal)
            .set({ status: "inactive", syncedAt: now, updatedAt: now })
            .where(and(eq(deal.status, "active"), notInArray(deal.coupontoolsId, ids)))
            .returning({ id: deal.id });

    const result = {
      inserted,
      updated,
      deactivated: deactivatedRows.length,
    };

    logger.info("Coupontools sync completed", {
      ...result,
      at: now.toISOString(),
    });

    return result;
  }

  private mapCategory(rawCategory: string | null): string {
    if (!rawCategory) return "Other";
    const normalized = rawCategory.trim().toLowerCase();
    return CATEGORY_MAP[normalized] ?? rawCategory.trim();
  }

  private mapDealType(rawDealType: string): LocalDealPayload["dealType"] {
    return DEAL_TYPE_MAP[rawDealType] ?? "coupon";
  }

  private mapStatus(rawStatus: string): LocalDealPayload["status"] {
    return STATUS_MAP[rawStatus] ?? "inactive";
  }

  private extractRedemptionData(campaign: CoupontoolsCampaign): Record<string, unknown> | null {
    const redemptionUrl = pickString(
      campaign.redemption_url,
      campaign.url,
      campaign.short_url,
      campaign.qr_url,
    );
    const qrCode = pickString(campaign.qr_code, campaign.qrcode, campaign.barcode);
    const couponCode = pickString(campaign.code, campaign.coupon_code, campaign.custom_validation_code);

    const redemptionData: Record<string, unknown> = {};

    if (redemptionUrl) redemptionData.url = redemptionUrl;
    if (qrCode) redemptionData.qrCode = qrCode;
    if (couponCode) redemptionData.couponCode = couponCode;

    return Object.keys(redemptionData).length ? redemptionData : null;
  }

  private buildHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Client-Id": this.apiKey,
    };

    if (this.apiSecret) {
      headers["X-Client-Secret"] = this.apiSecret;
    }

    return headers;
  }

  private async postRequest<T>(path: string, body: Record<string, unknown>) {
    const url = `${this.apiUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      logger.error("Coupontools request failed", {
        url,
        status: response.status,
        body: responseBody,
      });
      throw new Error(`Coupontools request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  }

  private async postWithFallback<T>(paths: Array<string | undefined>, body: Record<string, unknown>) {
    let lastError: Error | null = null;

    for (const path of paths) {
      if (!path) continue;

      try {
        return await this.postRequest<T>(path, body);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    throw lastError ?? new Error("No Coupontools endpoint available for this operation.");
  }
}

export async function syncDeals() {
  return new CoupontoolsService().syncDeals();
}
