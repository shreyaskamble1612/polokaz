import cron from "node-cron";
import { useLogger } from "../logger";
import { syncDeals } from "../services/coupontools.service";

const logger = useLogger(["api", "cron", "deal-sync"]);

let initialized = false;

async function runDealSync(trigger: "startup" | "schedule") {
  try {
    logger.info("Starting Coupontools deal sync", {
      trigger,
      at: new Date().toISOString(),
    });
    const result = await syncDeals();
    logger.info("Completed Coupontools deal sync", {
      trigger,
      ...result,
      at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Coupontools deal sync failed", {
      trigger,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

if (!initialized) {
  initialized = true;
  void runDealSync("startup");
  cron.schedule("*/30 * * * *", () => {
    void runDealSync("schedule");
  });
}
