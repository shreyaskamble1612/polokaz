import express from "express";
import {
  approveDeal,
  listAllDealsForAdmin,
  listPendingDeals,
  rejectDeal,
  triggerDealSync,
  getAdminMetrics,
  listUsersForAdmin,
  updateUserTier,
  updateUserBan,
  listPayoutsForAdmin,
  approvePayout,
} from "../controllers/admin.controller";

const router = express.Router();

router.post("/sync-deals", triggerDealSync);
router.get("/deals", listAllDealsForAdmin);
router.get("/deals/pending", listPendingDeals);
router.post("/deals/:id/approve", approveDeal);
router.post("/deals/:id/reject", rejectDeal);

// Metrics & platform overview
router.get("/metrics", getAdminMetrics);

// Users manager
router.get("/users", listUsersForAdmin);
router.patch("/users/:userId/tier", updateUserTier);
router.patch("/users/:userId/ban", updateUserBan);
router.post("/users/:userId/tier", updateUserTier);
router.post("/users/:userId/ban", updateUserBan);
router.post("/users/:id/tier", updateUserTier);
router.post("/users/:id/ban", updateUserBan);

// Payouts
router.get("/payouts", listPayoutsForAdmin);
router.patch("/payouts/:userId/approve", approvePayout);
router.post("/payouts/:userId/approve", approvePayout);
router.post("/payouts/:id/approve", approvePayout);

export { router as adminRouter };
