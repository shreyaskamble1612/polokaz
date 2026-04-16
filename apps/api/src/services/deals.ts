import { db } from "@polokaz/db";
import { deal } from "@polokaz/db";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";
import { CoupontoolsService } from "./coupontools";
import type { CoupontoolsDealPayload } from "./coupontools";
import { useLogger } from "../logger";

const logger = useLogger();

export interface ListDealsParams {
  category?: string;
  search?: string;
  featured?: boolean;
  status?: string;
  page?: number;
  limit?: number;
}

export interface DealResponse {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  dealType: string;
  discountValue: string | null;
  merchantName: string;
  merchantId: string | null;
  merchantLogo: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  images: string[] | null;
  thumbnailUrl: string | null;
  featured: boolean;
  coupontoolsCouponId: string | null;
}

export interface ListDealsResult {
  deals: DealResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Deals Service
 * Serves deals from DB (synced from Coupontools) per PRD
 */
export class DealsService {
  /**
   * List deals from our database with filters
   */
  async listDeals(params: ListDealsParams = {}): Promise<ListDealsResult> {
    const {
      category,
      search,
      featured,
      status = "active",
      page = 1,
      limit = 20,
    } = params;

    const conditions = [eq(deal.status, status)];
    if (category) conditions.push(eq(deal.category, category));
    if (featured === true) conditions.push(eq(deal.featured, true));
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(deal.title, pattern),
          ilike(deal.merchantName, pattern)
        )!
      );
    }

    const where = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(deal)
        .where(where)
        .orderBy(desc(deal.priority), desc(deal.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(deal)
        .where(where),
    ]);

    const total = countResult[0]?.count ?? 0;

    const deals: DealResponse[] = rows.map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      category: d.category,
      dealType: d.dealType,
      discountValue: d.discountValue,
      merchantName: d.merchantName,
      merchantId: d.merchantId,
      merchantLogo: d.merchantLogo,
      status: d.status,
      startDate: d.startDate?.toISOString() ?? null,
      endDate: d.endDate?.toISOString() ?? null,
      images: d.images,
      thumbnailUrl: d.thumbnailUrl,
      featured: d.featured,
      coupontoolsCouponId: d.coupontoolsCouponId,
    }));

    return {
      deals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Sync deals from Coupontools API into our database
   */
  async syncFromCoupontools(): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    try {
      const coupontools = new CoupontoolsService();
      const payloads = await coupontools.listCampaigns();

      for (const p of payloads) {
        try {
          await this.upsertDeal(p);
          synced++;
        } catch (e) {
          logger.error("Failed to upsert deal from Coupontools", {
            id: p.id,
            error: e instanceof Error ? e.message : String(e),
          });
          errors++;
        }
      }

      logger.info("Coupontools sync completed", { synced, errors });
    } catch (error) {
      logger.error("Coupontools sync failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    return { synced, errors };
  }

  /**
   * Upsert a deal from Coupontools payload (API or webhook)
   */
  async upsertDeal(payload: CoupontoolsDealPayload): Promise<void> {
    const now = new Date();
    await db
      .insert(deal)
      .values({
        id: payload.id,
        title: payload.title,
        description: payload.description ?? null,
        category: payload.category ?? null,
        dealType: payload.dealType ?? "percentage",
        discountValue: payload.discountValue ?? null,
        merchantName: payload.merchantName,
        merchantId: payload.merchantId ?? null,
        status: payload.status ?? "active",
        startDate: payload.startDate ? new Date(payload.startDate) : null,
        endDate: payload.endDate ? new Date(payload.endDate) : null,
        images: payload.images ?? null,
        coupontoolsCouponId: payload.coupontoolsCouponId,
        coupontoolsData: payload.coupontoolsData
          ? JSON.stringify(payload.coupontoolsData)
          : null,
        lastSyncedAt: now,
        syncStatus: "synced",
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: deal.id,
        set: {
          title: payload.title,
          description: payload.description ?? null,
          category: payload.category ?? null,
          dealType: payload.dealType ?? "percentage",
          discountValue: payload.discountValue ?? null,
          merchantName: payload.merchantName,
          merchantId: payload.merchantId ?? null,
          status: payload.status ?? "active",
          startDate: payload.startDate ? new Date(payload.startDate) : null,
          endDate: payload.endDate ? new Date(payload.endDate) : null,
          images: payload.images ?? null,
          coupontoolsCouponId: payload.coupontoolsCouponId,
          coupontoolsData: payload.coupontoolsData
            ? JSON.stringify(payload.coupontoolsData)
            : null,
          lastSyncedAt: now,
          syncStatus: "synced",
          updatedAt: now,
        },
      });
  }

  /**
   * Mark deal as inactive/removed (from coupon_removed webhook)
   */
  async markDealInactive(dealId: string): Promise<void> {
    await db
      .update(deal)
      .set({ status: "inactive", updatedAt: new Date() })
      .where(eq(deal.id, dealId));
  }
}
