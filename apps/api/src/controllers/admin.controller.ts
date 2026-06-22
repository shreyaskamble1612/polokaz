import { and, db, deal, desc, eq, merchants, redemptions, commissions, sql, user, referralConversions, adminSettings, auditLog, blockedEmails, pointsLedger } from "@polokaz/db";
import { Request, Response } from "express";
import { z } from "zod";
import { useLogger } from "../logger";
import { requireRole } from "../lib/authorization";
import { CoupontoolsService, syncDeals } from "../services/coupontools.service";
import { stripe } from "../services/stripe.service";
import { getAdminSettings } from "../services/rewards.service";
import { logAdminAction } from "../services/audit-log.service";
import { getUserRole } from "@polokaz/auth/roles";
import { TrackdeskService } from "../services/trackdesk";


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
    metrics: {
      usersByTier,
      newSignups: newSignupsQuery[0]?.count ?? 0,
      totalDeals: totalDealsQuery[0]?.count ?? 0,
      redemptionsThisMonth: redemptionsThisMonthQuery[0]?.count ?? 0,
      pendingPayouts: pendingPayoutsQuery[0]?.sum ?? 0,
      dailyRedemptions,
      dealsByCategory,
    }
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
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const offset = (page - 1) * limit;

  const conditions = [];
  if (role && role !== "all") {
    conditions.push(eq(user.role, role));
  }
  if (tier && tier !== "all") {
    conditions.push(eq(user.tier, tier as any));
  }
  if (status && status !== "all") {
    conditions.push(eq(user.status, status as any));
  } else if (banned === "banned") {
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
        stripeSubscriptionId: user.stripeSubscriptionId,
        createdAt: user.createdAt,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        setupFeeWaived: user.setupFeeWaived,
        cancellationReason: user.cancellationReason,
        cancellationDate: user.cancellationDate,
        suspensionReason: user.suspensionReason,
        suspensionNotes: user.suspensionNotes,
        suspensionDate: user.suspensionDate,
        terminationReason: user.terminationReason,
        terminationNotes: user.terminationNotes,
        terminationDate: user.terminationDate,
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
      lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
      cancellationDate: row.cancellationDate?.toISOString() ?? null,
      suspensionDate: row.suspensionDate?.toISOString() ?? null,
      terminationDate: row.terminationDate?.toISOString() ?? null,
    })),
    total,
    page,
    totalPages,
  });
}

export async function updateUserTier(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const userId = req.params.userId || req.params.id;
  const tier = req.body.tier || req.body.new_tier;

  if (!tier || !["free", "basic", "gold", "merchant", "regular", "premium", "organization", "small_vendor", "premium_vendor"].includes(tier)) {
    return res.status(400).json({ error: "Invalid tier specified" });
  }

  // Retrieve existing user to check subscription details and role
  const [existingUser] = await db
    .select({
      id: user.id,
      tier: user.tier,
      role: user.role,
      stripeSubscriptionId: user.stripeSubscriptionId,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!existingUser) {
    return res.status(404).json({ error: "User not found" });
  }

  // Prevent admin from changing tier if user has an active paid subscription
  if (existingUser.stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(existingUser.stripeSubscriptionId);

      // If the Stripe subscription has ended, perform self-healing: set DB tier to free and clear subscription ID
      if (sub && (sub.status === "canceled" || sub.status === "incomplete_expired")) {
        await db
          .update(user)
          .set({ tier: "free", stripeSubscriptionId: null })
          .where(eq(user.id, userId));

        existingUser.tier = "free";
        existingUser.stripeSubscriptionId = null;
      } else if (sub) {
        // Subscription is active/trialing/past_due/unpaid (not ended yet)
        return res.status(400).json({
          error: "FORBIDDEN_TIER_CHANGE",
          message: "Cannot change tier for a user with an active paid Stripe subscription.",
        });
      }
    } catch (stripeError: any) {
      logger.error("Failed to retrieve Stripe subscription during tier update check", {
        userId,
        stripeSubscriptionId: existingUser.stripeSubscriptionId,
        error: stripeError?.message || String(stripeError),
      });
      // Fallback: block manual updates if subscription ID is present and user is on a paid tier
      if (existingUser.tier !== "free") {
        return res.status(400).json({
          error: "FORBIDDEN_TIER_CHANGE",
          message: "Cannot change tier for a user with an active paid Stripe subscription (Stripe validation fallback).",
        });
      }
    }
  }

  const updates: Record<string, any> = { tier };
  if (existingUser.role !== "admin") {
    const isMerchantTier = ["merchant", "small_vendor", "premium_vendor"].includes(tier);
    updates.role = isMerchantTier ? "merchant" : "member";
  }

  const [updatedUser] = await db
    .update(user)
    .set(updates)
    .where(eq(user.id, userId))
    .returning();

  try {
    const adminRole = getUserRole(session.user);
    await logAdminAction({
      adminId: session.user.id,
      adminRole,
      targetUserId: userId,
      action: "tier_change",
      previousStatus: existingUser.tier,
      newStatus: tier,
      reason: "Admin Override Tier Change",
      notes: `Tier updated from ${existingUser.tier} to ${tier}`,
      ipAddress: req.ip,
    });
  } catch (err) {
    logger.error("Failed to write tier change audit log", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return res.json({ user: updatedUser });
}

export async function updateUserBan(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const userId = req.params.userId || req.params.id;
  const banned = typeof req.body.banned === "boolean" ? req.body.banned : true;

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

  const rows = await db
    .select({
      commissionId: commissions.id,
      userId: commissions.userId,
      amount: commissions.amount,
      currency: commissions.currency,
      commissionStatus: commissions.status,
      reason: commissions.reason,
      referenceId: commissions.referenceId,
      createdAt: commissions.createdAt,
      paidAt: commissions.paidAt,
      userName: user.name,
      email: user.email,
      tier: user.tier,
    })
    .from(commissions)
    .innerJoin(user, eq(commissions.userId, user.id))
    .where(eq(commissions.status, status as any));

  // Group by userId in memory
  const groups: Record<string, {
    user: { id: string; name: string | null; email: string; tier: string };
    totalPending: number;
    commissionCount: number;
    commissions: any[];
    // Backward compatibility fields
    id: string;
    userId: string;
    userName: string | null;
    email: string;
    tier: string;
    status: string;
    amount: number;
    commissionsCount: number;
  }> = {};

  for (const row of rows) {
    const uid = row.userId;
    const amountNum = typeof row.amount === "string" ? parseFloat(row.amount) : Number(row.amount);
    
    if (!groups[uid]) {
      groups[uid] = {
        user: {
          id: uid,
          name: row.userName,
          email: row.email,
          tier: row.tier,
        },
        totalPending: 0,
        commissionCount: 0,
        commissions: [],
        // Flat compatibility fields
        id: uid,
        userId: uid,
        userName: row.userName,
        email: row.email,
        tier: row.tier,
        status: row.commissionStatus,
        amount: 0,
        commissionsCount: 0,
      };
    }

    groups[uid].totalPending += amountNum;
    groups[uid].commissionCount += 1;
    groups[uid].amount += amountNum;
    groups[uid].commissionsCount += 1;
    groups[uid].commissions.push({
      id: row.commissionId,
      userId: row.userId,
      amount: amountNum,
      currency: row.currency,
      status: row.commissionStatus,
      reason: row.reason,
      referenceId: row.referenceId,
      createdAt: row.createdAt.toISOString(),
      paidAt: row.paidAt ? row.paidAt.toISOString() : null,
    });
  }

  const payouts = Object.values(groups).map((group) => {
    group.totalPending = Math.round(group.totalPending * 100) / 100;
    group.amount = Math.round(group.amount * 100) / 100;
    return group;
  });

  return res.json({ payouts });
}

export async function approvePayout(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const userId = req.params.userId || req.params.id;

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

export async function getAdminSettingsEndpoint(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  try {
    const settings = await getAdminSettings();
    return res.json({ settings });
  } catch (error) {
    logger.error("Error retrieving admin settings", {
      error: error instanceof Error ? error.message : String(error),
      userId: session.user.id,
    });
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to retrieve settings" },
    });
  }
}

export async function updateAdminSettingsEndpoint(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const {
    referralQualificationLimit,
    premiumActivationFee,
    vendorSetupFee,
    referralTiers,
    bonuses,
  } = req.body;

  try {
    const updates: Record<string, any> = {};

    if (referralQualificationLimit !== undefined) {
      updates.referralQualificationLimit = Number(referralQualificationLimit);
    }
    if (premiumActivationFee !== undefined) {
      updates.premiumActivationFee = String(premiumActivationFee);
    }
    if (vendorSetupFee !== undefined) {
      updates.vendorSetupFee = String(vendorSetupFee);
    }
    if (referralTiers !== undefined) {
      updates.referralTiers = referralTiers;
    }
    if (bonuses !== undefined) {
      updates.bonuses = bonuses;
    }

    const [updatedSettings] = await db
      .update(adminSettings)
      .set(updates)
      .where(eq(adminSettings.id, "default"))
      .returning();

    return res.json({ settings: updatedSettings });
  } catch (error) {
    logger.error("Error updating admin settings", {
      error: error instanceof Error ? error.message : String(error),
      userId: session.user.id,
    });
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to update settings" },
    });
  }
}

// --- MODERATION OVERRIDES ---

export async function suspendMember(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const targetUserId = req.params.id;
  const { reason, notes } = req.body;

  if (!reason) {
    return res.status(400).json({ error: "Reason is required" });
  }

  const [targetUser] = await db.select().from(user).where(eq(user.id, targetUserId)).limit(1);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const previousStatus = targetUser.status;

  await db
    .update(user)
    .set({
      status: "suspended",
      suspensionReason: reason,
      suspensionNotes: notes || null,
      suspensionDate: new Date(),
      suspensionInitiatedBy: session.user.id,
    })
    .where(eq(user.id, targetUserId));

  if (targetUser.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.update(targetUser.stripeSubscriptionId, {
        pause_collection: { behavior: "keep_as_draft" },
      });
    } catch (e: any) {
      logger.warn("Failed to pause Stripe subscription:", { error: e.message });
    }
  }

  if (targetUser.trackdeskAffiliateId) {
    try {
      const trackdesk = new TrackdeskService();
      await trackdesk.deactivateAffiliate(targetUser.trackdeskAffiliateId);
    } catch (e: any) {
      logger.warn("Failed to deactivate TrackDesk affiliate:", { error: e.message });
    }
  }

  const adminRole = getUserRole(session.user);
  await logAdminAction({
    adminId: session.user.id,
    adminRole,
    targetUserId,
    action: "suspend",
    previousStatus,
    newStatus: "suspended",
    reason,
    notes,
    ipAddress: req.ip,
  });

  return res.json({ success: true, message: "Member suspended successfully" });
}

export async function reinstateMember(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const targetUserId = req.params.id;

  const [targetUser] = await db.select().from(user).where(eq(user.id, targetUserId)).limit(1);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const previousStatus = targetUser.status;

  const adminRole = getUserRole(session.user);
  if (previousStatus === "terminated" && adminRole !== "super_admin") {
    return res.status(403).json({
      error: "FORBIDDEN",
      message: "Only Super Admins can reinstate terminated accounts.",
    });
  }

  await db
    .update(user)
    .set({
      status: "active",
      suspensionReason: null,
      suspensionNotes: null,
      suspensionDate: null,
      suspensionInitiatedBy: null,
      terminationReason: null,
      terminationNotes: null,
      terminationDate: null,
      terminationInitiatedBy: null,
    })
    .where(eq(user.id, targetUserId));

  await db.delete(blockedEmails).where(eq(blockedEmails.email, targetUser.email));

  if (targetUser.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.update(targetUser.stripeSubscriptionId, {
        pause_collection: null,
      });
    } catch (e: any) {
      logger.warn("Failed to resume Stripe subscription collection:", { error: e.message });
    }
  }

  if (targetUser.trackdeskAffiliateId) {
    try {
      const trackdesk = new TrackdeskService();
      await trackdesk.reactivateAffiliate(targetUser.trackdeskAffiliateId);
    } catch (e: any) {
      logger.warn("Failed to reactivate TrackDesk affiliate:", { error: e.message });
    }
  }

  await logAdminAction({
    adminId: session.user.id,
    adminRole,
    targetUserId,
    action: "reinstate",
    previousStatus,
    newStatus: "active",
    reason: "Admin Override / Reinstatement",
    notes: "Account active status restored.",
    ipAddress: req.ip,
  });

  return res.json({ success: true, message: "Member reinstated successfully" });
}

export async function cancelMember(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const targetUserId = req.params.id;
  const { reason, notes, immediate } = req.body;

  if (!reason) {
    return res.status(400).json({ error: "Reason is required" });
  }

  const [targetUser] = await db.select().from(user).where(eq(user.id, targetUserId)).limit(1);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const previousStatus = targetUser.status;

  if (targetUser.stripeSubscriptionId) {
    try {
      if (immediate) {
        await stripe.subscriptions.cancel(targetUser.stripeSubscriptionId);
      } else {
        await stripe.subscriptions.update(targetUser.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }
    } catch (e: any) {
      logger.warn("Failed to cancel Stripe subscription:", { error: e.message });
    }
  }

  if (targetUser.trackdeskAffiliateId) {
    try {
      const trackdesk = new TrackdeskService();
      await trackdesk.deactivateAffiliate(targetUser.trackdeskAffiliateId);
    } catch (e: any) {
      logger.warn("Failed to deactivate TrackDesk affiliate on cancellation:", { error: e.message });
    }
  }

  await db
    .update(commissions)
    .set({ status: "rejected" })
    .where(and(eq(commissions.userId, targetUserId), eq(commissions.status, "pending")));

  await db
    .update(user)
    .set({
      status: "cancelled",
      cancellationReason: reason,
      cancellationDate: new Date(),
      cancellationInitiatedBy: session.user.id,
    })
    .where(eq(user.id, targetUserId));

  const adminRole = getUserRole(session.user);
  await logAdminAction({
    adminId: session.user.id,
    adminRole,
    targetUserId,
    action: "cancel",
    previousStatus,
    newStatus: "cancelled",
    reason,
    notes,
    ipAddress: req.ip,
  });

  return res.json({ success: true, message: "Member cancelled successfully" });
}

export async function terminateMember(req: Request, res: Response) {
  const session = requireRole(req, res, ["super_admin"]);
  if (!session) return;

  const targetUserId = req.params.id;
  const { reason, notes } = req.body;

  if (!reason) {
    return res.status(400).json({ error: "Reason is required" });
  }

  const [targetUser] = await db.select().from(user).where(eq(user.id, targetUserId)).limit(1);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const previousStatus = targetUser.status;

  if (targetUser.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(targetUser.stripeSubscriptionId);
    } catch (e: any) {
      logger.warn("Failed to cancel Stripe subscription on termination:", { error: e.message });
    }
  }

  if (targetUser.trackdeskAffiliateId) {
    try {
      const trackdesk = new TrackdeskService();
      await trackdesk.deactivateAffiliate(targetUser.trackdeskAffiliateId);
    } catch (e: any) {
      logger.warn("Failed to deactivate TrackDesk affiliate on termination:", { error: e.message });
    }
  }

  await db
    .update(commissions)
    .set({ status: "rejected" })
    .where(
      and(
        eq(commissions.userId, targetUserId),
        sql`${commissions.status} IN ('pending', 'approved')`
      )
    );

  await db
    .insert(blockedEmails)
    .values({
      email: targetUser.email,
    })
    .onConflictDoNothing();

  await db
    .update(user)
    .set({
      status: "terminated",
      terminationReason: reason,
      terminationNotes: notes || null,
      terminationDate: new Date(),
      terminationInitiatedBy: session.user.id,
      banned: true,
      banReason: reason,
    })
    .where(eq(user.id, targetUserId));

  const adminRole = getUserRole(session.user);
  await logAdminAction({
    adminId: session.user.id,
    adminRole,
    targetUserId,
    action: "terminate",
    previousStatus,
    newStatus: "terminated",
    reason,
    notes,
    ipAddress: req.ip,
  });

  return res.json({ success: true, message: "Member terminated permanently" });
}

export async function reviewMember(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const targetUserId = req.params.id;
  const { reason, notes } = req.body;

  if (!reason) {
    return res.status(400).json({ error: "Reason is required" });
  }

  const [targetUser] = await db.select().from(user).where(eq(user.id, targetUserId)).limit(1);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const previousStatus = targetUser.status;

  await db
    .update(user)
    .set({
      status: "under_review",
    })
    .where(eq(user.id, targetUserId));

  const adminRole = getUserRole(session.user);
  await logAdminAction({
    adminId: session.user.id,
    adminRole,
    targetUserId,
    action: "review",
    previousStatus,
    newStatus: "under_review",
    reason,
    notes,
    ipAddress: req.ip,
  });

  return res.json({ success: true, message: "Member placed under review successfully" });
}

export async function waiveSignupFee(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const targetUserId = req.params.id;
  const { waive } = req.body;

  const [targetUser] = await db.select().from(user).where(eq(user.id, targetUserId)).limit(1);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  await db
    .update(user)
    .set({
      setupFeeWaived: !!waive,
    })
    .where(eq(user.id, targetUserId));

  const adminRole = getUserRole(session.user);
  await logAdminAction({
    adminId: session.user.id,
    adminRole,
    targetUserId,
    action: "waive_fee",
    previousStatus: targetUser.status,
    newStatus: targetUser.status,
    reason: waive ? "Fee Waived by Admin" : "Fee Waive Rescinded",
    notes: `Setup fee waived status set to ${!!waive}`,
    ipAddress: req.ip,
  });

  return res.json({ success: true, setupFeeWaived: !!waive });
}

export async function grantRewardManually(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const targetUserId = req.params.id;
  const { rewardType, amount, reason } = req.body;

  if (!rewardType || !amount || !reason) {
    return res.status(400).json({ error: "rewardType, amount, and reason are required" });
  }

  const [targetUser] = await db.select().from(user).where(eq(user.id, targetUserId)).limit(1);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  if (rewardType === "points") {
    await db.insert(pointsLedger).values({
      userId: targetUserId,
      points: Math.round(amount),
      reason: "admin_grant",
    });
  } else if (rewardType === "commission") {
    await db.insert(commissions).values({
      userId: targetUserId,
      amount: Number(amount).toFixed(2),
      currency: "USD",
      status: "approved",
      reason: "referral_signup",
    });
  } else {
    return res.status(400).json({ error: "Invalid rewardType. Use 'points' or 'commission'." });
  }

  const adminRole = getUserRole(session.user);
  await logAdminAction({
    adminId: session.user.id,
    adminRole,
    targetUserId,
    action: "grant_reward",
    previousStatus: targetUser.status,
    newStatus: targetUser.status,
    reason,
    notes: `Manually granted ${amount} ${rewardType}`,
    ipAddress: req.ip,
  });

  return res.json({ success: true, message: `Successfully granted ${amount} ${rewardType}` });
}

export async function getAuditLogs(req: Request, res: Response) {
  const session = requireRole(req, res, ["super_admin"]);
  if (!session) return;

  const page = Number(req.query.page || "1");
  const limit = Number(req.query.limit || "20");
  const offset = (page - 1) * limit;

  const rows = await db
    .select({
      id: auditLog.id,
      adminId: auditLog.adminId,
      adminRole: auditLog.adminRole,
      targetUserId: auditLog.targetUserId,
      action: auditLog.action,
      previousStatus: auditLog.previousStatus,
      newStatus: auditLog.newStatus,
      reason: auditLog.reason,
      notes: auditLog.notes,
      ipAddress: auditLog.ipAddress,
      createdAt: auditLog.createdAt,
      adminName: user.name,
      targetName: sql<string>`(select name from "user" where id = ${auditLog.targetUserId})`,
    })
    .from(auditLog)
    .leftJoin(user, eq(auditLog.adminId, user.id))
    .orderBy(desc(auditLog.createdAt))
    .limit(limit)
    .offset(offset);

  const [countQuery] = await db.select({ count: sql<number>`count(*)::int` }).from(auditLog);
  const total = countQuery?.count ?? 0;

  return res.json({
    logs: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// --- ANALYTICS DASHBOARDS ---

export async function getAnalyticsOverview(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const [totalActiveMembersQuery, newThisMonthQuery, monthlyRevenueQuery, churnRate30dQuery, tierBreakdown, suspendedCountQuery, terminatedCountQuery] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(user).where(eq(user.status, "active")),
    db.select({ count: sql<number>`count(*)::int` }).from(user).where(sql`${user.createdAt} >= date_trunc('month', now())`),
    db.select({
      mrr: sql<number>`sum(
        case 
          when tier = 'regular' then 5.00
          when tier = 'premium' then 15.00
          when tier = 'organization' then 15.00
          when tier = 'small_vendor' then 35.00
          else 0
        end
      )::float`
    }).from(user).where(eq(user.status, "active")),
    db.select({ count: sql<number>`count(*)::int` })
      .from(user)
      .where(and(eq(user.status, "cancelled"), sql`${user.cancellationDate} >= now() - interval '30 days'`)),
    db.select({
      tier: user.tier,
      count: sql<number>`count(*)::int`,
    }).from(user).where(eq(user.status, "active")).groupBy(user.tier),
    db.select({ count: sql<number>`count(*)::int` }).from(user).where(eq(user.status, "suspended")),
    db.select({ count: sql<number>`count(*)::int` }).from(user).where(eq(user.status, "terminated")),
  ]);

  const activeMembers = totalActiveMembersQuery[0]?.count ?? 0;
  const newThisMonth = newThisMonthQuery[0]?.count ?? 0;
  const grossMRR = monthlyRevenueQuery[0]?.mrr ?? 0;
  const cancellations30d = churnRate30dQuery[0]?.count ?? 0;

  const approxStartActive = Math.max(1, activeMembers + cancellations30d - newThisMonth);
  const churnRate30d = (cancellations30d / approxStartActive) * 100;

  return res.json({
    activeMembers,
    newThisMonth,
    mrr: grossMRR,
    churnRate: Math.round(churnRate30d * 10) / 10,
    suspended: suspendedCountQuery[0]?.count ?? 0,
    terminated: terminatedCountQuery[0]?.count ?? 0,
    tierBreakdown,
  });
}

export async function getAnalyticsGrowth(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const days = Number(req.query.days || "30");
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const signups = await db
    .select({
      date: sql<string>`to_char(${user.createdAt}, 'YYYY-MM-DD')`,
      tier: user.tier,
      count: sql<number>`count(*)::int`,
    })
    .from(user)
    .where(sql`${user.createdAt} >= ${startDate.toISOString()}`)
    .groupBy(sql`to_char(${user.createdAt}, 'YYYY-MM-DD')`, user.tier)
    .orderBy(sql`to_char(${user.createdAt}, 'YYYY-MM-DD') ASC`);

  return res.json({ signups });
}

export async function getAnalyticsChurn(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const [churnReasons, churnBySource, churnByTier] = await Promise.all([
    db.select({
      reason: user.cancellationReason,
      count: sql<number>`count(*)::int`,
    }).from(user).where(eq(user.status, "cancelled")).groupBy(user.cancellationReason),
    db.select({
      isReferred: sql<string>`case when ${user.referralId} is not null then 'referred' else 'direct' end`,
      count: sql<number>`count(*)::int`,
      cancelled: sql<number>`count(case when ${user.status} = 'cancelled' then 1 else null end)::int`,
    }).from(user).groupBy(sql`case when ${user.referralId} is not null then 'referred' else 'direct' end`),
    db.select({
      tier: user.tier,
      active: sql<number>`count(case when ${user.status} = 'active' then 1 else null end)::int`,
      cancelled: sql<number>`count(case when ${user.status} = 'cancelled' then 1 else null end)::int`,
    }).from(user).groupBy(user.tier),
  ]);

  return res.json({
    churnReasons: churnReasons.map((r) => ({
      reason: r.reason || "Unspecified",
      count: r.count,
    })),
    churnBySource,
    churnByTier,
  });
}

export async function getAnalyticsAtRisk(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      tier: user.tier,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      riskSignal: sql<string>`
        case
          when ${user.lastLoginAt} < now() - interval '30 days' then 'Inactivity (30d+)'
          when ${user.tier} = 'basic' and ${user.createdAt} < now() - interval '90 days' and (select count(*) from referral_conversions where referrer_id = "user".id) = 0 then 'Zero referrals (90d)'
          else 'Stripe Collection Risk'
        end
      `,
    })
    .from(user)
    .where(
      and(
        eq(user.status, "active"),
        sql`(${user.lastLoginAt} < now() - interval '30 days' OR (${user.tier} = 'basic' AND ${user.createdAt} < now() - interval '90 days' AND (select count(*) from referral_conversions where referrer_id = "user".id) = 0))`
      )
    )
    .orderBy(user.lastLoginAt)
    .limit(50);

  return res.json({
    atRisk: rows.map((r) => ({
      ...r,
      lastLoginAt: r.lastLoginAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function getAnalyticsRevenue(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const [revenueStats, commissionStats, signupFeeQuery] = await Promise.all([
    db.select({
      mrr: sql<number>`sum(
        case 
          when tier = 'regular' then 5.00
          when tier = 'premium' then 15.00
          when tier = 'organization' then 15.00
          when tier = 'small_vendor' then 35.00
          else 0
        end
      )::float`
    }).from(user).where(eq(user.status, "active")),
    db.select({ amount: sql<number>`sum(${commissions.amount})::float` }).from(commissions).where(sql`${commissions.createdAt} >= date_trunc('month', now())`),
    db.select({ sum: sql<number>`count(*)::int` }).from(user).where(and(sql`${user.createdAt} >= date_trunc('month', now())`, sql`tier IN ('premium', 'small_vendor', 'premium_vendor')`)),
  ]);

  const grossMRR = revenueStats[0]?.mrr ?? 0;
  const commissionsThisMonth = commissionStats[0]?.amount ?? 0;
  const signupFeesThisMonth = (signupFeeQuery[0]?.sum ?? 0) * 25;

  const netMRR = Math.max(0, grossMRR - commissionsThisMonth);
  const payoutRatio = grossMRR > 0 ? (commissionsThisMonth / grossMRR) * 100 : 0;

  const alerts = [];
  if (payoutRatio > 45) {
    alerts.push({
      level: "critical",
      message: `Commission Payout Ratio is critical: ${payoutRatio.toFixed(1)}% (exceeds 45% safety threshold).`,
    });
  } else if (payoutRatio > 40) {
    alerts.push({
      level: "warning",
      message: `Commission Payout Ratio is elevated: ${payoutRatio.toFixed(1)}% (approaching 45% threshold).`,
    });
  }

  return res.json({
    grossMRR,
    netMRR,
    signupFeesThisMonth,
    commissionsThisMonth,
    payoutRatio: Math.round(payoutRatio * 10) / 10,
    alerts,
  });
}

export async function getAnalyticsAffiliates(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const leaderboard = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      tier: user.tier,
      referralCount: sql<number>`(select count(*)::int from referral_conversions where referrer_id = "user".id)`,
      activeCount: sql<number>`(select count(*)::int from referral_conversions rc join "user" u on rc.referred_user_id = u.id where rc.referrer_id = "user".id and u.status = 'active')`,
      churnedCount: sql<number>`(select count(*)::int from referral_conversions rc join "user" u on rc.referred_user_id = u.id where rc.referrer_id = "user".id and u.status = 'cancelled')`,
    })
    .from(user)
    .where(sql`(select count(*) from referral_conversions where referrer_id = "user".id) > 0`)
    .orderBy(sql`5 DESC`)
    .limit(20);

  const flaggedAffiliates = leaderboard
    .map((aff) => {
      const churnRate = aff.referralCount > 0 ? (aff.churnedCount / aff.referralCount) * 100 : 0;
      return {
        ...aff,
        churnRate: Math.round(churnRate * 10) / 10,
      };
    })
    .filter((aff) => aff.churnRate > 30 && aff.referralCount >= 3);

  const fraudSignals = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      referralsCount24h: sql<number>`count(*)::int`,
    })
    .from(referralConversions)
    .innerJoin(user, eq(referralConversions.referrerId, user.id))
    .where(sql`${referralConversions.signedUpAt} >= now() - interval '24 hours'`)
    .groupBy(user.id)
    .having(sql`count(*) >= 10`);

  return res.json({
    leaderboard: leaderboard.map((l) => ({
      ...l,
      churnRate: l.referralCount > 0 ? Math.round((l.churnedCount / l.referralCount) * 100) : 0,
    })),
    flaggedAffiliates,
    fraudSignals,
  });
}

export async function getAnalyticsOrgs(req: Request, res: Response) {
  const session = requireRole(req, res, ["admin"]);
  if (!session) return;

  const orgsList = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      memberCount: sql<number>`(select count(*)::int from referral_conversions where referrer_id = "user".id)`,
      earnings: sql<number>`(select coalesce(sum(${commissions.amount}), 0)::float from commissions where user_id = "user".id)`,
    })
    .from(user)
    .where(eq(user.tier, "organization"))
    .orderBy(desc(sql`5`));

  const donationQueue = orgsList
    .filter((org) => org.memberCount >= 5)
    .map((org) => ({
      ...org,
      donationAmount: Math.round(org.earnings * 0.10 * 100) / 100,
    }));

  return res.json({
    orgs: orgsList,
    donationQueue,
  });
}

export async function exportAnalyticsData(req: Request, res: Response) {
  const session = requireRole(req, res, ["super_admin"]);
  if (!session) return;

  const { dataset } = req.query;

  let headers = "";
  let csvContent = "";

  if (dataset === "users") {
    headers = "ID,Name,Email,Role,Tier,Status,Joined Date\n";
    const rows = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tier: user.tier,
      status: user.status,
      createdAt: user.createdAt,
    }).from(user);
    
    csvContent = rows.map((r) => 
      `"${r.id}","${r.name}","${r.email}","${r.role}","${r.tier}","${r.status}","${r.createdAt.toISOString()}"`
    ).join("\n");
  } else if (dataset === "audit-log") {
    headers = "ID,Admin ID,Admin Role,Target User ID,Action,Previous Status,New Status,Reason,Timestamp\n";
    const rows = await db.select().from(auditLog).orderBy(desc(auditLog.createdAt));
    csvContent = rows.map((r) => 
      `"${r.id}","${r.adminId}","${r.adminRole}","${r.targetUserId}","${r.action}","${r.previousStatus || ""}","${r.newStatus || ""}","${r.reason}","${r.createdAt.toISOString()}"`
    ).join("\n");
  } else {
    headers = "Export Date,Active Users,MRR\n";
    const [activeUsersQuery] = await db.select({ count: sql<number>`count(*)::int` }).from(user).where(eq(user.status, "active"));
    const activeUsers = activeUsersQuery?.count ?? 0;
    csvContent = `"${new Date().toISOString()}",${activeUsers},0\n`;
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=polokaz-${dataset || "export"}-${Date.now()}.csv`);
  return res.send(headers + csvContent);
}

