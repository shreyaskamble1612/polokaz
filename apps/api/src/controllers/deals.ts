import express from "express";
import { DealsService } from "../services/deals";
import { useLogger } from "../logger";

const router = express.Router();
const logger = useLogger();
const DEAL_STATUSES = ["active", "inactive", "pending_moderation", "rejected"] as const;

/**
 * GET /api/deals
 * List deals with optional filters (category, search, featured, page, limit)
 */
router.get("/", async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const featured = req.query.featured === "true";
    const rawStatus = (req.query.status as string) || "active";
    const status = DEAL_STATUSES.includes(rawStatus as (typeof DEAL_STATUSES)[number])
      ? (rawStatus as (typeof DEAL_STATUSES)[number])
      : "active";
    const page = Math.max(1, parseInt(String(req.query.page || 1), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || 20), 10)));

    const service = new DealsService();
    const result = await service.listDeals({
      category,
      search,
      featured: featured || undefined,
      status,
      page,
      limit,
    });

    return res.json(result);
  } catch (error) {
    logger.error("Error listing deals", {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to list deals" },
    });
  }
});

export { router as dealsRouter };
