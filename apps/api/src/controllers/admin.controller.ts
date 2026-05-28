import { and, db, deal, desc, eq, merchants, redemptions, commissions, sql, user, referralConversions } from "@polokaz/db";
import { Request, Response } from "express";
import { z } from "zod";
import { useLogger } from "../logger";
import { requireRole } from "../lib/authorization";
import { CoupontoolsService, syncDeals } from "../services/coupontools.service";

const logger = useLogger(["api", "admin"]);
const rejectDealSchema = z.object({
  reason: z.string().min(2),
});

export async function triggerDealSync(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  try {
    const result = await syncDeals();
    return res.json(result);
  } catch (error) {
    logger.error("Error syncing deals from Coupontools", {
      error: error instanceof Error ? error.message : String(error),
      userId: session.user.id,
    });

    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to sync deals" },
    });
  }
}

export async function listPendingDeals(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const rows = await db
    .select({
      id: deal.id,
      title: deal.title,
      description: deal.description,
      category: deal.category,
      dealType: deal.dealType,
      status: deal.status,
      createdAt: deal.createdAt,
      expiresAt: deal.expiresAt,
      businessName: merchants.businessName,
      ownerEmail: user.email,
      merchantId: merchants.id,
      rejectionReason: deal.rejectionReason,
    })
    .from(deal)
    .innerJoin(merchants, eq(deal.merchantId, merchants.id))
    .innerJoin(user, eq(merchants.userId, user.id))
    .where(eq(deal.status, "pending_moderation"))
    .orderBy(desc(deal.createdAt));

  return res.json({
    deals: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt?.toISOString() ?? null,
    })),
  });
}

export async function listAllDealsForAdmin(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const page = Number(req.query.page || "1");
  const limit = Number(req.query.limit || "20");
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status && status !== "all") {
    conditions.push(eq(deal.status, status as any));
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countQuery] = await Promise.all([
    db
      .select({
        id: deal.id,
        title: deal.title,
        description: deal.description,
        category: deal.category,
        dealType: deal.dealType,
        status: deal.status,
        createdAt: deal.createdAt,
        rejectionReason: deal.rejectionReason,
        businessName: merchants.businessName,
        ownerEmail: user.email,
        redemptionCount: sql<number>`count(${redemptions.id})::int`,
      })
      .from(deal)
      .leftJoin(redemptions, eq(redemptions.dealId, deal.id))
      .leftJoin(merchants, eq(deal.merchantId, merchants.id))
      .leftJoin(user, eq(merchants.userId, user.id))
      .where(whereClause)
      .groupBy(deal.id, merchants.businessName, user.email)
      .orderBy(desc(deal.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(deal)
      .where(whereClause),
  ]);

  const total = countQuery[0]?.count ?? 0;

  return res.json({
    deals: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function approveDeal(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const [existingDeal] = await db
    .select({
      id: deal.id,
      coupontoolsId: deal.coupontoolsId,
    })
    .from(deal)
    .where(eq(deal.id, req.params.id))
    .limit(1);

  if (!existingDeal) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Deal not found" },
    });
  }

  try {
    const coupontools = new CoupontoolsService();
    if (existingDeal.coupontoolsId) {
      await coupontools.activateCampaign(existingDeal.coupontoolsId);
    }
  } catch (error) {
    logger.warn("Failed to activate deal in Coupontools during approval", {
      dealId: existingDeal.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const [updatedDeal] = await db
    .update(deal)
    .set({
      status: "active",
      rejectionReason: null,
      syncedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(deal.id, req.params.id))
    .returning();

  return res.json({ deal: updatedDeal });
}

export async function rejectDeal(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const parsed = rejectDealSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "INVALID_REQUEST", message: "A rejection reason is required" },
    });
  }

  const [updatedDeal] = await db
    .update(deal)
    .set({
      status: "rejected",
      rejectionReason: parsed.data.reason,
      syncedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(deal.id, req.params.id))
    .returning();

  if (!updatedDeal) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Deal not found" },
    });
  }

  logger.info("Merchant deal rejected", {
    dealId: updatedDeal.id,
    reason: parsed.data.reason,
    notification: "Email delivery not configured; logged only.",
  });

  return res.json({ deal: updatedDeal });
}

export async function getAdminMetrics(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [usersByTier, newSignupsQuery, totalDealsQuery, redemptionsThisMonthQuery, pendingPayoutsQuery, dailyRedemptions, dealsByCategory] = await Promise.all([
    db
      .select({
        tier: user.tier,
        count: sql<number>`count(*)::int`,
      })
      .from(user)
      .groupBy(user.tier),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(user)
      .where(sql`${user.createdAt} >= ${sevenDaysAgo.toISOString()}`),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(deal)
      .where(eq(deal.status, "active")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(redemptions)
      .where(sql`${redemptions.redeemedAt} >= ${startOfMonth.toISOString()}`),
    db
      .select({ sum: sql<number>`coalesce(sum(${commissions.amount}), 0)::float` })
      .from(commissions)
      .where(eq(commissions.status, "pending")),
    db
      .select({
        date: sql<string>`to_char(${redemptions.redeemedAt}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(redemptions)
      .where(sql`${redemptions.redeemedAt} >= ${thirtyDaysAgo.toISOString()}`)
      .groupBy(sql`to_char(${redemptions.redeemedAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${redemptions.redeemedAt}, 'YYYY-MM-DD') ASC`),
    db
      .select({
        category: deal.category,
        deals: sql<number>`count(*)::int`,
      })
      .from(deal)
      .groupBy(deal.category),
  ]);

  return res.json({
    usersByTier,
    newSignups: newSignupsQuery[0]?.count ?? 0,
    totalDeals: totalDealsQuery[0]?.count ?? 0,
    redemptionsThisMonth: redemptionsThisMonthQuery[0]?.count ?? 0,
    pendingPayouts: pendingPayoutsQuery[0]?.sum ?? 0,
    dailyRedemptions,
    dealsByCategory,
  });
}


export async function listUsersForAdmin(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const page = Number(req.query.page || "1");
  const limit = Number(req.query.limit || "10");
  const role = typeof req.query.role === "string" ? req.query.role : undefined;
  const tier = typeof req.query.tier === "string" ? req.query.tier : undefined;
  const banned = typeof req.query.banned === "string" ? req.query.banned : undefined;
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const offset = (page - 1) * limit;

  const conditions = [];
  if (role && role !== "all") {
    conditions.push(eq(user.role, role));
  }
  if (tier && tier !== "all") {
    conditions.push(eq(user.tier, tier as any));
  }
  if (banned === "banned") {
    conditions.push(eq(user.banned, true));
  } else if (banned === "active") {
    conditions.push(eq(user.banned, false));
  }
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(sql`(${user.name} ILIKE ${pattern} OR ${user.email} ILIKE ${pattern})`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;



  const referralSubquery = db
    .select({
      referrerId: referralConversions.referrerId,
      referralCount: sql<number>`count(*)::int`.as("referral_count"),
    })
    .from(referralConversions)
    .groupBy(referralConversions.referrerId)
    .as("ref_sub");

  const [usersList, countQuery] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tier: user.tier,
        banned: user.banned,
        createdAt: user.createdAt,
        referralCount: sql<number>`coalesce(${referralSubquery.referralCount}, 0)::int`,
      })
      .from(user)
      .leftJoin(referralSubquery, eq(user.id, referralSubquery.referrerId))
      .where(whereClause)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(user)
      .where(whereClause),
  ]);

  const total = countQuery[0]?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return res.json({
    users: usersList.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages,
  });
}

export async function updateUserTier(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const { userId } = req.params;
  const { tier } = req.body;

  if (!tier || !["free", "basic", "gold", "merchant"].includes(tier)) {
    return res.status(400).json({ error: "Invalid tier specified" });
  }

  const [updatedUser] = await db
    .update(user)
    .set({
      tier,
      ...(tier === "merchant" ? { role: "merchant" } : {}),
    })
    .where(eq(user.id, userId))
    .returning();

  if (!updatedUser) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ user: updatedUser });
}

export async function updateUserBan(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const { userId } = req.params;
  const { banned } = req.body;

  if (typeof banned !== "boolean") {
    return res.status(400).json({ error: "banned status must be a boolean" });
  }

  const [updatedUser] = await db
    .update(user)
    .set({ banned })
    .where(eq(user.id, userId))
    .returning();

  if (!updatedUser) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ user: updatedUser });
}

export async function listPayoutsForAdmin(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const status = typeof req.query.status === "string" ? req.query.status : "pending";

  const payouts = await db
    .select({
      id: commissions.userId,
      userId: commissions.userId,
      userName: user.name,
      email: user.email,
      tier: user.tier,
      amount: sql<number>`sum(${commissions.amount})::float`,
      commissions: sql<number>`count(${commissions.id})::int`,
      status: commissions.status,
    })
    .from(commissions)
    .innerJoin(user, eq(commissions.userId, user.id))
    .where(eq(commissions.status, status as any))
    .groupBy(commissions.userId, user.name, user.email, user.tier, commissions.status);

  return res.json({ payouts });
}

export async function approvePayout(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const { userId } = req.params;

  const [amountQuery] = await db
    .select({ sum: sql<number>`coalesce(sum(${commissions.amount}), 0)::float` })
    .from(commissions)
    .where(and(eq(commissions.userId, userId), eq(commissions.status, "pending")));

  const totalAmount = amountQuery?.sum ?? 0;

  const updated = await db
    .update(commissions)
    .set({
      status: "approved",
      paidAt: new Date(),
    })
    .where(and(eq(commissions.userId, userId), eq(commissions.status, "pending")))
    .returning();

  return res.json({
    approved: updated.length,
    totalAmount,
  });
}
