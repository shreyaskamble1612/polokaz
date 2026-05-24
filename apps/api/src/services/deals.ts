import {
  and,
  db,
  deal,
  desc,
  eq,
  ilike,
  or,
  sql,
} from "@polokaz/db";
import { syncDeals } from "./coupontools.service";
import type { CoupontoolsDealPayload } from "./coupontools";

export interface ListDealsParams {
  category?: string;
  search?: string;
  featured?: boolean;
  status?: "active" | "inactive" | "pending_moderation" | "rejected";
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

export class DealsService {
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
        or(ilike(deal.title, pattern), ilike(deal.merchantName, pattern))!
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

    return {
      deals: rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        dealType: row.dealType,
        discountValue: row.discountValue,
        merchantName: row.merchantName,
        merchantId: row.merchantId,
        merchantLogo: row.merchantLogo,
        status: row.status,
        startDate: row.startDate?.toISOString() ?? null,
        endDate: (row.endDate ?? row.expiresAt)?.toISOString() ?? null,
        images: row.images,
        thumbnailUrl: row.thumbnailUrl,
        featured: row.featured,
        coupontoolsCouponId: row.coupontoolsCouponId ?? row.coupontoolsId,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async syncFromCoupontools(): Promise<{
    inserted: number;
    updated: number;
    deactivated: number;
  }> {
    return syncDeals();
  }

  async upsertDeal(payload: CoupontoolsDealPayload): Promise<void> {
    const now = payload.syncedAt ?? new Date();
    const expiresAt = this.parseDate(payload.expiresAt);
    const startDate = this.parseDate(payload.startDate);
    const endDate = this.parseDate(payload.endDate) ?? expiresAt;
    const displayId = payload.coupontoolsId;

    await db
      .insert(deal)
      .values({
        coupontoolsId: payload.coupontoolsId,
        title: payload.title,
        description: payload.description ?? null,
        merchantId: payload.merchantId ?? null,
        merchantName: payload.merchantName,
        category: payload.category ?? "Other",
        dealType: payload.dealType,
        status: payload.status,
        expiresAt,
        redemptionData: payload.redemptionData ?? null,
        syncedAt: now,
        coupontoolsCouponId: displayId,
        startDate,
        endDate,
        discountValue: payload.discountValue ?? null,
        merchantLogo: payload.merchantLogo ?? null,
        merchantWebsite: payload.merchantWebsite ?? null,
        images: payload.images ?? null,
        thumbnailUrl: payload.thumbnailUrl ?? null,
        featured: payload.featured ?? false,
        priority: payload.priority ?? 0,
        metadata: payload.metadata ?? null,
        coupontoolsData: payload.coupontoolsData ?? null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: deal.coupontoolsId,
        set: {
          title: payload.title,
          description: payload.description ?? null,
          merchantId: payload.merchantId ?? null,
          merchantName: payload.merchantName,
          category: payload.category ?? "Other",
          dealType: payload.dealType,
          status: payload.status,
          expiresAt,
          redemptionData: payload.redemptionData ?? null,
          syncedAt: now,
          coupontoolsCouponId: displayId,
          startDate,
          endDate,
          discountValue: payload.discountValue ?? null,
          merchantLogo: payload.merchantLogo ?? null,
          merchantWebsite: payload.merchantWebsite ?? null,
          images: payload.images ?? null,
          thumbnailUrl: payload.thumbnailUrl ?? null,
          featured: payload.featured ?? false,
          priority: payload.priority ?? 0,
          metadata: payload.metadata ?? null,
          coupontoolsData: payload.coupontoolsData ?? null,
          updatedAt: now,
        },
      });
  }

  async markDealInactive(coupontoolsId: string): Promise<void> {
    await db
      .update(deal)
      .set({
        status: "inactive",
        syncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(deal.coupontoolsId, coupontoolsId));
  }

  private parseDate(value?: string): Date | null {
    if (!value) return null;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  }
}
