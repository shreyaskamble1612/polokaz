import { db, eq, and, user, pointsLedger, commissions, referralConversions, sql } from "@polokaz/db";
import { auth } from "@polokaz/auth";
import { Request, Response } from "express";
import { requireSession } from "../lib/authorization";
import { z } from "zod";

const profileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  birthdate: z.string().optional(),
  countryName: z.string().min(2).optional(),
});

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8),
});

export async function getProfile(req: Request, res: Response) {
  const session = requireSession(req, res);
  if (!session) return;

  const [currentUser] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tier: user.tier,
      birthdate: user.birthdate,
      countryName: user.countryName,
      image: user.image,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!currentUser) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "User profile not found" },
    });
  }

  return res.json({
    user: {
      ...currentUser,
      birthdate: currentUser.birthdate?.toISOString() ?? null,
      createdAt: currentUser.createdAt.toISOString(),
    },
  });
}

export async function updateProfile(req: Request, res: Response) {
  const session = requireSession(req, res);
  if (!session) return;

  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "INVALID_REQUEST", message: "Invalid profile update payload" },
    });
  }

  const { name, birthdate, countryName } = parsed.data;

  const updates: Record<string, any> = {};
  if (name) updates.name = name;
  if (birthdate) updates.birthdate = new Date(birthdate);
  if (countryName) updates.countryName = countryName;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      error: { code: "INVALID_REQUEST", message: "No fields provided to update" },
    });
  }

  const [updatedUser] = await db
    .update(user)
    .set(updates)
    .where(eq(user.id, session.user.id))
    .returning();

  return res.json({ user: updatedUser });
}

export async function updatePassword(req: Request, res: Response) {
  const session = requireSession(req, res);
  if (!session) return;

  const parsed = passwordUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "INVALID_REQUEST", message: "Invalid password update payload" },
    });
  }

  try {
    // Call Better Auth to verify and change the password
    await auth.api.changePassword({
      headers: req.headers,
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      },
    });

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(400).json({
      error: { code: "PASSWORD_UPDATE_FAILED", message: error.message || "Failed to update password" },
    });
  }
}

export async function getPoints(req: Request, res: Response) {
  const session = requireSession(req, res);
  if (!session) return;

  const [sumQuery] = await db
    .select({ balance: sql<number>`sum(${pointsLedger.points})::int` })
    .from(pointsLedger)
    .where(eq(pointsLedger.userId, session.user.id));

  const balance = sumQuery?.balance ?? 0;

  const history = await db
    .select()
    .from(pointsLedger)
    .where(eq(pointsLedger.userId, session.user.id))
    .orderBy(sql`${pointsLedger.createdAt} DESC`)
    .limit(20);

  return res.json({
    balance,
    history: history.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
  });
}

export async function getAffiliateStats(req: Request, res: Response) {
  const session = requireSession(req, res);
  if (!session) return;

  const [userData] = await db
    .select({ tier: user.tier })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (userData?.tier !== "gold") {
    return res.status(403).json({
      error: { code: "FORBIDDEN", message: "Gold tier is required for affiliate statistics" },
    });
  }

  const [earnedQuery] = await db
    .select({ sum: sql<number>`sum(${commissions.amount})::float` })
    .from(commissions)
    .where(and(eq(commissions.userId, session.user.id), eq(commissions.status, "paid")));

  const [pendingQuery] = await db
    .select({ sum: sql<number>`sum(${commissions.amount})::float` })
    .from(commissions)
    .where(and(eq(commissions.userId, session.user.id), eq(commissions.status, "pending")));

  const [referralsQuery] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(referralConversions)
    .where(eq(referralConversions.referrerId, session.user.id));

  const history = await db
    .select()
    .from(commissions)
    .where(eq(commissions.userId, session.user.id))
    .orderBy(sql`${commissions.createdAt} DESC`)
    .limit(20);

  return res.json({
    totalEarned: earnedQuery?.sum ?? 0,
    pending: pendingQuery?.sum ?? 0,
    totalReferrals: referralsQuery?.count ?? 0,
    commissions: history.map((row) => ({
      ...row,
      amount: Number(row.amount),
      createdAt: row.createdAt.toISOString(),
      paidAt: row.paidAt?.toISOString() ?? null,
    })),
  });
}

export async function requestPayout(req: Request, res: Response) {
  const session = requireSession(req, res);
  if (!session) return;

  const [userData] = await db
    .select({ tier: user.tier })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (userData?.tier !== "gold") {
    return res.status(403).json({
      error: { code: "FORBIDDEN", message: "Gold tier is required to request payouts" },
    });
  }

  // Under real implementation, this might mark commissions as 'requested' or notify admins.
  // For now, return the confirmation message.
  return res.json({
    success: true,
    message: "Payout request received. Processed within 5 business days.",
  });
}
