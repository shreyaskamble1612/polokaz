import express from "express";
import { triggerDealSync } from "../controllers/admin.controller";

const router = express.Router();

router.post("/sync-deals", triggerDealSync);

export { router as adminRouter };
