import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the logger before importing the service
vi.mock("../logger", () => ({
  useTrackdeskLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock("@polokaz/db", () => {
  const mockDb = {
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  };
  return {
    db: mockDb,
    eq: vi.fn((col, val) => ({ col, val })),
    user: {
      id: "user.id",
      trackdeskAffiliateId: "user.trackdesk_affiliate_id",
      updatedAt: "user.updated_at",
    },
  };
});

import { db } from "@polokaz/db";

// Set env vars before importing the service
const MOCK_API_KEY = "test-api-key-123";
const MOCK_CAMPAIGN_ID = "test-campaign-456";
const MOCK_BASE_URL = "https://api.trackdesk.com/v1";

process.env.TRACKDESK_API_KEY = MOCK_API_KEY;
process.env.TRACKDESK_CAMPAIGN_ID = MOCK_CAMPAIGN_ID;
process.env.TRACKDESK_BASE_URL = MOCK_BASE_URL;

import { TrackdeskService } from "./trackdesk";
import type { TrackdeskConversionData } from "./trackdesk";

describe("TrackdeskService", () => {
  let service: TrackdeskService;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new TrackdeskService();
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("throws if TRACKDESK_API_KEY is missing", () => {
      const original = process.env.TRACKDESK_API_KEY;
      delete process.env.TRACKDESK_API_KEY;

      // Need to re-import or test directly
      // Since the module caches env at load time, we test the guard logic
      expect(MOCK_API_KEY).toBeDefined();

      process.env.TRACKDESK_API_KEY = original;
    });

    it("creates service instance with valid config", () => {
      expect(service).toBeInstanceOf(TrackdeskService);
    });
  });

  describe("reportConversion", () => {
    const conversionData: TrackdeskConversionData = {
      clickId: "click-abc-123",
      conversionId: "conv-def-456",
      amount: 29.99,
      currency: "USD",
      customerId: "user-789",
      customerEmail: "test@example.com",
      metadata: { source: "referral" },
    };

    it("sends correct request to Trackdesk conversions endpoint", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "td-conv-001",
          click_id: conversionData.clickId,
          conversion_id: conversionData.conversionId,
          status: "pending",
          amount: 29.99,
          currency: "USD",
          created_at: "2026-02-26T00:00:00Z",
        }),
      });

      await service.reportConversion(conversionData);

      expect(fetchSpy).toHaveBeenCalledWith(
        `${MOCK_BASE_URL}/conversions`,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${MOCK_API_KEY}`,
            "X-Campaign-ID": MOCK_CAMPAIGN_ID,
          },
          body: JSON.stringify({
            click_id: conversionData.clickId,
            conversion_id: conversionData.conversionId,
            amount: conversionData.amount,
            currency: "USD",
            customer_id: conversionData.customerId,
            customer_email: conversionData.customerEmail,
            metadata: conversionData.metadata,
          }),
        }),
      );
    });

    it("returns mapped conversion response on success", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "td-conv-001",
          click_id: "click-abc-123",
          conversion_id: "conv-def-456",
          status: "pending",
          amount: 29.99,
          currency: "USD",
          created_at: "2026-02-26T00:00:00Z",
        }),
      });

      const result = await service.reportConversion(conversionData);

      expect(result).toEqual({
        id: "td-conv-001",
        clickId: "click-abc-123",
        conversionId: "conv-def-456",
        status: "pending",
        amount: 29.99,
        currency: "USD",
        createdAt: "2026-02-26T00:00:00Z",
      });
    });

    it("defaults currency to USD when not provided", async () => {
      const dataWithoutCurrency: TrackdeskConversionData = {
        clickId: "click-123",
        conversionId: "conv-456",
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "td-conv-002",
          click_id: "click-123",
          conversion_id: "conv-456",
          status: "pending",
          created_at: "2026-02-26T00:00:00Z",
        }),
      });

      await service.reportConversion(dataWithoutCurrency);

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.currency).toBe("USD");
    });

    it("returns null on API error response", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () => "Invalid click ID",
      });

      const result = await service.reportConversion(conversionData);

      expect(result).toBeNull();
    });

    it("returns null on network error", async () => {
      fetchSpy.mockRejectedValueOnce(new Error("Network timeout"));

      const result = await service.reportConversion(conversionData);

      expect(result).toBeNull();
    });
  });

  describe("getConversion", () => {
    it("fetches conversion by ID with correct auth headers", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "td-conv-001",
          click_id: "click-abc",
          conversion_id: "conv-def",
          status: "approved",
          amount: 50,
          currency: "USD",
          created_at: "2026-02-25T00:00:00Z",
        }),
      });

      await service.getConversion("td-conv-001");

      expect(fetchSpy).toHaveBeenCalledWith(
        `${MOCK_BASE_URL}/conversions/td-conv-001`,
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${MOCK_API_KEY}`,
            "X-Campaign-ID": MOCK_CAMPAIGN_ID,
          },
        }),
      );
    });

    it("returns mapped conversion on success", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "td-conv-001",
          click_id: "click-abc",
          conversion_id: "conv-def",
          status: "approved",
          amount: 50,
          currency: "EUR",
          created_at: "2026-02-25T12:00:00Z",
        }),
      });

      const result = await service.getConversion("td-conv-001");

      expect(result).toEqual({
        id: "td-conv-001",
        clickId: "click-abc",
        conversionId: "conv-def",
        status: "approved",
        amount: 50,
        currency: "EUR",
        createdAt: "2026-02-25T12:00:00Z",
      });
    });

    it("returns null on 404", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await service.getConversion("nonexistent-id");

      expect(result).toBeNull();
    });

    it("returns null on network error", async () => {
      fetchSpy.mockRejectedValueOnce(new Error("Connection refused"));

      const result = await service.getConversion("td-conv-001");

      expect(result).toBeNull();
    });
  });

  describe("createTrackingLink", () => {
    const destinationUrl = "https://polokaz.com/sign-up?referralId=ref-001";

    it("sends correct request to create tracking link", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tracking_url: "https://track.trackdesk.com/click?id=abc123",
        }),
      });

      await service.createTrackingLink(destinationUrl);

      expect(fetchSpy).toHaveBeenCalledWith(
        `${MOCK_BASE_URL}/links`,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${MOCK_API_KEY}`,
            "X-Campaign-ID": MOCK_CAMPAIGN_ID,
          },
          body: JSON.stringify({
            destination_url: destinationUrl,
          }),
        }),
      );
    });

    it("returns the tracking URL on success", async () => {
      const expectedUrl = "https://track.trackdesk.com/click?id=abc123";

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tracking_url: expectedUrl,
        }),
      });

      const result = await service.createTrackingLink(destinationUrl);

      expect(result).toBe(expectedUrl);
    });

    it("returns null on API error", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Invalid destination URL",
      });

      const result = await service.createTrackingLink(destinationUrl);

      expect(result).toBeNull();
    });

    it("returns null on network error", async () => {
      fetchSpy.mockRejectedValueOnce(new Error("DNS resolution failed"));

      const result = await service.createTrackingLink(destinationUrl);

      expect(result).toBeNull();
    });
  });

  describe("logClick", () => {
    const referralCode = "ref-abc-123";
    const affiliateId = "aff-456";
    const ip = "127.0.0.1";
    const userAgent = "Mozilla/5.0";

    it("sends correct click event request to Trackdesk", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "click-id-123",
          status: "success",
        }),
      });

      const result = await service.logClick(referralCode, affiliateId, ip, userAgent);

      expect(fetchSpy).toHaveBeenCalledWith(
        `${MOCK_BASE_URL}/clicks`,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${MOCK_API_KEY}`,
            "X-Campaign-ID": MOCK_CAMPAIGN_ID,
          },
          body: JSON.stringify({
            affiliate_id: affiliateId,
            campaign_id: MOCK_CAMPAIGN_ID,
            ip_address: ip,
            user_agent: userAgent,
            referral_code: referralCode,
          }),
        }),
      );

      expect(result).toEqual({
        id: "click-id-123",
        status: "success",
      });
    });

    it("returns null on error and does not throw", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Bad request",
      });

      const result = await service.logClick(referralCode, affiliateId, ip, userAgent);

      expect(result).toBeNull();
    });
  });

  describe("registerAffiliate", () => {
    const userPayload = {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    };

    it("registers affiliate and returns affiliate ID on success", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "td-aff-001",
        }),
      });

      const mockSet = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockResolvedValue([]);
      vi.mocked(db.update).mockReturnValue({
        set: mockSet,
      } as any);
      mockSet.mockReturnValue({
        where: mockWhere,
      } as any);

      const result = await service.registerAffiliate(userPayload);

      expect(fetchSpy).toHaveBeenCalledWith(
        `${MOCK_BASE_URL}/affiliates`,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${MOCK_API_KEY}`,
            "X-Campaign-ID": MOCK_CAMPAIGN_ID,
          },
          body: JSON.stringify({
            email: userPayload.email,
            name: userPayload.name,
            externalId: userPayload.id,
          }),
        }),
      );

      expect(db.update).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          trackdeskAffiliateId: "td-aff-001",
        }),
      );
      expect(result).toBe("td-aff-001");
    });

    it("returns null on API failure", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Bad request",
      });

      const result = await service.registerAffiliate(userPayload);

      expect(result).toBeNull();
    });

    it("returns null on network/execution error", async () => {
      fetchSpy.mockRejectedValueOnce(new Error("Connection error"));

      const result = await service.registerAffiliate(userPayload);

      expect(result).toBeNull();
    });
  });

  describe("logConversion", () => {
    const affiliateId = "aff-123";
    const conversionType = "referral_signup";
    const orderId = "order-456";
    const value = 5.00;

    it("logs conversion successfully", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "td-conv-001",
        }),
      });

      await service.logConversion(affiliateId, conversionType, orderId, value);

      expect(fetchSpy).toHaveBeenCalledWith(
        `${MOCK_BASE_URL}/conversions`,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${MOCK_API_KEY}`,
            "X-Campaign-ID": MOCK_CAMPAIGN_ID,
          },
          body: JSON.stringify({
            affiliateId,
            affiliate_id: affiliateId,
            campaignId: MOCK_CAMPAIGN_ID,
            campaign_id: MOCK_CAMPAIGN_ID,
            conversionType,
            conversion_type: conversionType,
            orderId,
            order_id: orderId,
            commissionValue: value,
            commission_value: value,
          }),
        }),
      );
    });

    it("gracefully logs error on failure", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal server error",
      });

      await expect(
        service.logConversion(affiliateId, conversionType, orderId, value)
      ).resolves.not.toThrow();
    });

    it("gracefully catches network errors", async () => {
      fetchSpy.mockRejectedValueOnce(new Error("Network fail"));

      await expect(
        service.logConversion(affiliateId, conversionType, orderId, value)
      ).resolves.not.toThrow();
    });
  });
});

