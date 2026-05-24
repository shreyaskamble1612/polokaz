import express from "express";
import {
  createMerchantDeal,
  listMerchantDeals,
  onboardMerchant,
} from "../controllers/merchants.controller";

const router = express.Router();

router.post("/onboard", onboardMerchant);
router.post("/deals", createMerchantDeal);
router.get("/deals", listMerchantDeals);

export { router as merchantsRouter };
