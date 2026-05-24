import express from "express";
import {
  approveDeal,
  listAllDealsForAdmin,
  listPendingDeals,
  rejectDeal,
  triggerDealSync,
} from "../controllers/admin.controller";

const router = express.Router();

router.post("/sync-deals", triggerDealSync);
router.get("/deals", listAllDealsForAdmin);
router.get("/deals/pending", listPendingDeals);
router.post("/deals/:id/approve", approveDeal);
router.post("/deals/:id/reject", rejectDeal);

export { router as adminRouter };
