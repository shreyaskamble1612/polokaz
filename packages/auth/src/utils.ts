import { db, eq, referral, referralUse } from "@polokaz/db";

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
  return await db
    .insert(referralUse)
    .values({
      referralId,
      usedBy: userId,
      trackdeskClickId: trackdeskClickId || null,
      trackdeskStatus: trackdeskClickId ? "pending" : null,
    })
    .returning();
};
