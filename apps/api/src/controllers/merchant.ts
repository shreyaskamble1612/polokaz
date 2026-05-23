import express from "express";

import { DealsService } from "../services/deals";
import { useLogger } from "../logger";
import { requireRole } from "../lib/authorization";

const router = express.Router();
const logger = useLogger(["api", "merchant"]);

router.post("/coupontools/connect", async (req, res) => {
  const session = requireRole(req, res, ["merchant", "admin"]);

  if (!session) {
    return;
  }

  try {
    const service = new DealsService();
    const result = await service.syncFromCoupontools();

    return res.json({
      ok: true,
      connected: true,
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
        message: "Failed to connect Coupontools",
      },
    });
  }
});

export { router as merchantRouter };