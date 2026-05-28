import express from "express";
import {
  getProfile,
  updateProfile,
  updatePassword,
  getPoints,
  getAffiliateStats,
  requestPayout,
} from "../controllers/me.controller";

const router = express.Router();

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.patch("/password", updatePassword);
router.get("/points", getPoints);
router.get("/affiliate-stats", getAffiliateStats);
router.post("/payout-request", requestPayout);

export { router as meRouter };
