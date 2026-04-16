import crypto from "crypto";
import { useCoupontoolsLogger } from "../logger";

const logger = useCoupontoolsLogger();

const COUPONTOOLS_API_KEY = process.env.COUPONTOOLS_API_KEY;
const COUPONTOOLS_API_SECRET = process.env.COUPONTOOLS_API_SECRET;
const COUPONTOOLS_BASE_URL =
  process.env.COUPONTOOLS_BASE_URL || "https://api.coupontools.com";

/**
 * Coupontools API campaign/coupon (from list or webhook payload)
 */
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

/**
 * Normalized deal shape for our platform
 */
export interface CoupontoolsDealPayload {
  id: string;
  title: string;
  description?: string;
  category?: string;
  dealType: string;
  discountValue?: string;
  merchantName: string;
  merchantId?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  images?: string[];
  coupontoolsCouponId: string;
  coupontoolsData?: Record<string, unknown>;
}

/**
 * Coupontools API Service
 * Handles coupon/campaign fetching and sync per PRD
 */
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

  /**
   * Fetch campaigns from Coupontools API
   * Maps Coupontools response to our deal schema
   */
  async listCampaigns(): Promise<CoupontoolsDealPayload[]> {
    try {
      // Coupontools v4 campaign list - endpoint may vary; adjust per their docs
      const url = `${this.baseUrl}/v4/campaign/list`;
      logger.info("Fetching campaigns from Coupontools", { url });

      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const text = await response.text();
        logger.error("Coupontools list campaigns failed", {
          status: response.status,
          error: text,
        });
        return [];
      }

      const data = (await response.json()) as {
        status?: { status?: string };
        campaign?: Array<Record<string, unknown>>;
        campaigns?: Array<Record<string, unknown>>;
      };

      if (data.status?.status !== "OK") {
        logger.warn("Coupontools returned non-OK status", { data });
        return [];
      }

      const campaigns = data.campaign ?? data.campaigns ?? [];
      const deals: CoupontoolsDealPayload[] = campaigns.map((c: Record<string, unknown>) =>
        this.mapCampaignToDeal(c)
      );

      logger.info("Coupontools campaigns fetched", { count: deals.length });
      return deals;
    } catch (error) {
      logger.error("Error fetching Coupontools campaigns", {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Map Coupontools campaign/coupon object to our deal payload
   */
  mapCampaignToDeal(raw: Record<string, unknown>): CoupontoolsDealPayload {
    const id = String(raw.ID ?? raw.id ?? raw.campaign ?? raw.coupon_code ?? "");
    const coupontoolsCouponId = String(raw.ID ?? raw.id ?? raw.campaign ?? id);
    const title = String(raw.friendly_name ?? raw.title ?? raw.name ?? "Deal");
    const subtitle = raw.subtitle ? String(raw.subtitle) : undefined;
    const couponValue = raw.coupon_value ? String(raw.coupon_value) : undefined;
    const tags = raw.tags ? String(raw.tags) : undefined;

    return {
      id: coupontoolsCouponId.startsWith("cam_") ? coupontoolsCouponId : `cam_${coupontoolsCouponId}`,
      title,
      description: subtitle,
      category: tags ?? undefined,
      dealType: "percentage",
      discountValue: couponValue,
      merchantName: String(raw.merchant_name ?? raw.subaccount_name ?? "Merchant"),
      merchantId: raw.subaccount ? String(raw.subaccount) : undefined,
      status: "active",
      coupontoolsCouponId,
      coupontoolsData: raw as Record<string, unknown>,
    };
  }

  /**
   * Map webhook coupon payload to deal (for coupon_created, coupon_updated)
   */
  mapWebhookCouponToDeal(
    campaignId: string,
    coupon: CoupontoolsCoupon
  ): CoupontoolsDealPayload {
    const id = campaignId.startsWith("cam_") ? campaignId : `cam_${campaignId}`;
    return {
      id,
      title: coupon.title ?? coupon.friendly_name ?? "Deal",
      description: coupon.subtitle,
      category: coupon.tags ?? undefined,
      dealType: "percentage",
      discountValue: coupon.coupon_value,
      merchantName: "Merchant",
      status: "active",
      coupontoolsCouponId: id,
      coupontoolsData: coupon as unknown as Record<string, unknown>,
    };
  }

  /**
   * Verify webhook HMAC signature (Coupontools uses API secret)
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const hmac = crypto.createHmac("sha256", this.apiSecret);
      const digest = hmac.update(payload).digest("hex");
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
    } catch {
      return false;
    }
  }
}
