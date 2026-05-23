import express from "express";
import { DealsService } from "../services/deals";
import { useLogger } from "../logger";
import { requireRole } from "../lib/authorization";

const router = express.Router();
const logger = useLogger(["api", "admin"]);

router.post("/sync-deals", async (req, res) => {
  const session = requireRole(req, res, ["admin"]);

  if (!session) {
    return;
  }

  try {
    const service = new DealsService();
    const result = await service.syncFromCoupontools();
    return res.json(result);
  } catch (error) {
    logger.error("Error syncing deals from Coupontools", {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to sync deals" },
    });
  }
});

export { router as adminRouter };
