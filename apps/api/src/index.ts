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

createLogger();

const logger = useLogger();

const app = express();

app.use(morgan("dev"));
app.use(express.json());

app.use(
  cors({
    origin: process.env.NEXT_PUBLIC_APP_URL, 
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  }),
);

app.all("/api/auth/*splat", authHandler);

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

if (!process.env.PORT) {
  logger.warn(`PORT env variable is missing. Using 3001 as default`);
}

const port = process.env.PORT ?? "3001";

app.listen(parseInt(port), () => {
  logger.info(`Server is running on http://127.0.0.1:${port}/`);
});
