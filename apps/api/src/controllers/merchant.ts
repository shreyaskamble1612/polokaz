import express from "express";
import { db, merchants, eq } from "@polokaz/db";
import { useLogger } from "../logger";
import { requireRole } from "../lib/authorization";
import { syncDeals, CoupontoolsService } from "../services/coupontools.service";

const router = express.Router();
const logger = useLogger(["api", "merchant"]);

router.post("/coupontools/connect", async (req, res) => {
  const session = requireRole(req, res, ["merchant", "admin"]);

  if (!session) {
    return;
  }

  try {
    const [merchantProfile] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, session.user.id))
      .limit(1);

    if (!merchantProfile) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Merchant profile not found",
        },
      });
    }

    let coupontoolsMerchantId = merchantProfile.coupontoolsMerchantId;
    if (!coupontoolsMerchantId) {
      logger.info("Coupontools merchant ID is missing, attempting to create one", {
        merchantId: merchantProfile.id,
      });
      const coupontools = new CoupontoolsService();
      const createdMerchant = await coupontools.createMerchantAccount({
        businessName: merchantProfile.businessName,
        contactEmail: merchantProfile.contactEmail,
      });
      coupontoolsMerchantId = createdMerchant.coupontoolsMerchantId;

      await db
        .update(merchants)
        .set({ coupontoolsMerchantId })
        .where(eq(merchants.id, merchantProfile.id));

      logger.info("Successfully created and saved Coupontools merchant ID", {
        merchantId: merchantProfile.id,
        coupontoolsMerchantId,
      });
    }

    const result = await syncDeals();

    return res.json({
      ok: true,
      connected: true,
      coupontoolsMerchantId,
      ...result,
    });
  } catch (error) {
    logger.error("Error connecting Coupontools for merchant", {
      error: error instanceof Error ? error.message : String(error),
      userId: session.user.id,
    });

    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to connect Coupontools",
      },
    });
  }
});

export { router as merchantRouter };
