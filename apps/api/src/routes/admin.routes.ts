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
  getAdminSettingsEndpoint,
  updateAdminSettingsEndpoint,
  // New Moderation & Analytics Endpoints
  suspendMember,
  reinstateMember,
  cancelMember,
  terminateMember,
  reviewMember,
  waiveSignupFee,
  grantRewardManually,
  getAuditLogs,
  getAnalyticsOverview,
  getAnalyticsGrowth,
  getAnalyticsChurn,
  getAnalyticsAtRisk,
  getAnalyticsRevenue,
  getAnalyticsAffiliates,
  getAnalyticsOrgs,
  exportAnalyticsData,
} from "../controllers/admin.controller";

const router = express.Router();

router.post("/sync-deals", triggerDealSync);
router.get("/deals", listAllDealsForAdmin);
router.get("/deals/pending", listPendingDeals);
router.post("/deals/:id/approve", approveDeal);
router.post("/deals/:id/reject", rejectDeal);

// Settings
router.get("/settings", getAdminSettingsEndpoint);
router.post("/settings", updateAdminSettingsEndpoint);

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
router.put("/member/:userId/tier", updateUserTier);
router.put("/member/:id/tier", updateUserTier);
router.put("/users/:userId/tier", updateUserTier);

// Payouts
router.get("/payouts", listPayoutsForAdmin);
router.patch("/payouts/:userId/approve", approvePayout);
router.post("/payouts/:userId/approve", approvePayout);
router.post("/payouts/:id/approve", approvePayout);

// --- Advanced Member Moderation Endpoints ---
router.put("/member/:id/suspend", suspendMember);
router.put("/member/:id/reinstate", reinstateMember);
router.put("/member/:id/cancel", cancelMember);
router.put("/member/:id/terminate", terminateMember);
router.put("/member/:id/review", reviewMember);
router.put("/member/:id/waive-fee", waiveSignupFee);
router.post("/member/:id/grant-reward", grantRewardManually);
router.get("/audit-log", getAuditLogs);

// --- Analytics Endpoints ---
router.get("/analytics/overview", getAnalyticsOverview);
router.get("/analytics/growth", getAnalyticsGrowth);
router.get("/analytics/churn", getAnalyticsChurn);
router.get("/analytics/at-risk", getAnalyticsAtRisk);
router.get("/analytics/revenue", getAnalyticsRevenue);
router.get("/analytics/affiliates", getAnalyticsAffiliates);
router.get("/analytics/orgs", getAnalyticsOrgs);
router.get("/analytics/export", exportAnalyticsData);

export { router as adminRouter };

