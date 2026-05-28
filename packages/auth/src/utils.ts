import { db, eq, referral, referralUse, referralConversions, user, commissions, pointsLedger } from "@polokaz/db";

export const getReferral = async (referralId: string) => {
  return await db.query.referral.findFirst({
    where: eq(referral.id, referralId),
    with: {
      referralUse: true,
    },
  });
};

export const consumeReferral = async (
  referralId: string,
  userId: string,
  trackdeskClickId?: string,
) => {
  // 1. Get referral details to identify the referrer
  const referralData = await db.query.referral.findFirst({
    where: eq(referral.id, referralId),
  });

  // 2. Record the referral usage
  const [useRecord] = await db
    .insert(referralUse)
    .values({
      referralId,
      usedBy: userId,
      trackdeskClickId: trackdeskClickId || null,
      trackdeskStatus: trackdeskClickId ? "pending" : null,
    })
    .returning();

  if (referralData) {
    const referrerId = referralData.createdBy;

    // 3. Create a conversion record
    const [conversion] = await db
      .insert(referralConversions)
      .values({
        referrerId,
        referredUserId: userId,
        rewardGranted: true,
      })
      .returning();

    if (conversion) {
      // 4. Retrieve referrer's tier to determine the reward type
      const [referrerInfo] = await db
        .select({ tier: user.tier })
        .from(user)
        .where(eq(user.id, referrerId))
        .limit(1);

      const referrerTier = referrerInfo?.tier || "free";

      if (referrerTier === "gold") {
        // Gold referrers earn a $5 cash commission
        await db.insert(commissions).values({
          userId: referrerId,
          amount: "5.00",
          currency: "USD",
          status: "pending",
          reason: "referral_signup",
          referenceId: conversion.id,
        });
      } else {
        // Free/Basic referrers earn points (200 base, with a 2x multiplier for Basic tier)
        const basePoints = 200;
        const multiplier = referrerTier === "basic" ? 2 : 1;
        const points = basePoints * multiplier;

        await db.insert(pointsLedger).values({
          userId: referrerId,
          points,
          reason: "referral_signup",
          referenceId: conversion.id,
        });
      }
    }
  }

  return [useRecord];
};

