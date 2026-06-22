import express from "express";
import crypto from "crypto";
import { ReferralsService } from "../services/referrals";
import { TrackdeskService } from "../services/trackdesk.service";
import { db, eq, referral, referralUse, referralConversions, pointsLedger, and, sql, referralClicks, user } from "@polokaz/db";

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

  // 2.5 Ensure Trackdesk tracking URL is generated if missing
  if (!userReferral.trackdeskUrl) {
    try {
      const trackdeskService = new TrackdeskService();
      const destinationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign-up/onboarding?referralId=${userReferral.id}`;
      
      const [dbUserRecord] = await db
        .select({ trackdeskAffiliateId: user.trackdeskAffiliateId })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      let affiliateId = dbUserRecord?.trackdeskAffiliateId;

      if (!affiliateId) {
        // Register affiliate on the fly
        const userEmail = req.session.user.email;
        const userName = req.session.user.name || "Polokaz User";
        affiliateId = await trackdeskService.registerAffiliate({
          id: userId,
          email: userEmail,
          name: userName,
        }) || undefined;
      }

      if (affiliateId) {
        const trackdeskUrl = await trackdeskService.createTrackingLink(
          destinationUrl,
          affiliateId
        );

        if (trackdeskUrl) {
          const [updatedReferral] = await db
            .update(referral)
            .set({ trackdeskUrl })
            .where(eq(referral.id, userReferral.id))
            .returning();
          userReferral = updatedReferral;
        }
      }
    } catch (err) {
      console.error("Failed to generate Trackdesk link in my-link endpoint:", err);
    }
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

// Click referral link (Public endpoint)
router.get("/click", async (req, res) => {
  const ref = (req.query.ref as string)?.trim();

  if (!ref) {
    return res.status(400).json({
      error: { code: "BAD_REQUEST", message: "Referral code 'ref' is required" },
    });
  }

  try {
    // 1. Look up referral by code
    const [record] = await db
      .select()
      .from(referral)
      .where(eq(referral.id, ref))
      .limit(1);

    if (!record) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Referral code not found" },
      });
    }

    // 2. Validate expiry
    if (record.expiresAt && record.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({
        error: { code: "EXPIRED", message: "Referral code has expired" },
      });
    }

    // 3. Check max uses
    const [usesQuery] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(referralUse)
      .where(eq(referralUse.referralId, ref));

    const uses = usesQuery?.count ?? 0;
    if (record.maxUses && record.maxUses <= uses) {
      return res.status(400).json({
        error: { code: "LIMIT_EXCEEDED", message: "Referral link usage limit exceeded" },
      });
    }

    // 4. Save the click (insert into referralClicks)
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const ipAddressHash = crypto.createHash("sha256").update(ip).digest("hex");

    await db.insert(referralClicks).values({
      referralCode: ref,
      ipAddressHash,
    });

    // 5. Fire-and-forget Trackdesk click trigger if the creator has trackdeskAffiliateId
    const [referrerUser] = await db
      .select({ trackdeskAffiliateId: user.trackdeskAffiliateId })
      .from(user)
      .where(eq(user.id, record.createdBy))
      .limit(1);

    if (referrerUser?.trackdeskAffiliateId) {
      const userAgent = req.headers["user-agent"] || "";
      const trackdeskService = new TrackdeskService();
      trackdeskService
        .logClick(ref, referrerUser.trackdeskAffiliateId, ip, userAgent)
        .catch((err) => {
          console.error("Failed to log click to Trackdesk:", err);
        });
    }

    return res.json({
      valid: true,
      referralCode: ref,
    });
  } catch (err: any) {
    console.error("Error in referral click endpoint:", err);
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
  }
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
