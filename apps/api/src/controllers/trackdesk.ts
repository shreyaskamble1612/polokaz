import express from "express";
import { TrackdeskService } from "../services/trackdesk";
import { db, eq, referralUse, desc } from "@polokaz/db";
import { useLogger } from "../logger";

const router = express.Router();
const logger = useLogger();

/**
 * Report a referral conversion to Trackdesk
 * This endpoint is called after a successful signup with a referral
 * It finds the most recent referral_use record for the authenticated user
 */
router.post("/report-conversion", async (req, res) => {
  try {
    // Get user ID from session (set by authenticate middleware)
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // Get the most recent referral use record for this user
    const [referralUseRecord] = await db
      .select()
      .from(referralUse)
      .where(eq(referralUse.usedBy, userId))
      .orderBy(desc(referralUse.createdAt))
      .limit(1);

    if (!referralUseRecord) {
      return res.status(404).json({
        error: "Referral use not found",
      });
    }

    // Check if already reported
    if (referralUseRecord.trackdeskConversionId) {
      return res.json({
        message: "Conversion already reported",
        trackdeskConversionId: referralUseRecord.trackdeskConversionId,
      });
    }

    // Check if we have a click ID
    if (!referralUseRecord.trackdeskClickId) {
      return res.status(400).json({
        error: "No Trackdesk click ID found for this referral",
      });
    }

    // Report to Trackdesk
    const trackdeskService = new TrackdeskService();
    const conversion = await trackdeskService.reportConversion({
      clickId: referralUseRecord.trackdeskClickId,
      conversionId: referralUseRecord.id,
      customerId: referralUseRecord.usedBy,
    });

    if (!conversion) {
      return res.status(500).json({
        error: "Failed to report conversion to Trackdesk",
      });
    }

    // Update the referral use record
    await db
      .update(referralUse)
      .set({
        trackdeskConversionId: conversion.id,
        trackdeskStatus: conversion.status,
        updatedAt: new Date(),
      })
      .where(eq(referralUse.id, referralUseRecord.id));

    logger.info("Conversion reported to Trackdesk", {
      referralUseId: referralUseRecord.id,
      trackdeskConversionId: conversion.id,
      clickId: referralUseRecord.trackdeskClickId,
    });

    return res.json({
      message: "Conversion reported successfully",
      trackdeskConversionId: conversion.id,
      status: conversion.status,
    });
  } catch (error) {
    logger.error("Error reporting conversion", {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

export { router as trackdeskRouter };
