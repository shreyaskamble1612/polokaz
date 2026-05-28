import { and, db, deal, desc, eq, merchants, sql, walletItems, redemptions, referralConversions } from "@polokaz/db";
import { Request, Response } from "express";
import { requireSession } from "../lib/authorization";
import { dispatchReward } from "../services/rewards.service";

const WALLET_STATUSES = ["saved", "redeemed"] as const;

type WalletStatus = (typeof WALLET_STATUSES)[number];

const merchantNameSql = () =>
  sql<string>`coalesce(${merchants.businessName}, ${deal.merchantName}, 'Merchant')`;

function normalizeWalletStatus(value: unknown): WalletStatus | undefined {
  if (typeof value !== "string") return undefined;
  return WALLET_STATUSES.includes(value as WalletStatus) ? (value as WalletStatus) : undefined;
}

function serializeWalletItem(row: {
  id: string;
  userId: string;
  dealId: string;
  status: WalletStatus;
  savedAt: Date;
  redeemedAt: Date | null;
  deal: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    dealType: string;
    discountValue: string | null;
    merchantId: string | null;
    merchantName: string;
    merchantLogo: string | null;
    merchantWebsite: string | null;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    expiresAt: Date | null;
    images: string[] | null;
    thumbnailUrl: string | null;
    featured: boolean;
    coupontoolsCouponId: string | null;
  };
  merchant: {
    id: string;
    businessName: string;
    businessCategory: string | null;
    contactEmail: string;
    website: string | null;
    status: string;
  } | null;
}) {
  return {
    id: row.id,
    userId: row.userId,
    dealId: row.dealId,
    status: row.status,
    savedAt: row.savedAt.toISOString(),
    redeemedAt: row.redeemedAt?.toISOString() ?? null,
    deal: {
      ...row.deal,
      startDate: row.deal.startDate?.toISOString() ?? null,
      endDate: row.deal.endDate?.toISOString() ?? null,
      expiresAt: row.deal.expiresAt?.toISOString() ?? null,
    },
    merchant: row.merchant,
  };
}

async function getWalletItemById(id: string) {
  const [row] = await db
    .select({
      id: walletItems.id,
      userId: walletItems.userId,
      dealId: walletItems.dealId,
      status: walletItems.status,
      savedAt: walletItems.savedAt,
      redeemedAt: walletItems.redeemedAt,
      deal: {
        id: deal.id,
        title: deal.title,
        description: deal.description,
        category: deal.category,
        dealType: deal.dealType,
        discountValue: deal.discountValue,
        merchantId: deal.merchantId,
        merchantName: merchantNameSql(),
        merchantLogo: deal.merchantLogo,
        merchantWebsite: deal.merchantWebsite,
        status: deal.status,
        startDate: deal.startDate,
        endDate: deal.endDate,
        expiresAt: deal.expiresAt,
        images: deal.images,
        thumbnailUrl: deal.thumbnailUrl,
        featured: deal.featured,
        coupontoolsCouponId: deal.coupontoolsCouponId,
      },
      merchant: {
        id: merchants.id,
        businessName: merchants.businessName,
        businessCategory: merchants.businessCategory,
        contactEmail: merchants.contactEmail,
        website: merchants.website,
        status: merchants.status,
      },
    })
    .from(walletItems)
    .innerJoin(deal, eq(walletItems.dealId, deal.id))
    .leftJoin(merchants, eq(deal.merchantId, merchants.id))
    .where(eq(walletItems.id, id))
    .limit(1);

  return row ? serializeWalletItem(row) : null;
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

export async function saveDealToWallet(req: Request, res: Response) {
  const session = requireSession(req, res);

  if (!session) return;

  const dealId = typeof req.body?.dealId === "string" ? req.body.dealId.trim() : "";

  if (!dealId) {
    return res.status(400).json({
      error: { code: "INVALID_REQUEST", message: "dealId is required" },
    });
  }

  const [activeDeal] = await db
    .select({ id: deal.id })
    .from(deal)
    .where(and(eq(deal.id, dealId), eq(deal.status, "active" as const)))
    .limit(1);

  if (!activeDeal) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Active deal not found" },
    });
  }

  try {
    const [created] = await db
      .insert(walletItems)
      .values({
        userId: session.user.id,
        dealId,
        status: "saved",
        savedAt: new Date(),
      })
      .returning({ id: walletItems.id });

    const item = created ? await getWalletItemById(created.id) : null;

    return res.status(201).json({ item });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return res.status(409).json({
        error: { code: "ALREADY_SAVED", message: "Deal already saved" },
      });
    }

    throw error;
  }
}

export async function removeDealFromWallet(req: Request, res: Response) {
  const session = requireSession(req, res);

  if (!session) return;

  const dealId = req.params.dealId?.trim();

  if (!dealId) {
    return res.status(400).json({
      error: { code: "INVALID_REQUEST", message: "dealId is required" },
    });
  }

  const [item] = await db
    .select({
      id: walletItems.id,
      status: walletItems.status,
    })
    .from(walletItems)
    .where(and(eq(walletItems.userId, session.user.id), eq(walletItems.dealId, dealId)))
    .limit(1);

  if (!item) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Saved deal not found" },
    });
  }

  if (item.status !== "saved") {
    return res.status(409).json({
      error: { code: "INVALID_STATE", message: "Redeemed deals cannot be removed" },
    });
  }

  await db.delete(walletItems).where(eq(walletItems.id, item.id));

  return res.json({ success: true });
}

export async function listWalletItems(req: Request, res: Response) {
  const session = requireSession(req, res);

  if (!session) return;

  const status = req.query.status === undefined ? undefined : normalizeWalletStatus(req.query.status);

  if (req.query.status !== undefined && !status) {
    return res.status(400).json({
      error: { code: "INVALID_REQUEST", message: "status must be saved or redeemed" },
    });
  }

  const conditions = [eq(walletItems.userId, session.user.id)];

  if (status) {
    conditions.push(eq(walletItems.status, status));
  }

  const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

  const [items, savedCountRows, redeemedCountRows] = await Promise.all([
    db
      .select({
        id: walletItems.id,
        userId: walletItems.userId,
        dealId: walletItems.dealId,
        status: walletItems.status,
        savedAt: walletItems.savedAt,
        redeemedAt: walletItems.redeemedAt,
        deal: {
          id: deal.id,
          title: deal.title,
          description: deal.description,
          category: deal.category,
          dealType: deal.dealType,
          discountValue: deal.discountValue,
          merchantId: deal.merchantId,
          merchantName: merchantNameSql(),
          merchantLogo: deal.merchantLogo,
          merchantWebsite: deal.merchantWebsite,
          status: deal.status,
          startDate: deal.startDate,
          endDate: deal.endDate,
          expiresAt: deal.expiresAt,
          images: deal.images,
          thumbnailUrl: deal.thumbnailUrl,
          featured: deal.featured,
          coupontoolsCouponId: deal.coupontoolsCouponId,
        },
        merchant: {
          id: merchants.id,
          businessName: merchants.businessName,
          businessCategory: merchants.businessCategory,
          contactEmail: merchants.contactEmail,
          website: merchants.website,
          status: merchants.status,
        },
      })
      .from(walletItems)
      .innerJoin(deal, eq(walletItems.dealId, deal.id))
      .leftJoin(merchants, eq(deal.merchantId, merchants.id))
      .where(whereClause)
      .orderBy(desc(walletItems.redeemedAt), desc(walletItems.savedAt)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(walletItems)
      .where(and(eq(walletItems.userId, session.user.id), eq(walletItems.status, "saved"))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(walletItems)
      .where(and(eq(walletItems.userId, session.user.id), eq(walletItems.status, "redeemed"))),
  ]);

  return res.json({
    items: items.map(serializeWalletItem),
    savedCount: savedCountRows[0]?.count ?? 0,
    redeemedCount: redeemedCountRows[0]?.count ?? 0,
  });
}

export async function redeemDealInWallet(req: Request, res: Response) {
  const session = requireSession(req, res);
  if (!session) return;

  const dealId = req.params.dealId?.trim();
  if (!dealId) {
    return res.status(400).json({
      error: { code: "INVALID_REQUEST", message: "dealId is required" },
    });
  }

  // Find saved wallet item
  const [item] = await db
    .select({
      id: walletItems.id,
      status: walletItems.status,
      merchantId: deal.merchantId,
    })
    .from(walletItems)
    .innerJoin(deal, eq(walletItems.dealId, deal.id))
    .where(and(eq(walletItems.userId, session.user.id), eq(walletItems.dealId, dealId)))
    .limit(1);

  if (!item) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Saved deal not found in wallet" },
    });
  }

  if (item.status !== "saved") {
    return res.status(400).json({
      error: { code: "ALREADY_REDEEMED", message: "Deal has already been redeemed" },
    });
  }

  // Update wallet item
  await db
    .update(walletItems)
    .set({
      status: "redeemed",
      redeemedAt: new Date(),
    })
    .where(eq(walletItems.id, item.id));

  // Insert into redemptions
  const [redemptionRecord] = await db
    .insert(redemptions)
    .values({
      userId: session.user.id,
      dealId,
      merchantId: item.merchantId || "", // fallback if null
      redeemedAt: new Date(),
      rewardDispatched: true,
    })
    .returning();

  // Fire rewards dispatch
  let pointsEarned = 0;
  if (redemptionRecord) {
    // 1. Reward the user who redeemed the deal
    const userReward = await dispatchReward({
      type: "deal_redemption",
      userId: session.user.id,
      referenceId: redemptionRecord.id,
    });
    pointsEarned = userReward.pointsEarned ?? 0;

    // 2. If this user was referred by someone, reward the referrer
    const [conversion] = await db
      .select({ referrerId: referralConversions.referrerId })
      .from(referralConversions)
      .where(eq(referralConversions.referredUserId, session.user.id))
      .limit(1);

    if (conversion && conversion.referrerId) {
      await dispatchReward({
        type: "referral_redemption",
        userId: conversion.referrerId,
        referenceId: redemptionRecord.id,
      });
    }
  }

  return res.json({ success: true, pointsEarned });
}

