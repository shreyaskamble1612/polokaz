import express from "express";
import {
  createMerchantDeal,
  listMerchantDeals,
  onboardMerchant,
  getMerchantProfile,
  updateMerchantDeal,
  deleteMerchantDeal,
  getMerchantAnalytics,
  listActiveMerchants,
} from "../controllers/merchants.controller";

const router = express.Router();

// Onboarding (requires user session)
router.post("/onboard", onboardMerchant);

// Profile and Deals (requires merchant session)
router.get("/me", getMerchantProfile);
router.get("/me/deals", listMerchantDeals);
router.post("/me/deals", createMerchantDeal);
router.patch("/me/deals/:dealId", updateMerchantDeal);
router.delete("/me/deals/:dealId", deleteMerchantDeal);
router.get("/me/analytics", getMerchantAnalytics);

// Active merchants (for customer home page)
router.get("/", listActiveMerchants);

// Legacy routes (backwards compatibility)
router.post("/deals", createMerchantDeal);
router.get("/deals", listMerchantDeals);

export { router as merchantsRouter };
