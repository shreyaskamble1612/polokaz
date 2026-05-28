import express from "express";
import { ReferralsService } from "../services/referrals";
import { db, eq, referral, referralUse, referralConversions, pointsLedger, and, sql } from "@polokaz/db";

const router = express.Router();

// Retrieve/create referral code/link for current user
router.get("/my-link", async (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
  }

  const userId = req.session.user.id;

  // 1. Check if user already has a referral link
  let [userReferral] = await db
    .select()
    .from(referral)
    .where(eq(referral.createdBy, userId))
    .limit(1);

  // 2. If not, create one
  if (!userReferral) {
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    [userReferral] = await db
      .insert(referral)
      .values({
        maxUses: 100,
        expiresAt: oneYearFromNow,
        createdBy: userId,
      })
      .returning();
  }

  const referralId = userReferral.id;

  // 3. Gather stats
  // Clicks: count of referralUse rows where referralId matches
  const [clicksQuery] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(referralUse)
    .where(eq(referralUse.referralId, referralId));
  const clicks = clicksQuery?.count ?? 0;

  // Conversions: count of referralConversions where referrerId = me
  const [conversionsQuery] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(referralConversions)
    .where(eq(referralConversions.referrerId, userId));
  const conversions = conversionsQuery?.count ?? 0;

  // Points earned: sum from pointsLedger where userId = me and reason in ('referral_signup', 'referral_redemption')
  const [pointsQuery] = await db
    .select({ sum: sql<number>`sum(${pointsLedger.points})::int` })
    .from(pointsLedger)
    .where(
      and(
        eq(pointsLedger.userId, userId),
        sql`${pointsLedger.reason} IN ('referral_signup', 'referral_redemption')`
      )
    );
  const pointsEarned = pointsQuery?.sum ?? 0;

  const link = userReferral.trackdeskUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/join?ref=${referralId}`;

  return res.json({
    code: referralId,
    link,
    stats: {
      clicks,
      conversions,
      pointsEarned,
    },
  });
});

// Validate referral code (Public endpoint)
router.get("/validate/:code", async (req, res) => {
  const code = req.params.code?.trim();

  if (!code) {
    return res.status(400).json({ valid: false });
  }

  const [record] = await db
    .select()
    .from(referral)
    .where(eq(referral.id, code))
    .limit(1);

  if (!record) {
    return res.json({ valid: false });
  }

  // Check expiry
  if (record.expiresAt && record.expiresAt.getTime() < Date.now()) {
    return res.json({ valid: false });
  }

  // Check max uses
  const [usesQuery] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(referralUse)
    .where(eq(referralUse.referralId, code));

  const uses = usesQuery?.count ?? 0;
  if (record.maxUses && record.maxUses <= uses) {
    return res.json({ valid: false });
  }

  return res.json({ valid: true, referralCode: code });
});

// Existing routes
router.get("/", async (req, res) => {
  const service = new ReferralsService({
    session: req.session!,
  });

  const referrals = await service.getAll();

  return res.json({ referrals });
});

router.post("/", async (req, res) => {
  const service = new ReferralsService({
    session: req.session!,
  });

  const [referral] = await service.createOne(req.body);

  return res.json({ referral });
});

export { router as referralRouter };
