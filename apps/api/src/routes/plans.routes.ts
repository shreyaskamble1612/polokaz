import express from "express";
import { getMyTier, upgradeTier } from "../controllers/plans.controller";

const router = express.Router();

router.get("/my-tier", getMyTier);
router.post("/upgrade", upgradeTier);

export { router as plansRouter };
