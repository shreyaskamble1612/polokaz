import express from "express";
import { getDealDetail, listDeals, listDealsByCategory, listFeaturedDeals } from "../controllers/deals.controller";

const router = express.Router();

router.get("/by-category", listDealsByCategory);
router.get("/featured", listFeaturedDeals);
router.get("/:id", getDealDetail);
router.get("/", listDeals);

export { router as dealsRouter };
