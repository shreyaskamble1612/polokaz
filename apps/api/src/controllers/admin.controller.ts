import { and, db, deal, desc, eq, merchants, redemptions, sql, user } from "@polokaz/db";
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

  if (!session) {
    return;
  }

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

  const rows = await db
    .select({
      id: deal.id,
      title: deal.title,
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
    .groupBy(deal.id, merchants.businessName, user.email)
    .orderBy(desc(deal.createdAt));

  return res.json({
    deals: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
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
    await coupontools.activateCampaign(existingDeal.coupontoolsId);
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
