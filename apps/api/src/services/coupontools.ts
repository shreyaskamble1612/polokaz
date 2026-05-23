import crypto from "crypto";
import { useCoupontoolsLogger } from "../logger";

const logger = useCoupontoolsLogger();

const COUPONTOOLS_API_KEY = process.env.COUPONTOOLS_API_KEY;
const COUPONTOOLS_API_SECRET = process.env.COUPONTOOLS_API_SECRET;
const COUPONTOOLS_BASE_URL =
  process.env.COUPONTOOLS_BASE_URL || "https://api.coupontools.com";

export interface CoupontoolsCoupon {
  id?: string;
  campaign?: string;
  coupon_code?: string;
  friendly_name?: string;
  title?: string;
  subtitle?: string;
  tags?: string;
  coupon_value?: string;
  custom_validation_code?: string;
  customid?: string;
  timezone?: string;
}

export interface CoupontoolsDealPayload {
  coupontoolsId: string;
  title: string;
  description?: string;
  merchantId?: string;
  merchantName: string;
  category?: string;
  dealType: "coupon" | "voucher" | "loyalty";
  status: "active" | "inactive" | "pending_moderation";
  expiresAt?: string;
  redemptionData?: Record<string, unknown>;
  syncedAt?: Date;
  startDate?: string;
  endDate?: string;
  discountValue?: string;
  merchantLogo?: string;
  merchantWebsite?: string;
  images?: string[];
  thumbnailUrl?: string;
  featured?: boolean;
  priority?: number;
  metadata?: Record<string, unknown>;
  coupontoolsData?: Record<string, unknown>;
}

const CATEGORY_MAPPING: Record<string, string> = {
  "food & drinks": "food",
  "food and drinks": "food",
  food: "food",
  restaurant: "food",
  restaurants: "food",
  cafe: "food",
  cafes: "food",
  retail: "retail",
  shopping: "retail",
  "retail & shopping": "retail",
  entertainment: "entertainment",
  leisure: "entertainment",
  travel: "travel",
  "hotels & trips": "travel",
  hotel: "travel",
  hotels: "travel",
  beauty: "beauty",
  fitness: "beauty",
  "beauty & fitness": "beauty",
  health: "health",
  wellness: "health",
  "health & wellness": "health",
  education: "education",
  services: "services",
  service: "services",
};

export class CoupontoolsService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor() {
    if (!COUPONTOOLS_API_KEY || !COUPONTOOLS_API_SECRET) {
      throw new Error(
        "COUPONTOOLS_API_KEY and COUPONTOOLS_API_SECRET must be configured"
      );
    }

    this.apiKey = COUPONTOOLS_API_KEY;
    this.apiSecret = COUPONTOOLS_API_SECRET;
    this.baseUrl = COUPONTOOLS_BASE_URL.replace(/\/$/, "");
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-Client-Id": this.apiKey,
      "X-Client-Secret": this.apiSecret,
    };
  }

  async listCampaigns(): Promise<CoupontoolsDealPayload[]> {
    const url = `${this.baseUrl}/v3/coupon/list`;
    logger.info("Fetching coupons from Coupontools", { url });

    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ only_active: false }),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error("Coupontools list coupons failed", {
        status: response.status,
        error: text,
      });
      throw new Error(
        `Coupontools list coupons failed with status ${response.status}`
      );
    }

    const data = (await response.json()) as {
      status?: { status?: string };
      coupon?: Array<Record<string, unknown>>;
      coupons?: Array<Record<string, unknown>>;
      campaign?: Array<Record<string, unknown>>;
      campaigns?: Array<Record<string, unknown>>;
    };

    if (data.status?.status && data.status.status !== "OK") {
      logger.error("Coupontools returned non-OK status", { data });
      throw new Error(`Coupontools returned status ${data.status.status}`);
    }

    const coupons =
      data.coupon ?? data.coupons ?? data.campaign ?? data.campaigns ?? [];
    const deals = coupons
      .map((coupon) => this.mapCampaignToDeal(coupon))
      .filter((payload): payload is CoupontoolsDealPayload => payload !== null);

    logger.info("Coupontools coupons fetched", { count: deals.length });
    return deals;
  }

  mapCampaignToDeal(
    raw: Record<string, unknown>
  ): CoupontoolsDealPayload | null {
    const coupontoolsId = this.pickString(
      raw.ID,
      raw.id,
      raw.campaign,
      raw.coupon_code
    );

    if (!coupontoolsId) {
      logger.warn("Skipping Coupontools record without campaign ID", { raw });
      return null;
    }

    const rawCategory = this.pickString(
      raw.category_name,
      raw.category,
      raw.tags
    );
    const mappedCategory = this.mapCategory(rawCategory);
    const rawStatus = this.pickString(raw.status, raw.campaign_status);
    const expiry = this.pickString(
      raw.expiry_date,
      raw.expiration_date,
      raw.end_date,
      raw.valid_until
    );
    const startDate = this.pickString(raw.start_date, raw.valid_from);
    const merchantId = this.pickString(
      raw.subaccount,
      raw.merchant_id,
      raw.customid
    );
    const merchantName =
      this.pickString(raw.merchant_name, raw.subaccount_name, raw.company) ??
      "Merchant";
    const title =
      this.pickString(raw.friendly_name, raw.title, raw.name) ?? "Deal";
    const image = this.pickString(
      raw.thumbnail,
      raw.thumbnail_url,
      raw.image,
      raw.image_url
    );

    return {
      coupontoolsId,
      title,
      description: this.pickString(raw.description, raw.subtitle),
      merchantId: merchantId ?? undefined,
      merchantName,
      category: mappedCategory,
      dealType: this.mapDealType(raw),
      status: this.mapStatus(rawStatus),
      expiresAt: expiry ?? undefined,
      redemptionData: this.extractRedemptionData(raw),
      syncedAt: new Date(),
      startDate: startDate ?? undefined,
      endDate: expiry ?? undefined,
      discountValue: this.pickString(raw.coupon_value, raw.discount_value),
      merchantLogo: this.pickString(raw.merchant_logo, raw.logo_url) ?? undefined,
      merchantWebsite: this.pickString(raw.website, raw.merchant_website) ?? undefined,
      images: image ? [image] : undefined,
      thumbnailUrl: image ?? undefined,
      featured: false,
      priority: 0,
      metadata: rawCategory
        ? {
            originalCategory: rawCategory,
          }
        : undefined,
      coupontoolsData: raw,
    };
  }

  mapWebhookCouponToDeal(
    campaignId: string,
    coupon: CoupontoolsCoupon
  ): CoupontoolsDealPayload {
    const normalizedId = String(campaignId);

    return {
      coupontoolsId: normalizedId,
      title: coupon.title ?? coupon.friendly_name ?? "Deal",
      description: coupon.subtitle,
      merchantName: "Merchant",
      category: this.mapCategory(coupon.tags),
      dealType: "coupon",
      status: "active",
      redemptionData: this.extractRedemptionData(
        coupon as unknown as Record<string, unknown>
      ),
      syncedAt: new Date(),
      discountValue: coupon.coupon_value,
      metadata: coupon.tags
        ? {
            originalCategory: coupon.tags,
          }
        : undefined,
      coupontoolsData: coupon as unknown as Record<string, unknown>,
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const hmac = crypto.createHmac("sha256", this.apiSecret);
      const digest = hmac.update(payload).digest("hex");
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
    } catch {
      return false;
    }
  }

  private mapCategory(category?: string): string | undefined {
    if (!category) return undefined;
    const normalized = category.trim().toLowerCase();
    return CATEGORY_MAPPING[normalized] ?? normalized;
  }

  private mapDealType(
    raw: Record<string, unknown>
  ): "coupon" | "voucher" | "loyalty" {
    const rawType = this.pickString(
      raw.type,
      raw.deal_type,
      raw.campaign_type,
      raw.directory_type
    )?.toLowerCase();

    if (!rawType) return "coupon";
    if (rawType.includes("loyal")) return "loyalty";
    if (rawType.includes("voucher")) return "voucher";
    return "coupon";
  }

  private mapStatus(
    status?: string
  ): "active" | "inactive" | "pending_moderation" {
    const normalized = status?.trim().toLowerCase();
    if (!normalized) return "active";
    if (normalized.includes("pending")) return "pending_moderation";
    if (
      normalized.includes("inactive") ||
      normalized.includes("expired") ||
      normalized.includes("removed") ||
      normalized.includes("example") ||
      normalized.includes("draft")
    ) {
      return "inactive";
    }
    return "active";
  }

  private extractRedemptionData(
    raw: Record<string, unknown>
  ): Record<string, unknown> | undefined {
    const redemptionUrl = this.pickString(
      raw.redemption_url,
      raw.url,
      raw.short_url,
      raw.qr_url
    );
    const qrCode = this.pickString(raw.qr_code, raw.qrcode, raw.barcode);
    const couponCode = this.pickString(
      raw.coupon_code,
      raw.custom_validation_code
    );

    const redemptionData: Record<string, unknown> = {};

    if (redemptionUrl) redemptionData.url = redemptionUrl;
    if (qrCode) redemptionData.qrCode = qrCode;
    if (couponCode) redemptionData.couponCode = couponCode;

    return Object.keys(redemptionData).length > 0 ? redemptionData : undefined;
  }

  private pickString(...values: unknown[]): string | undefined {
    for (const value of values) {
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
      if (typeof value === "number") {
        return String(value);
      }
    }

    return undefined;
  }
}
