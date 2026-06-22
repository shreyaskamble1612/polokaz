import { Session } from "@polokaz/auth";
import { db, referral, user, eq } from "@polokaz/db";
import { desc } from "drizzle-orm";
import { ForbiddenError, InvalidPayloadError } from "@polokaz/errors";
import { referralCreateSchema } from "../validations/referrals";
import { TrackdeskService } from "./trackdesk";
import { useLogger } from "../logger";

const logger = useLogger();

export class ReferralsService {
  session: Session;

  constructor(options: { session: Session }) {
    this.session = options.session;
  }

  async getAll() {
    if (!this.session) throw new ForbiddenError();

    return await db
      .select()
      .from(referral)
      .where(eq(referral.createdBy, this.session.user.id))
      .orderBy(desc(referral.createdAt));
  }

  async createOne(data: any) {
    
    if (!this.session) throw new ForbiddenError();
    
    const { data: parsedData, error } = referralCreateSchema.safeParse(data);
    if (error) {
      throw new InvalidPayloadError({ reason: error.message });
    }

    const expiresAt = Date.now() + parsedData.expiresAt;

    // Create the referral first
    const [newReferral] = await db
      .insert(referral)
      .values({
        maxUses: parsedData.maxUses,
        expiresAt: new Date(expiresAt),
        createdBy: this.session.user.id,
      })
      .returning();

    // Create Trackdesk tracking link
    try {
      const trackdeskService = new TrackdeskService();
      const destinationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign-up/onboarding?referralId=${newReferral.id}`;
      
      const [dbUserRecord] = await db
        .select({ trackdeskAffiliateId: user.trackdeskAffiliateId })
        .from(user)
        .where(eq(user.id, this.session.user.id))
        .limit(1);

      let affiliateId = dbUserRecord?.trackdeskAffiliateId;

      if (!affiliateId) {
        try {
          logger.info("User missing Trackdesk affiliate ID, registering on the fly...", {
            userId: this.session.user.id,
          });
          affiliateId = await trackdeskService.registerAffiliate({
            id: this.session.user.id,
            email: this.session.user.email,
            name: this.session.user.name || "Polokaz User",
          }) || undefined;
        } catch (regErr) {
          logger.error("Failed on-the-fly Trackdesk affiliate registration", {
            error: regErr instanceof Error ? regErr.message : String(regErr),
            userId: this.session.user.id,
          });
        }
      }

      const trackdeskUrl =
        await trackdeskService.createTrackingLink(
          destinationUrl,
          affiliateId || undefined
        );

      if (trackdeskUrl) {
        // Update referral with Trackdesk URL
        const [updatedReferral] = await db
          .update(referral)
          .set({ trackdeskUrl })
          .where(eq(referral.id, newReferral.id))
          .returning();

        return [updatedReferral];
      }
    } catch (error) {
      logger.error("Failed to create Trackdesk tracking link", {
        error: error instanceof Error ? error.message : String(error),
        referralId: newReferral.id,
      });
      
    }

    return [newReferral];
  }
}
