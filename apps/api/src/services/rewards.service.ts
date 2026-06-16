import { db, pointsLedger, commissions, user, eq, referralConversions, redemptions, sql, adminSettings, and } from "@polokaz/db";

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

export async function getAdminSettings() {
  let [settings] = await db.select().from(adminSettings).where(eq(adminSettings.id, "default")).limit(1);
  if (!settings) {
    try {
      [settings] = await db
        .insert(adminSettings)
        .values({ id: "default" })
        .returning();
    } catch (e) {
      [settings] = await db.select().from(adminSettings).where(eq(adminSettings.id, "default")).limit(1);
    }
  }
  return settings;
}

export async function getActiveReferralCount(referrerId: string): Promise<number> {
  const [result] = await db
    .select({
      count: sql<number>`count(distinct ${referralConversions.referredUserId})::int`
    })
    .from(referralConversions)
    .innerJoin(user, eq(referralConversions.referredUserId, user.id))
    .where(
      and(
        eq(referralConversions.referrerId, referrerId),
        eq(user.banned, false)
      )
    );
  return result?.count ?? 0;
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

  // 2. Check referral qualification (minimum 5 active referrals)
  const activeReferralCount = await getActiveReferralCount(event.userId);
  const settings = await getAdminSettings();
  const isQualified = activeReferralCount >= settings.referralQualificationLimit;

  // If qualified: grant commission
  if (isQualified) {
    rewardResult = await grantCommission(userData, event, activeReferralCount, settings);
  }
  // Else if tier is 'free' or 'basic' or 'regular' or 'premium' (not qualified): grant points
  else if (tier !== "merchant" && tier !== "premium_vendor" && tier !== "small_vendor") {
    rewardResult = await grantPoints(userData, event);
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
  let multiplier = 1.0;
  if (userData.tier === "premium" || userData.tier === "gold") {
    multiplier = 2.0;
  } else if (userData.tier === "regular") {
    multiplier = 1.5;
  }
  const pointsValue = Math.round(basePoints * multiplier);

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
  event: RewardEvent,
  activeReferrals: number,
  settings: any
): Promise<{ commissionEarned: number }> {
  // Determine commission amount: event.amount ?? COMMISSION_CONFIG[event.type]
  let amountValue: number = 0;

  if (event.type === "referral_subscription" && event.amount !== undefined) {
    // If the event override amount is passed (which is calculated from transaction total percentage), use it
    amountValue = event.amount;
  } else if (event.type === "referral_subscription") {
    // Fallback: calculate using referred subscription price (e.g. Regular $5.00, Premium $15.00)
    // Assume basic gold tier equivalent as default or gold price ($5.00)
    const baseSubscriptionPrice = 5.00;
    
    // Find percentage
    let percentage = 0;
    const tiers = settings.referralTiers || [];
    for (const tier of tiers) {
      if (activeReferrals >= tier.minReferrals && (tier.maxReferrals === null || activeReferrals <= tier.maxReferrals)) {
        percentage = tier.commissionPercentage;
        break;
      }
    }
    amountValue = baseSubscriptionPrice * (percentage / 100);
  } else {
    // For signup or redemption, use the configuration values
    if (event.amount !== undefined) {
      amountValue = event.amount;
    } else {
      const configVal = COMMISSION_CONFIG[event.type as keyof typeof COMMISSION_CONFIG];
      if (typeof configVal === "number") {
        amountValue = configVal;
      } else if (typeof configVal === "object" && configVal !== null) {
        amountValue = configVal.basic; 
      }
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

