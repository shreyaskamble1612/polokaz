import cron from "node-cron";
import { DealsService } from "../services/deals";
import { useLogger } from "../logger";

const logger = useLogger(["api", "cron", "deal-sync"]);

export function registerDealSyncCron() {
  cron.schedule("*/30 * * * *", async () => {
    logger.info("[CRON] Starting deal sync");

    try {
      const result = await new DealsService().syncFromCoupontools();
      logger.info("[CRON] Deal sync complete", result);
    } catch (error) {
      logger.error("[CRON] Deal sync failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
