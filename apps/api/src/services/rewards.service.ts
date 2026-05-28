import { db, pointsLedger, commissions, user, eq, referralConversions } from "@polokaz/db";

// Points config
export const POINTS_CONFIG = {
  deal_redemption: 50,     // free/basic: 50pts; basic: 100pts (2×); gold: 150pts (3×)
  referral_signup: 200,
  referral_redemption: 25,
};

// Commission config (Gold tier only)
export const COMMISSION_CONFIG = {
  referral_signup: "5.00",
  referral_redemption: "0.50",
  referral_subscription: "10.00", // placeholder
};

export async function dispatchReward(event: {
  type: "deal_redemption" | "referral_signup" | "referral_redemption";
  userId: string;        // who gets the reward
  referenceId: string;   // redemption or referral_conversion ID
}): Promise<{ pointsEarned?: number; commissionEarned?: number }> {
  // 1. Get user tier from DB
  const [userData] = await db
    .select({ tier: user.tier })
    .from(user)
    .where(eq(user.id, event.userId))
    .limit(1);

  const tier = userData?.tier || "free";

  // 2. If tier === 'gold': INSERT into commissions table (pending status)
  if (tier === "gold" && event.type !== "deal_redemption") {
    const amountStr = COMMISSION_CONFIG[event.type];
    if (amountStr) {
      await db.insert(commissions).values({
        userId: event.userId,
        amount: amountStr,
        currency: "USD",
        status: "pending",
        reason: event.type,
        referenceId: event.referenceId,
      });

      return { commissionEarned: Number(amountStr) };
    }
  }

  // 3. If tier === 'free' or 'basic':
  // Calculate points: base × tier multiplier (free/basic=1×, basic=2×, gold=3×)
  const basePoints = POINTS_CONFIG[event.type] || 0;
  const multiplier = tier === "basic" ? 2 : tier === "gold" ? 3 : 1;
  const points = basePoints * multiplier;

  await db.insert(pointsLedger).values({
    userId: event.userId,
    points,
    reason: event.type,
    referenceId: event.referenceId,
  });

  return { pointsEarned: points };
}
