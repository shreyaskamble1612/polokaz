import { useTrackdeskLogger } from "../logger";
import { db, eq, user as dbUser } from "@polokaz/db";

const logger = useTrackdeskLogger();

const TRACKDESK_API_KEY = process.env.TRACKDESK_API_KEY;
const TRACKDESK_CAMPAIGN_ID = process.env.TRACKDESK_CAMPAIGN_ID;
const TRACKDESK_BASE_URL =
  process.env.TRACKDESK_API_URL ||
  process.env.TRACKDESK_BASE_URL ||
  "https://api.trackdesk.com/v1";

export interface TrackdeskConversionData {
  clickId: string; // Trackdesk click ID from URL parameter
  conversionId: string; // Your internal conversion ID (referral use ID)
  amount?: number; // Optional: conversion value
  currency?: string; // Optional: currency code (default: USD)
  customerId?: string; // Optional: customer ID
  customerEmail?: string; // Optional: customer email
  metadata?: Record<string, any>; // Optional: additional data
}

export interface TrackdeskConversionResponse {
  id: string;
  clickId: string;
  conversionId: string;
  status: "pending" | "approved" | "rejected";
  amount?: number;
  currency?: string;
  createdAt: string;
}

/**
 * Trackdesk API Service
 * Handles conversion tracking, click logging, and affiliate management
 */
export class TrackdeskService {
  private apiKey: string;
  private campaignId: string;
  private baseUrl: string;

  constructor() {
    if (!TRACKDESK_API_KEY) {
      throw new Error("TRACKDESK_API_KEY is not configured");
    }
    if (!TRACKDESK_CAMPAIGN_ID) {
      throw new Error("TRACKDESK_CAMPAIGN_ID is not configured");
    }

    this.apiKey = TRACKDESK_API_KEY;
    this.campaignId = TRACKDESK_CAMPAIGN_ID;
    this.baseUrl = TRACKDESK_BASE_URL;
  }

  /**
   * Log a click to Trackdesk
   */
  async logClick(
    referralCode: string,
    affiliateId: string,
    ip: string,
    userAgent: string,
  ): Promise<any> {
    try {
      logger.info("Logging click to Trackdesk", {
        referralCode,
        affiliateId,
        ip,
        userAgent,
      });

      const response = await fetch(`${this.baseUrl}/clicks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "X-Campaign-ID": this.campaignId,
        },
        body: JSON.stringify({
          affiliate_id: affiliateId,
          campaign_id: this.campaignId,
          ip_address: ip,
          user_agent: userAgent,
          referral_code: referralCode,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Failed to log click to Trackdesk", {
          status: response.status,
          error: errorText,
          referralCode,
        });
        return null;
      }

      const result = (await response.json()) as any;
      logger.info("Click logged successfully to Trackdesk", {
        result,
      });
      return result;
    } catch (error) {
      logger.error("Error logging click to Trackdesk", {
        error: error instanceof Error ? error.message : String(error),
        referralCode,
      });
      return null;
    }
  }

  /**
   * Report a conversion to Trackdesk
   */
  async reportConversion(
    data: TrackdeskConversionData,
  ): Promise<TrackdeskConversionResponse | null> {
    try {
      logger.info("Reporting conversion to Trackdesk", {
        clickId: data.clickId,
        conversionId: data.conversionId,
      });

      const response = await fetch(`${this.baseUrl}/conversions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "X-Campaign-ID": this.campaignId,
        },
        body: JSON.stringify({
          click_id: data.clickId,
          conversion_id: data.conversionId,
          amount: data.amount,
          currency: data.currency || "USD",
          customer_id: data.customerId,
          customer_email: data.customerEmail,
          metadata: data.metadata,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Failed to report conversion to Trackdesk", {
          status: response.status,
          error: errorText,
          clickId: data.clickId,
        });
        return null;
      }

      const result = (await response.json()) as any;

      logger.info("Conversion reported successfully to Trackdesk", {
        trackdeskConversionId: result.id,
        clickId: data.clickId,
        conversionId: data.conversionId,
      });

      return {
        id: result.id,
        clickId: result.click_id,
        conversionId: result.conversion_id,
        status: result.status,
        amount: result.amount,
        currency: result.currency,
        createdAt: result.created_at,
      };
    } catch (error) {
      logger.error("Error reporting conversion to Trackdesk", {
        error: error instanceof Error ? error.message : String(error),
        clickId: data.clickId,
      });
      return null;
    }
  }

  /**
   * Get conversion status from Trackdesk
   */
  async getConversion(
    trackdeskConversionId: string,
  ): Promise<TrackdeskConversionResponse | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/conversions/${trackdeskConversionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "X-Campaign-ID": this.campaignId,
          },
        },
      );

      if (!response.ok) {
        logger.error("Failed to get conversion from Trackdesk", {
          status: response.status,
          trackdeskConversionId,
        });
        return null;
      }

      const result = (await response.json()) as any;

      return {
        id: result.id,
        clickId: result.click_id,
        conversionId: result.conversion_id,
        status: result.status,
        amount: result.amount,
        currency: result.currency,
        createdAt: result.created_at,
      };
    } catch (error) {
      logger.error("Error getting conversion from Trackdesk", {
        error: error instanceof Error ? error.message : String(error),
        trackdeskConversionId,
      });
      return null;
    }
  }

  /**
   * Create a Trackdesk tracking link for a referral URL
   * This wraps your referral URL so Trackdesk can track clicks
   */
  async createTrackingLink(destinationUrl: string): Promise<string | null> {
    try {
      logger.info("Creating Trackdesk tracking link", { destinationUrl });

      const response = await fetch(`${this.baseUrl}/links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "X-Campaign-ID": this.campaignId,
        },
        body: JSON.stringify({
          destination_url: destinationUrl,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Failed to create Trackdesk tracking link", {
          status: response.status,
          error: errorText,
        });
        return null;
      }

      const result = (await response.json()) as any;

      logger.info("Trackdesk tracking link created", {
        trackingUrl: result.tracking_url,
        destinationUrl,
      });

      return result.tracking_url; // e.g., https://track.trackdesk.com/click?...
    } catch (error) {
      logger.error("Error creating Trackdesk tracking link", {
        error: error instanceof Error ? error.message : String(error),
        destinationUrl,
      });
      return null;
    }
  }

  /**
   * Register a new user as a Trackdesk affiliate
   */
  async registerAffiliate(user: { id: string; email: string; name: string }): Promise<string | null> {
    try {
      logger.info("Registering affiliate in Trackdesk", {
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      const response = await fetch(`${this.baseUrl}/affiliates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "X-Campaign-ID": this.campaignId,
        },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          externalId: user.id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Failed to register affiliate in Trackdesk", {
          status: response.status,
          error: errorText,
          userId: user.id,
        });
        return null;
      }

      const result = (await response.json()) as any;
      const affiliateId = result?.id || null;

      if (affiliateId) {
        await db
          .update(dbUser)
          .set({
            trackdeskAffiliateId: affiliateId,
            updatedAt: new Date(),
          })
          .where(eq(dbUser.id, user.id));

        logger.info("Affiliate registered and stored successfully", {
          userId: user.id,
          trackdeskAffiliateId: affiliateId,
        });
      } else {
        logger.error("Trackdesk response did not return an affiliate ID", {
          result,
          userId: user.id,
        });
      }

      return affiliateId;
    } catch (error) {
      logger.error("Error registering affiliate in Trackdesk", {
        error: error instanceof Error ? error.message : String(error),
        userId: user.id,
      });
      return null;
    }
  }

  /**
   * Log a conversion directly in Trackdesk (fire-and-forget)
   */
  async logConversion(
    affiliateId: string,
    conversionType: string,
    orderId: string,
    value: number,
  ): Promise<void> {
    try {
      logger.info("Logging conversion directly in Trackdesk", {
        affiliateId,
        conversionType,
        orderId,
        value,
      });

      const response = await fetch(`${this.baseUrl}/conversions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "X-Campaign-ID": this.campaignId,
        },
        body: JSON.stringify({
          affiliateId,
          affiliate_id: affiliateId,
          campaignId: this.campaignId,
          campaign_id: this.campaignId,
          conversionType,
          conversion_type: conversionType,
          orderId,
          order_id: orderId,
          commissionValue: value,
          commission_value: value,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Failed to log conversion to Trackdesk", {
          status: response.status,
          error: errorText,
          affiliateId,
        });
      } else {
        const result = await response.json();
        logger.info("Conversion logged successfully to Trackdesk", {
          result,
          affiliateId,
        });
      }
    } catch (error) {
      logger.error("Error logging conversion to Trackdesk", {
        error: error instanceof Error ? error.message : String(error),
        affiliateId,
      });
    }
  }
}
