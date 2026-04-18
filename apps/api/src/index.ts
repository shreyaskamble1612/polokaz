import express from "express";
import { authHandler } from "@polokaz/auth";
import cors from "cors";
import authenticate from "./middleware/authenticate";
import { createLogger, useLogger } from "./logger";
import morgan from "morgan";
import { referralRouter } from "./controllers/referrals";
import { trackdeskRouter } from "./controllers/trackdesk";
import { dealsRouter } from "./controllers/deals";
import { usersRouter } from "./controllers/users";
import { trackdeskWebhookRouter } from "./controllers/webhooks/trackdesk";
import { coupontoolsWebhookRouter } from "./controllers/webhooks/coupontools";
import "dotenv/config";
import fs from "fs";

createLogger();

const logger = useLogger();

const app = express();

app.use(morgan("dev"));
app.use(express.json({
  verify: (req: any, _res, buf) => {
    try {
      req.rawBody = buf.toString();
    } catch (e) {
      req.rawBody = undefined;
    }
  },
}));

app.use(
  cors({
    origin: process.env.NEXT_PUBLIC_APP_URL, 
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  }),
);

app.all("/api/auth/*splat", (req, res, next) => {
  // authHandler returns a promise; ensure we catch rejections and log them
  Promise.resolve()
    .then(() => authHandler(req as any, res as any, next))
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
app.use("/api/webhooks/coupontools", coupontoolsWebhookRouter);

app.use(authenticate);

// We disable x-powered-by header for more security
app.disable("x-powered-by");

// Deals (public browse + sync)
app.use("/api/deals", dealsRouter);
app.use("/api/referral", referralRouter);
app.use("/api/users", usersRouter);
app.use("/api/trackdesk", trackdeskRouter);

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
