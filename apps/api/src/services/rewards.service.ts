import { db, pointsLedger, commissions, user, eq, referralConversions, redemptions, sql } from "@polokaz/db";

// REWARD CONFIG (top of file, easy to tweak):
const POINTS_CONFIG = {
  deal_redemption: 50,
  referral_signup: 200,
  referral_redemption: 25,
  referral_subscription: 100, // default fallback points value
};

const COMMISSION_CONFIG = {
  referral_signup: 5.00,
  referral_redemption: 0.50,
  referral_subscription: { basic: 1.00, gold: 2.50, merchant: 5.00 }
};

export interface RewardEvent {
  type: 'deal_redemption' | 'referral_signup' | 'referral_redemption' | 'referral_subscription';
  userId: string;        // who gets the reward
  referenceId: string;   // the ID of the redemption/referral that triggered it
  amount?: number;       // override for subscription commissions
}

/**
 * Main function: dispatchReward
 */
export async function dispatchReward(event: RewardEvent): Promise<{ pointsEarned?: number; commissionEarned?: number }> {
  // 1. Fetch user from DB including their tier
  const [userData] = await db
    .select({ id: user.id, tier: user.tier })
    .from(user)
    .where(eq(user.id, event.userId))
    .limit(1);

  if (!userData) {
    throw new Error(`User not found: ${event.userId}`);
  }

  const tier = userData.tier || "free";
  let rewardResult: { pointsEarned?: number; commissionEarned?: number } = {};

  // 2. If user.tier === 'gold': call grantCommission(user, event)
  if (tier === "gold") {
    rewardResult = await grantCommission(userData, event);
  }
  // 3. Else if tier is 'free' or 'basic': call grantPoints(user, event)
  else if (tier === "free" || tier === "basic") {
    rewardResult = await grantPoints(userData, event);
  }
  // 4. Else if tier is 'merchant': skip (merchants don't earn consumer rewards)
  else if (tier === "merchant") {
    console.log(`Skipping reward dispatch for merchant user: ${event.userId}`);
    return {};
  }

  // 5. Mark the source record as reward-dispatched:
  // - If event.type === 'deal_redemption': UPDATE redemptions SET rewardDispatched=true WHERE id = event.referenceId
  if (event.type === 'deal_redemption') {
    await db
      .update(redemptions)
      .set({ rewardDispatched: true })
      .where(eq(redemptions.id, event.referenceId));
  }
  // - If event.type starts with 'referral': UPDATE referral_conversions SET rewardGranted=true WHERE id = event.referenceId
  else if (event.type.startsWith('referral')) {
    await db
      .update(referralConversions)
      .set({ rewardGranted: true })
      .where(eq(referralConversions.id, event.referenceId));
  }

  return rewardResult;
}

/**
 * Function: grantPoints
 */
async function grantPoints(
  userData: { id: string; tier: string },
  event: RewardEvent
): Promise<{ pointsEarned: number }> {
  // Look up points value from POINTS_CONFIG[event.type]
  const basePoints = POINTS_CONFIG[event.type as keyof typeof POINTS_CONFIG] || 0;
  const multiplier = userData.tier === "basic" ? 2 : 1;
  const pointsValue = basePoints * multiplier;

  const ledgerReason = event.type === "referral_subscription" ? "referral_redemption" : event.type;

  // INSERT into points_ledger
  await db.insert(pointsLedger).values({
    userId: userData.id,
    points: pointsValue,
    reason: ledgerReason as any,
    referenceId: event.referenceId,
  });

  // Compute new balance: SELECT SUM(points) FROM points_ledger WHERE userId = user.id
  const [sumQuery] = await db
    .select({ balance: sql<number>`sum(${pointsLedger.points})::int` })
    .from(pointsLedger)
    .where(eq(pointsLedger.userId, userData.id));

  const newBalance = sumQuery?.balance ?? 0;
  console.log(`New points balance for user ${userData.id}: ${newBalance}`);

  return { pointsEarned: pointsValue };
}

/**
 * Function: grantCommission
 */
async function grantCommission(
  userData: { id: string; tier: string },
  event: RewardEvent
): Promise<{ commissionEarned: number }> {
  // Determine commission amount: event.amount ?? COMMISSION_CONFIG[event.type]
  let amountValue: number = 0;

  if (event.amount !== undefined) {
    amountValue = event.amount;
  } else {
    const configVal = COMMISSION_CONFIG[event.type as keyof typeof COMMISSION_CONFIG];
    if (typeof configVal === "number") {
      amountValue = configVal;
    } else if (typeof configVal === "object" && configVal !== null) {
      // It's referral_subscription config: { basic: 1.00, gold: 2.50, merchant: 5.00 }
      amountValue = configVal.basic; 
    }
  }

  const amountStr = amountValue.toFixed(2);

  // INSERT into commissions
  await db.insert(commissions).values({
    userId: userData.id,
    amount: amountStr,
    currency: "USD",
    status: "pending",
    reason: event.type as any,
    referenceId: event.referenceId,
  });

  return { commissionEarned: amountValue };
}
