import { db, eq, user } from "@polokaz/db";
import { Request, Response } from "express";
import { requireSession } from "../lib/authorization";

export async function getMyTier(req: Request, res: Response) {
  const session = requireSession(req, res);
  if (!session) return;

  const [currentUser] = await db
    .select({
      tier: user.tier,
      stripeSubscriptionId: user.stripeSubscriptionId,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!currentUser) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "User not found" },
    });
  }

  return res.json({
    tier: currentUser.tier,
    stripeSubscriptionId: currentUser.stripeSubscriptionId ?? null,
  });
}

export async function upgradeTier(req: Request, res: Response) {
  const session = requireSession(req, res);
  if (!session) return;

  const { tier } = req.body;

  if (!tier || !["free", "basic", "gold", "merchant"].includes(tier)) {
    return res.status(400).json({
      error: { code: "INVALID_REQUEST", message: "Invalid tier specified" },
    });
  }

  const updates: Record<string, any> = { tier, hasSelectedPlan: true };
  if (session.user.role !== "admin") {
    updates.role = tier === "merchant" ? "merchant" : "member";
  }

  await db
    .update(user)
    .set(updates)
    .where(eq(user.id, session.user.id));

  return res.json({ success: true, tier });
}
