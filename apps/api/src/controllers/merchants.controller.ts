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
  expiresAt: z.string().datetime().or(z.string().min(1)).optional().nullable(),
});

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

  const existingProfile = await getMerchantProfileForUser(session.user.id);
  if (existingProfile) {
    return res.status(409).json({
      error: { code: "ALREADY_EXISTS", message: "Merchant profile already exists" },
    });
  }

  try {
    let coupontoolsMerchantId = null;
    try {
      const coupontools = new CoupontoolsService();
      const createdMerchant = await coupontools.createMerchantAccount({
        businessName: parsed.data.businessName,
        contactEmail: parsed.data.contactEmail,
      });
      coupontoolsMerchantId = createdMerchant.coupontoolsMerchantId;
    } catch (error) {
      logger.warn("Failed to create Coupontools merchant account, continuing without it.", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Upgrade user role and tier
    await db
      .update(user)
      .set({ role: "merchant", tier: "merchant" })
      .where(eq(user.id, session.user.id));

    const [createdProfile] = await db
      .insert(merchants)
      .values({
        userId: session.user.id,
        businessName: parsed.data.businessName,
        businessCategory: parsed.data.businessCategory,
        contactEmail: parsed.data.contactEmail,
        website: parsed.data.website?.trim() || null,
        coupontoolsMerchantId,
        status: "active",
      })
      .returning();

    return res.status(201).json({ merchant: createdProfile });
  } catch (error) {
    logger.error("Failed to onboard merchant", {
      userId: session.user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function getMerchantProfile(req: Request, res: Response) {
  const session = requireSession(req, res);
  if (!session) return;

  const merchant = await getMerchantProfileForUser(session.user.id);
  if (!merchant) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Merchant profile not found" },
    });
  }

  return res.json({ merchant });
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

  const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return res.status(400).json({
      error: { code: "INVALID_REQUEST", message: "expiresAt must be a valid date" },
    });
  }

  try {
    let coupontoolsId = null;
    let coupontoolsData = null;

    try {
      const coupontools = new CoupontoolsService();
      const createdCampaign = await coupontools.createCampaign({
        merchantExternalId: merchantProfile.coupontoolsMerchantId || "mock-merchant",
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category,
        dealType: parsed.data.dealType,
        discountValue: String(parsed.data.discountValue),
        expiresAt: expiresAt?.toISOString() || "",
      });
      coupontoolsId = createdCampaign.coupontoolsId;
      coupontoolsData = createdCampaign.payload as Record<string, unknown>;
    } catch (error) {
      logger.warn("Failed to create Coupontools campaign, using mock UUID.", {
        error: error instanceof Error ? error.message : String(error),
      });
      coupontoolsId = `mock-deal-${crypto.randomUUID()}`;
    }

    const [createdDeal] = await db
      .insert(deal)
      .values({
        coupontoolsId: coupontoolsId || `mock-${crypto.randomUUID()}`,
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
        coupontoolsData,
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
    return res.status(500).json({ error: "INTERNAL_ERROR" });
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

export async function updateMerchantDeal(req: Request, res: Response) {
  const session = requireSession(req, res);
  if (!session) return;

  const merchant = await getMerchantProfileForUser(session.user.id);
  if (!merchant) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }

  const { dealId } = req.params;
  const [existing] = await db
    .select()
    .from(deal)
    .where(and(eq(deal.id, dealId), eq(deal.merchantId, merchant.id)))
    .limit(1);

  if (!existing) {
    return res.status(404).json({ error: "Deal not found" });
  }

  const { title, description, status } = req.body;
  const updates: Record<string, any> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) {
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    // Map inactive to inactive
    updates.status = status;
  }

  const [updated] = await db
    .update(deal)
    .set(updates)
    .where(eq(deal.id, dealId))
    .returning();

  return res.json({ deal: updated });
}

export async function deleteMerchantDeal(req: Request, res: Response) {
  const session = requireSession(req, res);
  if (!session) return;

  const merchant = await getMerchantProfileForUser(session.user.id);
  if (!merchant) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }

  const { dealId } = req.params;
  const [existing] = await db
    .select()
    .from(deal)
    .where(and(eq(deal.id, dealId), eq(deal.merchantId, merchant.id)))
    .limit(1);

  if (!existing) {
    return res.status(404).json({ error: "Deal not found" });
  }

  await db.delete(deal).where(eq(deal.id, dealId));

  return res.json({ success: true });
}

export async function getMerchantAnalytics(req: Request, res: Response) {
  const session = requireSession(req, res);
  if (!session) return;

  const merchant = await getMerchantProfileForUser(session.user.id);
  if (!merchant) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }

  const range = typeof req.query.range === "string" ? req.query.range : "30d";
  let days = 30;
  if (range === "7d") days = 7;
  if (range === "90d") days = 90;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // 1. Total redemptions
  const [totalQuery] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(redemptions)
    .where(
      and(
        eq(redemptions.merchantId, merchant.id),
        sql`${redemptions.redeemedAt} >= ${startDate.toISOString()}`
      )
    );
  const totalRedemptions = totalQuery?.count ?? 0;

  // 2. Unique customers who redeemed
  const [uniqueQuery] = await db
    .select({ count: sql<number>`count(distinct ${redemptions.userId})::int` })
    .from(redemptions)
    .where(
      and(
        eq(redemptions.merchantId, merchant.id),
        sql`${redemptions.redeemedAt} >= ${startDate.toISOString()}`
      )
    );
  const uniqueCustomers = uniqueQuery?.count ?? 0;

  // 3. Redemptions per day (GROUP BY DATE)
  const redemptionsPerDay = await db
    .select({
      date: sql<string>`to_char(${redemptions.redeemedAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(redemptions)
    .where(
      and(
        eq(redemptions.merchantId, merchant.id),
        sql`${redemptions.redeemedAt} >= ${startDate.toISOString()}`
      )
    )
    .groupBy(sql`to_char(${redemptions.redeemedAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${redemptions.redeemedAt}, 'YYYY-MM-DD') ASC`);

  // 4. Top deals by redemption count
  const topDeals = await db
    .select({
      id: deal.id,
      title: deal.title,
      redemptionCount: sql<number>`count(${redemptions.id})::int`,
    })
    .from(deal)
    .innerJoin(redemptions, eq(redemptions.dealId, deal.id))
    .where(
      and(
        eq(deal.merchantId, merchant.id),
        sql`${redemptions.redeemedAt} >= ${startDate.toISOString()}`
      )
    )
    .groupBy(deal.id)
    .orderBy(sql`count(${redemptions.id}) DESC`)
    .limit(5);

  // 5. Recent redemptions
  const recentRedemptions = await db
    .select({
      id: redemptions.id,
      dealTitle: deal.title,
      customerName: user.name,
      redeemedAt: redemptions.redeemedAt,
    })
    .from(redemptions)
    .innerJoin(deal, eq(redemptions.dealId, deal.id))
    .innerJoin(user, eq(redemptions.userId, user.id))
    .where(eq(deal.merchantId, merchant.id))
    .orderBy(desc(redemptions.redeemedAt))
    .limit(5);

  const avgPerDay = Number((totalRedemptions / days).toFixed(1));

  return res.json({
    totalRedemptions,
    uniqueCustomers,
    redemptionsPerDay,
    topDeals,
    avgPerDay,
    recentRedemptions: recentRedemptions.map((r) => ({
      ...r,
      redeemedAt: r.redeemedAt.toISOString(),
    })),
  });
}

