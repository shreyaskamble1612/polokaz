import { Request, Response } from "express";
import { useLogger } from "../logger";
import { requireRole } from "../lib/authorization";
import { syncDeals } from "../services/coupontools.service";

const logger = useLogger(["api", "admin"]);

export async function triggerDealSync(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);

  if (!session) {
    return;
  }

  try {
    const result = await syncDeals();
    return res.json(result);
  } catch (error) {
    logger.error("Error syncing deals from Coupontools", {
      error: error instanceof Error ? error.message : String(error),
      userId: session.user.id,
    });

    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to sync deals" },
    });
  }
}
