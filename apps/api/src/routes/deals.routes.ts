import express from "express";
import { getDealDetail, listDeals, listDealsByCategory } from "../controllers/deals.controller";

const router = express.Router();

router.get("/by-category", listDealsByCategory);
router.get("/:id", getDealDetail);
router.get("/", listDeals);

export { router as dealsRouter };
