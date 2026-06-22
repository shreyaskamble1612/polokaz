import { useTrackdeskLogger } from "../logger";
import { db, eq, user as dbUser } from "@polokaz/db";

const logger = useTrackdeskLogger();

const TRACKDESK_API_KEY = process.env.TRACKDESK_API_KEY;
const TRACKDESK_CAMPAIGN_ID = process.env.TRACKDESK_CAMPAIGN_ID;
const TRACKDESK_TENANT_ID = process.env.TRACKDESK_TENANT_ID || "testingpolo";

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
  private tenantId: string;

  constructor() {
    if (!TRACKDESK_API_KEY) {
      throw new Error("TRACKDESK_API_KEY is not configured");
    }
    if (!TRACKDESK_CAMPAIGN_ID) {
      throw new Error("TRACKDESK_CAMPAIGN_ID is not configured");
    }

    this.apiKey = TRACKDESK_API_KEY;
    this.campaignId = TRACKDESK_CAMPAIGN_ID;
    this.tenantId = TRACKDESK_TENANT_ID;
    this.baseUrl = `https://${this.tenantId}.trackdesk.com`;
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

      const response = await fetch(`${this.baseUrl}/api/node/clicks/v1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": this.apiKey,
        },
        body: JSON.stringify({
          linkId: referralCode,
          sourceId: affiliateId,
          ipAddress: ip,
          userAgent: userAgent,
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

      const response = await fetch(`${this.baseUrl}/tracking/conversion/v1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": this.apiKey,
        },
        body: JSON.stringify({
          cid: data.clickId,
          externalId: data.conversionId,
          amount: data.amount ? { value: String(data.amount) } : undefined,
          currency: data.currency ? { code: data.currency } : { code: "USD" },
          customerId: data.customerId,
          customParams: data.metadata,
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
        id: result.id || "",
        clickId: result.click_id || result.cid || data.clickId,
        conversionId: result.conversion_id || result.external_id || data.conversionId,
        status: result.status === "CONVERSION_STATUS_APPROVED" ? "approved" : "pending",
        amount: result.amount?.value ? parseFloat(result.amount.value) : data.amount,
        currency: result.currency?.code || data.currency,
        createdAt: result.created_at || new Date().toISOString(),
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
        `${this.baseUrl}/api/reports/conversion-report/v1`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": this.apiKey,
          },
          body: JSON.stringify({
            filters: {
              ids: [trackdeskConversionId]
            }
          })
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
      const conv = result?.conversions?.[0];
      if (!conv) return null;

      return {
        id: conv.id,
        clickId: conv.click_id || conv.cid || "",
        conversionId: conv.conversion_id || conv.external_id || "",
        status: conv.status === "CONVERSION_STATUS_APPROVED" ? "approved" : "pending",
        amount: conv.amount?.value ? parseFloat(conv.amount.value) : 0,
        currency: conv.currency?.code || "USD",
        createdAt: conv.created_at || new Date().toISOString(),
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
  async createTrackingLink(destinationUrl: string, affiliatePublicId?: string): Promise<string | null> {
    if (!affiliatePublicId) {
      return null;
    }
    try {
      logger.info("Creating Trackdesk tracking link", { destinationUrl, affiliatePublicId });

      // 1. Fetch affiliate to get sourceId (UUID)
      const listRes = await fetch(`${this.baseUrl}/api/node/affiliates/v1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": this.apiKey,
        },
        body: JSON.stringify({
          filters: {
            publicIds: [affiliatePublicId]
          }
        })
      });

      if (!listRes.ok) {
        logger.warn("Failed to fetch affiliate details, returning null", { status: listRes.status });
        return null;
      }

      const listData = await listRes.json();
      const affiliate = listData?.affiliates?.[0];
      if (!affiliate || !affiliate.sourceId) {
        logger.warn("Affiliate not found in Trackdesk, returning null", { affiliatePublicId });
        return null;
      }

      const sourceId = affiliate.sourceId;

      // 2. Fetch offers to get default landingPageId
      const offerRes = await fetch(`${this.baseUrl}/api/node/offers/v1/list-with-landing-pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": this.apiKey,
        },
        body: JSON.stringify({}),
      });

      if (!offerRes.ok) {
        logger.warn("Failed to fetch offers, returning null", { status: offerRes.status });
        return null;
      }

      const offerData = await offerRes.json();
      const offer = offerData?.offers?.find((o: any) => o.id === this.campaignId);
      if (!offer || !offer.landingPages || offer.landingPages.length === 0) {
        logger.warn("Offer or landing pages not found, returning null", { campaignId: this.campaignId });
        return null;
      }

      const landingPageId = offer.landingPages[0].id;

      // 3. Build tracking link
      const response = await fetch(`${this.baseUrl}/api/node/tracking-links/v1/build`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": this.apiKey,
        },
        body: JSON.stringify({
          sourceId: sourceId,
          offerId: this.campaignId,
          target: {
            systemRedirect: {
              landingPageId: landingPageId,
              deepLinkUrl: destinationUrl
            }
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // If building failed (e.g. landing page targeting disabled), return null so the system falls back to direct link
        logger.info("Trackdesk link build API returned error, returning null for fallback to direct link", {
          status: response.status,
          error: errorText,
        });
        return null;
      }

      const result = (await response.json()) as any;
      logger.info("Trackdesk tracking link created", {
        trackingUrl: result.linkUrl,
        destinationUrl,
      });

      return result.linkUrl;
    } catch (error) {
      logger.error("Error creating Trackdesk tracking link, returning null", {
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

      // Generate a lowercase alphanumeric publicId from user's id
      const publicId = user.id.replace(/-/g, "").toLowerCase();

      const response = await fetch(`${this.baseUrl}/api/node/affiliates/v1/register-with-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": this.apiKey,
        },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          status: "ACCOUNT_STATUS_ENABLED",
          publicId: {
            value: publicId
          },
          shouldSendWelcomeEmail: false
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

      // Update the user record with the registered publicId
      await db
        .update(dbUser)
        .set({
          trackdeskAffiliateId: publicId,
          updatedAt: new Date(),
        })
        .where(eq(dbUser.id, user.id));

      logger.info("Affiliate registered and stored successfully", {
        userId: user.id,
        trackdeskAffiliateId: publicId,
      });

      return publicId;
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

      // Fetch sourceId (UUID) for this affiliate
      const listRes = await fetch(`${this.baseUrl}/api/node/affiliates/v1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": this.apiKey,
        },
        body: JSON.stringify({
          filters: {
            publicIds: [affiliateId]
          }
        })
      });

      let sourceId = "";
      if (listRes.ok) {
        const listData = await listRes.json();
        sourceId = listData?.affiliates?.[0]?.sourceId || "";
      }

      const response = await fetch(`${this.baseUrl}/tracking/conversion/v1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": this.apiKey,
        },
        body: JSON.stringify({
          externalClientId: sourceId || undefined,
          revenueOriginId: sourceId ? "caf8dd2a-2346-431a-8c52-65478f60080c" : undefined,
          conversionTypeCode: conversionType,
          externalId: orderId,
          customerId: orderId,
          amount: { value: String(value) },
          currency: { code: "USD" },
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

  /**
   * Deactivate a Trackdesk affiliate
   */
  async deactivateAffiliate(affiliateId: string): Promise<boolean> {
    try {
      logger.info("Deactivating affiliate in Trackdesk", { affiliateId });

      const response = await fetch(`${this.baseUrl}/api/node/affiliates/v1/${affiliateId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": this.apiKey,
        },
        body: JSON.stringify({
          status: "ACCOUNT_STATUS_DISABLED",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Failed to deactivate affiliate in Trackdesk", {
          status: response.status,
          error: errorText,
          affiliateId,
        });
        return false;
      }

      logger.info("Affiliate deactivated successfully in Trackdesk", { affiliateId });
      return true;
    } catch (error) {
      logger.error("Error deactivating affiliate in Trackdesk", {
        error: error instanceof Error ? error.message : String(error),
        affiliateId,
      });
      return false;
    }
  }

  /**
   * Reactivate a Trackdesk affiliate
   */
  async reactivateAffiliate(affiliateId: string): Promise<boolean> {
    try {
      logger.info("Reactivating affiliate in Trackdesk", { affiliateId });

      const response = await fetch(`${this.baseUrl}/api/node/affiliates/v1/${affiliateId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": this.apiKey,
        },
        body: JSON.stringify({
          status: "ACCOUNT_STATUS_ENABLED",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Failed to reactivate affiliate in Trackdesk", {
          status: response.status,
          error: errorText,
          affiliateId,
        });
        return false;
      }

      logger.info("Affiliate reactivated successfully in Trackdesk", { affiliateId });
      return true;
    } catch (error) {
      logger.error("Error reactivating affiliate in Trackdesk", {
        error: error instanceof Error ? error.message : String(error),
        affiliateId,
      });
      return false;
    }
  }
}
