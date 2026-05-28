import express from "express";
import {
  getMyMerchantApplication,
  submitMerchantApplication,
} from "../controllers/merchant-applications.controller";

const router = express.Router();

router.get("/me", getMyMerchantApplication);
router.post("/", submitMerchantApplication);

export { router as merchantApplicationsRouter };
