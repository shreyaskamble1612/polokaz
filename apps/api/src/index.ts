import express from "express";
import { authHandler, onSignUpCallbacks } from "@polokaz/auth";
import cors from "cors";
import authenticate from "./middleware/authenticate";
import { createLogger, useLogger } from "./logger";
import morgan from "morgan";
import { referralRouter } from "./controllers/referrals";
import { trackdeskRouter } from "./controllers/trackdesk";
import { usersRouter } from "./controllers/users";
import { adminRouter } from "./routes/admin.routes";
import { merchantApplicationsRouter } from "./routes/merchant-applications.routes";
import { dealsRouter } from "./routes/deals.routes";
import { merchantsRouter } from "./routes/merchants.routes";
import { stripeRouter } from "./routes/stripe.routes";
import { webhooksRouter } from "./routes/webhooks.routes";
import { walletRouter } from "./routes/wallet.routes";
import { plansRouter } from "./routes/plans.routes";
import { meRouter } from "./routes/me.routes";
import { merchantRouter } from "./controllers/merchant";
import { trackdeskWebhookRouter } from "./controllers/webhooks/trackdesk";
import { stripeWebhookRouter } from "./routes/stripe-webhook.routes";
import "./cron/deal-sync.cron";
import "dotenv/config";
import fs from "fs";

createLogger();

const logger = useLogger();

import { TrackdeskService } from "./services/trackdesk";
import { dispatchReward, getActiveReferralCount, getAdminSettings } from "./services/rewards.service";

import {
  db,
  eq,
  and,
  desc,
  referral,
  referralUse,
  referralClicks,
  referralConversions,
  user as dbUser,
  merchants,
} from "@polokaz/db";
import { CoupontoolsService } from "./services/coupontools.service";

// Register the signup callback
onSignUpCallbacks.push(async (newUser, body) => {
  const trackdeskService = new TrackdeskService();

  // If registering as a merchant, onboard them automatically on the backend
  if (body?.companyName) {
    try {
      let coupontoolsMerchantId = null;
      try {
        const coupontools = new CoupontoolsService();
        const createdMerchant = await coupontools.createMerchantAccount({
          businessName: body.companyName,
          contactEmail: body.companyEmail || newUser.email,
        });
        coupontoolsMerchantId = createdMerchant.coupontoolsMerchantId;
      } catch (err) {
        console.warn("Failed to create Coupontools merchant account in signup hook:", err);
      }

      // Ensure user role is updated to merchant
      await db
        .update(dbUser)
        .set({ role: "merchant", tier: "merchant" })
        .where(eq(dbUser.id, newUser.id));

      // Insert merchant profile
      await db.insert(merchants).values({
        userId: newUser.id,
        businessName: body.companyName,
        businessCategory: body.businessType,
        contactEmail: body.companyEmail || newUser.email,
        website: body.companyWebsite || null,
        coupontoolsMerchantId,
        status: "active",
      });
      console.log(`[Merchant Onboarding Hook] Successfully onboarded merchant ${body.companyName} for user ${newUser.id}`);
    } catch (err) {
      console.error("Failed to onboard merchant inside signup callback:", err);
    }
  }

  // 1. Register new user as a Trackdesk affiliate (non-blocking, fire-and-forget)
  setImmediate(() => {
    trackdeskService.registerAffiliate({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    }).catch(err => {
      console.error("Failed to register Trackdesk affiliate:", err);
    });
  });

  // 2. Check if they have a referral code (from signup request body as referralCode / referralId)
  const referralCode = body?.referralCode || body?.referralId;
  const trackdeskClickId = body?.trackdeskClickId;

  if (referralCode) {
    try {
      // a. Look up the referral: SELECT * FROM referral WHERE id = referralCode
      const [record] = await db
        .select()
        .from(referral)
        .where(eq(referral.id, referralCode))
        .limit(1);

      if (record) {
        // b. Get referrer: SELECT * FROM user WHERE id = referral.createdBy
        const [referrer] = await db
          .select()
          .from(dbUser)
          .where(eq(dbUser.id, record.createdBy))
          .limit(1);

        if (referrer) {
          // Compatibility: insert into referralUse
          await db
            .insert(referralUse)
            .values({
              referralId: record.id,
              usedBy: newUser.id,
              trackdeskClickId: trackdeskClickId || null,
              trackdeskStatus: trackdeskClickId ? "pending" : null,
            });

          // c. Insert into referral_conversions: { referrerId: referrer.id, referredUserId: newUser.id }
          const [newConversion] = await db
            .insert(referralConversions)
            .values({
              referrerId: referrer.id,
              referredUserId: newUser.id,
              rewardGranted: true,
            })
            .returning();

          if (newConversion) {
            // d. Mark referral_clicks as converted: UPDATE referral_clicks SET converted=true WHERE referralCode=code (latest unconverted click)
            const [latestClick] = await db
              .select()
              .from(referralClicks)
              .where(
                and(
                  eq(referralClicks.referralCode, referralCode),
                  eq(referralClicks.converted, false)
                )
              )
              .orderBy(desc(referralClicks.clickedAt))
              .limit(1);

            if (latestClick) {
              await db
                .update(referralClicks)
                .set({ converted: true })
                .where(eq(referralClicks.id, latestClick.id));
            }

            // e. Non-blocking: call rewardService.dispatchReward({ type: 'referral_signup', userId: referrer.id, referenceId: newConversion.id })
            setImmediate(() => {
              dispatchReward({
                type: "referral_signup",
                userId: referrer.id,
                referenceId: newConversion.id,
              }).catch((err) => {
                console.error("Failed to dispatch reward:", err);
              });
            });

            // f. Non-blocking: if referrer.trackdeskAffiliateId exists and qualified, call trackdeskService.logConversion(referrer.trackdeskAffiliateId, 'referral_signup', newUser.id, 5.00)
            if (referrer.trackdeskAffiliateId) {
              setImmediate(async () => {
                try {
                  const activeReferrals = await getActiveReferralCount(referrer.id);
                  const settings = await getAdminSettings();
                  const isQualified = activeReferrals >= settings.referralQualificationLimit;

                  if (isQualified) {
                    await trackdeskService.logConversion(
                      referrer.trackdeskAffiliateId!,
                      "referral_signup",
                      newUser.id,
                      5.00
                    );
                  }
                } catch (err) {
                  console.error("Failed to log conversion to Trackdesk:", err);
                }
              });
            }
          }
        }
      }
    } catch (e) {
      console.error("Error processing referral in signup callback:", e);
    }
  }
});

const app = express();

app.use(morgan("dev"));
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookRouter);
app.use(express.json({
  verify: (req: any, _res, buf) => {
    try {
      req.rawBody = buf.toString();
    } catch (e) {
      req.rawBody = undefined;
    }
  },
}));

const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL,
  "http://localhost:3000",
  "https://polokaz-api.vercel.app",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");
      callback(null, isAllowed);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Specify allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  }),
);

app.all("/api/auth/*splat", (req, res, next) => {
  // authHandler returns a promise; ensure we catch rejections and log them
  Promise.resolve()
    .then(() => authHandler(req as any, res as any))
    .catch((err) => {
      try {
        logger.error?.(err?.stack ?? err);
        // Log request details to help debug auth JSON/body issues
        try {
          logger.error?.({ path: req.path, method: req.method, headers: req.headers, rawBody: (req as any).rawBody });
        } catch (e) {
          console.error('Failed to log request details', e);
        }
      } catch (e) {
        /* ignore logging errors */
      }
      console.error(err);
      next(err);
    });
});

// Webhook routes (no authentication required)
app.use("/api/webhooks/trackdesk", trackdeskWebhookRouter);
app.use("/api/webhooks", webhooksRouter);

app.use(authenticate);

// We disable x-powered-by header for more security
app.disable("x-powered-by");

// Deals (public browse + sync)
app.use("/api/deals", dealsRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/admin", adminRouter);
app.use("/api/merchant-applications", merchantApplicationsRouter);
app.use("/api/merchants", merchantsRouter);
app.use("/api/merchant", merchantRouter);
app.use("/api/referral", referralRouter);
app.use("/api/users", usersRouter);
app.use("/api/trackdesk", trackdeskRouter);
app.use("/api/stripe", stripeRouter);
app.use("/api/plans", plansRouter);
app.use("/api/me", meRouter);

// Centralized error handler to log unexpected exceptions and return JSON
app.use((err: any, req: any, res: any, next: any) => {
  try {
    console.error(err?.stack ?? err);
    logger.error?.(err?.stack ?? err);
    try {
      fs.appendFileSync(
        "error.log",
        `${new Date().toISOString()} - ${err?.stack ?? String(err)}\n\n`,
      );
    } catch (e) {
      // ignore file write errors
    }
  } catch (e) {
    console.error('Error while logging error:', e);
  }

  res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: err?.message ?? "Server error" });
});

if (!process.env.PORT) {
  logger.warn(`PORT env variable is missing. Using 3001 as default`);
}

const port = process.env.PORT ?? "3001";

app.listen(parseInt(port), () => {
  logger.info(`Server is running on http://127.0.0.1:${port}/`);
});
