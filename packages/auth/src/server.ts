import { APIError, betterAuth } from "better-auth";
import {
  admin,
  bearer,
  createAuthMiddleware,
  openAPI,
} from "better-auth/plugins";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@polokaz/db";
import "dotenv/config";
import { consumeReferral, getReferral } from "./utils";

const instance = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL],
  emailAndPassword: {
    enabled: true,
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }

      const { referralId, trackdeskClickId } = ctx.body as {
        referralId?: string;
        trackdeskClickId?: string;
        status: number;
      };

      if (!referralId) {
        throw new APIError("INTERNAL_SERVER_ERROR", {
          message: "Internal server error",
        });
      }

      try {
        await consumeReferral(
          referralId,
          ctx.context.newSession.user.id,
          trackdeskClickId,
        );
      } catch (e) {
        console.warn(`There was an error consumming the referral code: ${e}`);
      }

      return;
    }),
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }

      const { referralId } = ctx.body as { referralId?: string };

      if (!referralId) {
        throw new APIError("BAD_REQUEST", {
          message: "Referral code not provided",
        });
      }

      const referral = await getReferral(referralId);

      if (!referral) {
        throw new APIError("UNPROCESSABLE_ENTITY", {
          message: "Invalid referral link",
        });
      }

      if (referral.expiresAt.getDate() >= Date.now()) {
        throw new APIError("UNPROCESSABLE_ENTITY", {
          message: "Referral link expired. Ask for new one",
        });
      }

      if (referral.maxUses && referral.maxUses <= referral.referralUse.length) {
        throw new APIError("UNPROCESSABLE_ENTITY", {
          message: "Referral link has be used too many times",
        });
      }

      return;
    }),
  },
  user: {
    additionalFields: {
      referralId: {
        type: "string",
        required: false,
        input: true,
      },
      birthdate: {
        type: "date",
        required: true,
        input: true,
      },
      countryName: {
        type: "string",
        required: true,
        input: true,
      },
    },
  },
  plugins: [openAPI(), admin()],
});

export const authHandler = toNodeHandler(instance);
export const auth = instance;

export { fromNodeHeaders };
