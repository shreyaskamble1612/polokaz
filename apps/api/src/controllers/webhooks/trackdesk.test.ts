import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// Mock dependencies before imports
vi.mock("@polokaz/db", () => {
  const mockDb = {
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  };
  return {
    db: mockDb,
    eq: vi.fn((col, val) => ({ col, val })),
    referralUse: {
      id: "referral_use.id",
      trackdeskStatus: "referral_use.trackdesk_status",
      updatedAt: "referral_use.updated_at",
    },
  };
});

vi.mock("../../logger", () => ({
  useWebhookLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock("../../services/webhooks", () => ({
  isWebhookProcessed: vi.fn().mockResolvedValue(false),
  createWebhookEvent: vi.fn().mockResolvedValue({ id: "wh-event-001" }),
  updateWebhookEventStatus: vi.fn().mockResolvedValue(undefined),
  logWebhookStep: vi.fn().mockResolvedValue(undefined),
}));

const WEBHOOK_SECRET = "test-webhook-secret-xyz";
process.env.TRACKDESK_WEBHOOK_SECRET = WEBHOOK_SECRET;

import { db } from "@polokaz/db";
import {
  isWebhookProcessed,
  createWebhookEvent,
  updateWebhookEventStatus,
  logWebhookStep,
} from "../../services/webhooks";

/**
 * Helper: generate a valid HMAC-SHA256 signature for a payload
 */
function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Helper: create a mock Express request
 */
function mockRequest(body: Record<string, unknown>, signature?: string) {
  const payload = JSON.stringify(body);
  return {
    body,
    headers: {
      "x-trackdesk-signature": signature ?? signPayload(payload, WEBHOOK_SECRET),
      "user-agent": "Trackdesk-Webhook/1.0",
    },
    ip: "127.0.0.1",
  };
}

/**
 * Helper: create a mock Express response
 */
function mockResponse() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

/**
 * Since the router uses express.Router(), we extract the POST handler
 * directly to test it in isolation without spinning up Express.
 */
async function getRouteHandler() {
  // Re-import to get fresh module with mocks applied
  const mod = await import("./trackdesk");
  const router = mod.trackdeskWebhookRouter;

  // Express router stores routes in router.stack
  const layer = (router as any).stack.find(
    (l: any) => l.route?.methods?.post,
  );
  if (!layer) throw new Error("POST route handler not found on router");
  return layer.route.stack[0].handle;
}

describe("Trackdesk Webhook Handler", () => {
  let handler: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    handler = await getRouteHandler();
  });

  describe("signature verification", () => {
    it("rejects requests with missing signature", async () => {
      const req = mockRequest({ type: "conversion.created", id: "evt-1", data: {} });
      req.headers["x-trackdesk-signature"] = undefined as any;
      const res = mockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid signature" });
    });

    it("rejects requests with invalid signature", async () => {
      const req = mockRequest(
        { type: "conversion.created", id: "evt-1", data: {} },
        "invalid-signature-value-that-is-same-length-as-real-0000000000000000",
      );
      const res = mockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("accepts requests with valid HMAC-SHA256 signature", async () => {
      const body = { type: "conversion.created", id: "evt-1", data: {} };
      const req = mockRequest(body);
      const res = mockResponse();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ received: true }),
      );
    });
  });

  describe("idempotency", () => {
    it("skips already-processed events", async () => {
      vi.mocked(isWebhookProcessed).mockResolvedValueOnce(true);

      const body = { type: "conversion.created", id: "evt-duplicate", data: {} };
      const req = mockRequest(body);
      const res = mockResponse();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        received: true,
        status: "already_processed",
      });
      expect(createWebhookEvent).not.toHaveBeenCalled();
    });
  });

  describe("conversion.created", () => {
    it("logs the event and marks as processed", async () => {
      const body = {
        type: "conversion.created",
        id: "evt-conv-created-1",
        data: { conversion_id: "conv-123" },
      };
      const req = mockRequest(body);
      const res = mockResponse();

      await handler(req, res);

      expect(createWebhookEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          source: "trackdesk",
          eventId: "evt-conv-created-1",
          eventType: "conversion.created",
        }),
      );
      expect(updateWebhookEventStatus).toHaveBeenCalledWith(
        "wh-event-001",
        "processed",
      );
      expect(res.json).toHaveBeenCalledWith({
        received: true,
        status: "processed",
      });
    });
  });

  describe("conversion.updated", () => {
    it("updates referral_use trackdeskStatus in database", async () => {
      const body = {
        type: "conversion.updated",
        id: "evt-conv-updated-1",
        data: {
          conversion_id: "referral-use-id-abc",
          status: "approved",
        },
      };
      const req = mockRequest(body);
      const res = mockResponse();

      await handler(req, res);

      expect(db.update).toHaveBeenCalled();
      expect(db.update(null as any).set).toHaveBeenCalledWith(
        expect.objectContaining({
          trackdeskStatus: "approved",
        }),
      );
      expect(res.json).toHaveBeenCalledWith({
        received: true,
        status: "processed",
      });
    });
  });

  describe("commission.approved", () => {
    it("sets trackdeskStatus to approved", async () => {
      const body = {
        type: "commission.approved",
        id: "evt-comm-approved-1",
        data: { conversion_id: "referral-use-id-xyz" },
      };
      const req = mockRequest(body);
      const res = mockResponse();

      await handler(req, res);

      expect(db.update(null as any).set).toHaveBeenCalledWith(
        expect.objectContaining({
          trackdeskStatus: "approved",
        }),
      );
      expect(updateWebhookEventStatus).toHaveBeenCalledWith(
        "wh-event-001",
        "processed",
      );
    });
  });

  describe("commission.rejected", () => {
    it("sets trackdeskStatus to rejected", async () => {
      const body = {
        type: "commission.rejected",
        id: "evt-comm-rejected-1",
        data: { conversion_id: "referral-use-id-xyz" },
      };
      const req = mockRequest(body);
      const res = mockResponse();

      await handler(req, res);

      expect(db.update(null as any).set).toHaveBeenCalledWith(
        expect.objectContaining({
          trackdeskStatus: "rejected",
        }),
      );
    });
  });

  describe("unknown event types", () => {
    it("skips unhandled event types gracefully", async () => {
      const body = {
        type: "affiliate.deleted",
        id: "evt-unknown-1",
        data: {},
      };
      const req = mockRequest(body);
      const res = mockResponse();

      await handler(req, res);

      expect(logWebhookStep).toHaveBeenCalledWith(
        "wh-event-001",
        "warn",
        "Unhandled event type: affiliate.deleted",
      );
      expect(updateWebhookEventStatus).toHaveBeenCalledWith(
        "wh-event-001",
        "skipped",
      );
      expect(res.json).toHaveBeenCalledWith({
        received: true,
        status: "skipped",
      });
    });
  });

  describe("error handling", () => {
    it("returns 500 and marks event as failed on processing error", async () => {
      // Make createWebhookEvent succeed but DB update fail
      vi.mocked(db.update).mockImplementationOnce(() => {
        throw new Error("DB connection lost");
      });

      const body = {
        type: "conversion.updated",
        id: "evt-error-1",
        data: { conversion_id: "conv-fail", status: "approved" },
      };
      const req = mockRequest(body);
      const res = mockResponse();

      await handler(req, res);

      expect(updateWebhookEventStatus).toHaveBeenCalledWith(
        "wh-event-001",
        "failed",
        "DB connection lost",
      );
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

describe("verifyTrackdeskSignature", () => {
  it("produces correct HMAC-SHA256 digest", () => {
    const payload = '{"type":"test","id":"1"}';
    const secret = "my-secret";
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const signature = signPayload(payload, secret);
    expect(signature).toBe(expected);
  });

  it("different payloads produce different signatures", () => {
    const sig1 = signPayload('{"a":1}', WEBHOOK_SECRET);
    const sig2 = signPayload('{"a":2}', WEBHOOK_SECRET);
    expect(sig1).not.toBe(sig2);
  });

  it("different secrets produce different signatures", () => {
    const payload = '{"test":true}';
    const sig1 = signPayload(payload, "secret-1");
    const sig2 = signPayload(payload, "secret-2");
    expect(sig1).not.toBe(sig2);
  });
});
