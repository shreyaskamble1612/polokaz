import { APIError, betterAuth } from "better-auth";
import {
  admin,
  bearer,
  createAuthMiddleware,
  openAPI,
} from "better-auth/plugins";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, eq, user as dbUser } from "@polokaz/db";
import nodemailer from "nodemailer";
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
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL,
    "https://*.vercel.app",
    "http://localhost:3000",
  ].filter(Boolean) as string[],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  emailVerification: {
    sendOnSignUp: false,
    sendVerificationEmail: async ({ user, url, token }) => {
      const host = process.env.SMTP_HOST;
      const port = process.env.SMTP_PORT;
      const smtpUser = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASSWORD;
      const from = process.env.SMTP_FROM || "noreply@polokaz.com";

      if (host && port && smtpUser && pass) {
        try {
          const transporter = nodemailer.createTransport({
            host,
            port: Number(port),
            secure: Number(port) === 465,
            auth: {
              user: smtpUser,
              pass,
            },
          });

          await transporter.sendMail({
            from,
            to: user.email,
            subject: "Verify your Polokaz Account",
            text: `Hello ${user.name},\n\nPlease verify your email by clicking the link: ${url}\n\nThank you!`,
            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
                     <h2 style="color: #0f172a; margin-bottom: 16px;">Verify your Polokaz Account</h2>
                     <p>Hello ${user.name || "there"},</p>
                     <p>Thank you for signing up for Polokaz. Please click the button below to verify your email address and activate your account:</p>
                     <p style="margin: 24px 0;">
                       <a href="${url}" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 12px; font-weight: bold;">Verify Account</a>
                     </p>
                     <p style="color: #64748b; font-size: 13px;">If the button does not work, copy and paste this link into your browser:</p>
                     <p style="color: #0ea5e9; font-size: 13px; word-break: break-all;">${url}</p>
                     <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                     <p style="color: #94a3b8; font-size: 12px;">This is an automated security email from Polokaz. If you did not sign up for an account, please ignore this email.</p>
                   </div>`,
          });
          console.log(`[Auth] Verification email successfully sent to ${user.email}`);
          return;
        } catch (e) {
          console.error("[Auth] Error sending verification email via SMTP:", e);
        }
      }

      // Fallback: print to console for development
      console.warn(`
================================================================================
⚠️ [Auth Warning] SMTP credentials are not configured in your environment variables.
Real verification emails will NOT be sent to ${user.email}.

To enable real email sending, configure the following in apps/api/.env:
SMTP_HOST=your_smtp_host
SMTP_PORT=587 (or 465)
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=noreply@yourdomain.com

👉 Use this URL to verify the account in your browser for now:
${url}
================================================================================
      `);
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email" || ctx.path === "/sign-up/email") {
        const userId = ctx.context.session?.user?.id || ctx.context.newSession?.user?.id;
        if (userId) {
          try {
            await db
              .update(dbUser)
              .set({ lastLoginAt: new Date() })
              .where(eq(dbUser.id, userId));
          } catch (e) {
            console.error("Failed to update lastLoginAt:", e);
          }
        }
      }

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
      status: {
        type: "string",
        required: false,
        input: false,
      },
      lastLoginAt: {
        type: "date",
        required: false,
        input: false,
      },
      setupFeeWaived: {
        type: "boolean",
        required: false,
        input: false,
      },
    },
  },
  plugins: [openAPI(), admin()],
});


export const authHandler = toNodeHandler(instance);
export const auth = instance;

export { fromNodeHeaders };
