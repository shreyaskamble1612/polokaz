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
import { getReferral } from "./utils";

export type SignUpCallback = (
  newUser: { id: string; email: string; name: string },
  body: { referralCode?: string; referralId?: string; trackdeskClickId?: string; [key: string]: any }
) => void | Promise<void>;

export const onSignUpCallbacks: SignUpCallback[] = [];

const instance = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  trustedOrigins: process.env.NEXT_PUBLIC_APP_URL
    ? [process.env.NEXT_PUBLIC_APP_URL]
    : [],
  emailAndPassword: {
    enabled: true,
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }

      const newUser = ctx.context.newSession?.user;
      if (!newUser) return;

      // Execute registered callbacks (non-blocking)
      for (const cb of onSignUpCallbacks) {
        try {
          const runCb = async () => {
            await cb(
              { id: newUser.id, email: newUser.email, name: newUser.name || "" },
              ctx.body as any
            );
          };
          runCb().catch((e: any) => {
            console.error("Error in onSignUpCallback:", e);
          });
        } catch (e) {
          console.error("Error executing signup callback:", e);
        }
      }

      return;
    }),
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }

      const { referralId } = ctx.body as { referralId?: string };

      // If no referral was provided, skip referral validation (it's optional)
      if (!referralId) return;

      const referral = await getReferral(referralId);

      if (!referral) {
        throw new APIError("UNPROCESSABLE_ENTITY", {
          message: "Invalid referral link",
        });
      }

      // Check expiry correctly using timestamps
      if (referral.expiresAt && referral.expiresAt.getTime() < Date.now()) {
        throw new APIError("UNPROCESSABLE_ENTITY", {
          message: "Referral link expired. Ask for new one",
        });
      }

      if (referral.maxUses && referral.maxUses <= referral.referralUse.length) {
        throw new APIError("UNPROCESSABLE_ENTITY", {
          message: "Referral link has been used too many times",
        });
      }

      return;
    }),
  },
  user: {
    additionalFields: {
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
      referralId: {
        type: "string",
        required: false,
        input: true,
      },
      tier: {
        type: "string",
        required: false,
        input: true,
      },
      hasSelectedPlan: {
        type: "boolean",
        required: false,
        input: true,
      },
    },
  },
  plugins: [openAPI(), admin()],
});

export const authHandler = toNodeHandler(instance);
export const auth = instance;

export { fromNodeHeaders };
