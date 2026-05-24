import {
  and,
  db,
  deal,
  desc,
  eq,
  merchants,
  redemptions,
  sql,
  user,
} from "@polokaz/db";
import { Request, Response } from "express";
import { z } from "zod";
import { requireSession } from "../lib/authorization";
import { useLogger } from "../logger";
import { CoupontoolsService } from "../services/coupontools.service";

const logger = useLogger(["api", "merchants"]);

const onboardSchema = z.object({
  businessName: z.string().min(2),
  businessCategory: z.string().min(1),
  contactEmail: z.string().email(),
  website: z.string().trim().optional().nullable(),
});

const createDealSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  category: z.string().min(1),
  dealType: z.enum(["coupon", "voucher", "loyalty"]),
  discountValue: z.union([z.string().min(1), z.number().positive()]),
  expiresAt: z.string().datetime().or(z.string().min(1)),
});

async function getCurrentUserWithTier(userId: string) {
  const [currentUser] = await db
    .select({
      id: user.id,
      email: user.email,
      tier: user.tier,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return currentUser ?? null;
}

async function getMerchantProfileForUser(userId: string) {
  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.userId, userId))
    .limit(1);

  return merchant ?? null;
}

export async function onboardMerchant(req: Request, res: Response) {
  const session = requireSession(req, res);

  if (!session) return;

  const parsed = onboardSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "INVALID_REQUEST", message: "Invalid merchant onboarding payload" },
    });
  }

  const currentUser = await getCurrentUserWithTier(session.user.id);

  if (!currentUser || currentUser.tier !== "merchant") {
    return res.status(403).json({
      error: { code: "FORBIDDEN", message: "An active merchant tier is required" },
    });
  }

  const existingProfile = await getMerchantProfileForUser(session.user.id);

  if (existingProfile) {
    return res.status(409).json({
      error: { code: "ALREADY_EXISTS", message: "Merchant profile already exists" },
    });
  }

  try {
    const coupontools = new CoupontoolsService();
    const createdMerchant = await coupontools.createMerchantAccount({
      businessName: parsed.data.businessName,
      contactEmail: parsed.data.contactEmail,
    });

    const [createdProfile] = await db
      .insert(merchants)
      .values({
        userId: session.user.id,
        businessName: parsed.data.businessName,
        businessCategory: parsed.data.businessCategory,
        contactEmail: parsed.data.contactEmail,
        website: parsed.data.website?.trim() || null,
        coupontoolsMerchantId: createdMerchant.coupontoolsMerchantId,
        status: "active",
      })
      .returning();

    return res.status(201).json({ merchant: createdProfile });
  } catch (error) {
    logger.error("Failed to onboard merchant", {
      userId: session.user.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return res.status(502).json({
      error: { code: "COUPONTOOLS_ERROR", message: "Failed to create merchant account" },
    });
  }
}

export async function createMerchantDeal(req: Request, res: Response) {
  const session = requireSession(req, res);

  if (!session) return;

  const parsed = createDealSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "INVALID_REQUEST", message: "Invalid merchant deal payload" },
    });
  }

  const merchantProfile = await getMerchantProfileForUser(session.user.id);

  if (!merchantProfile || merchantProfile.status !== "active") {
    return res.status(403).json({
      error: { code: "FORBIDDEN", message: "An active merchant profile is required" },
    });
  }

  const expiresAt = new Date(parsed.data.expiresAt);

  if (Number.isNaN(expiresAt.getTime())) {
    return res.status(400).json({
      error: { code: "INVALID_REQUEST", message: "expiresAt must be a valid date" },
    });
  }

  try {
    const coupontools = new CoupontoolsService();
    const createdCampaign = await coupontools.createCampaign({
      merchantExternalId: merchantProfile.coupontoolsMerchantId,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      dealType: parsed.data.dealType,
      discountValue: String(parsed.data.discountValue),
      expiresAt: expiresAt.toISOString(),
    });

    const [createdDeal] = await db
      .insert(deal)
      .values({
        coupontoolsId: createdCampaign.coupontoolsId,
        title: parsed.data.title,
        description: parsed.data.description,
        merchantId: merchantProfile.id,
        merchantName: merchantProfile.businessName,
        merchantWebsite: merchantProfile.website,
        category: parsed.data.category,
        dealType: parsed.data.dealType,
        discountValue: String(parsed.data.discountValue),
        status: "pending_moderation",
        expiresAt,
        syncedAt: new Date(),
        coupontoolsData: createdCampaign.payload as Record<string, unknown>,
      })
      .returning();

    return res.status(201).json({
      deal: createdDeal,
      message: "Deal submitted for review",
    });
  } catch (error) {
    logger.error("Failed to create merchant deal", {
      userId: session.user.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return res.status(502).json({
      error: { code: "COUPONTOOLS_ERROR", message: "Failed to create campaign" },
    });
  }
}

export async function listMerchantDeals(req: Request, res: Response) {
  const session = requireSession(req, res);

  if (!session) return;

  const merchantProfile = await getMerchantProfileForUser(session.user.id);

  if (!merchantProfile) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Merchant profile not found" },
    });
  }

  const rows = await db
    .select({
      id: deal.id,
      title: deal.title,
      description: deal.description,
      category: deal.category,
      dealType: deal.dealType,
      discountValue: deal.discountValue,
      expiresAt: deal.expiresAt,
      status: deal.status,
      rejectionReason: deal.rejectionReason,
      createdAt: deal.createdAt,
      redemptionCount: sql<number>`count(${redemptions.id})::int`,
    })
    .from(deal)
    .leftJoin(redemptions, eq(redemptions.dealId, deal.id))
    .where(eq(deal.merchantId, merchantProfile.id))
    .groupBy(deal.id)
    .orderBy(desc(deal.createdAt));

  return res.json({
    merchant: merchantProfile,
    deals: rows.map((row) => ({
      ...row,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
  });
}
