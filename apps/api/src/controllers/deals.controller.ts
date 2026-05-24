import { and, db, deal, desc, eq, ilike, merchants, or, sql, walletItems } from "@polokaz/db";
import { Request, Response } from "express";
import { requireSession } from "../lib/authorization";

const DEAL_TYPES = ["coupon", "voucher", "loyalty"] as const;

function parsePage(value: unknown) {
  const parsed = Number.parseInt(String(value ?? "1"), 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

function parseLimit(value: unknown) {
  const parsed = Number.parseInt(String(value ?? "20"), 10);
  if (Number.isNaN(parsed) || parsed < 1) return 20;
  return Math.min(parsed, 50);
}

function normalizeDealType(value: unknown) {
  if (typeof value !== "string") return undefined;
  return DEAL_TYPES.includes(value as (typeof DEAL_TYPES)[number])
    ? (value as (typeof DEAL_TYPES)[number])
    : undefined;
}

const merchantNameSql = () =>
  sql<string>`coalesce(${merchants.businessName}, ${deal.merchantName}, 'Merchant')`;

export async function listDeals(req: Request, res: Response) {
  const session = requireSession(req, res);

  if (!session) return;

  const category = typeof req.query.category === "string" ? req.query.category.trim() : undefined;
  const type = normalizeDealType(req.query.type);
  const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
  const page = parsePage(req.query.page);
  const limit = parseLimit(req.query.limit);
  const offset = (page - 1) * limit;

  const conditions = [eq(deal.status, "active" as const)];

  if (category) conditions.push(eq(deal.category, category));
  if (type) conditions.push(eq(deal.dealType, type));

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(or(ilike(deal.title, pattern), ilike(deal.description, pattern))!);
  }

  const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

  const [rows, countRows, categoryRows] = await Promise.all([
    db
      .select({
        id: deal.id,
        title: deal.title,
        description: deal.description,
        category: deal.category,
        dealType: deal.dealType,
        discountValue: deal.discountValue,
        merchantId: deal.merchantId,
        merchantName: merchantNameSql(),
        merchantLogo: deal.merchantLogo,
        status: deal.status,
        startDate: deal.startDate,
        endDate: deal.endDate,
        expiresAt: deal.expiresAt,
        images: deal.images,
        thumbnailUrl: deal.thumbnailUrl,
        featured: deal.featured,
        coupontoolsCouponId: deal.coupontoolsCouponId,
      })
      .from(deal)
      .leftJoin(merchants, eq(deal.merchantId, merchants.id))
      .where(whereClause)
      .orderBy(desc(deal.priority), desc(deal.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(deal)
      .where(whereClause),
    db.selectDistinct({ category: deal.category }).from(deal).where(eq(deal.status, "active" as const)),
  ]);

  const total = countRows[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const categories = categoryRows
    .map((row) => row.category)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => a.localeCompare(b));

  return res.json({
    deals: rows.map((row) => ({
      ...row,
      startDate: row.startDate?.toISOString() ?? null,
      endDate: (row.endDate ?? row.expiresAt)?.toISOString() ?? null,
      expiresAt: row.expiresAt?.toISOString() ?? null,
    })),
    total,
    page,
    totalPages,
    categories,
  });
}

export async function listDealsByCategory(req: Request, res: Response) {
  const session = requireSession(req, res);

  if (!session) return;

  const rows = await db
    .select({
      id: deal.id,
      title: deal.title,
      description: deal.description,
      category: deal.category,
      dealType: deal.dealType,
      discountValue: deal.discountValue,
      merchantId: deal.merchantId,
      merchantName: merchantNameSql(),
      merchantLogo: deal.merchantLogo,
      status: deal.status,
      startDate: deal.startDate,
      endDate: deal.endDate,
      expiresAt: deal.expiresAt,
      images: deal.images,
      thumbnailUrl: deal.thumbnailUrl,
      featured: deal.featured,
      coupontoolsCouponId: deal.coupontoolsCouponId,
    })
    .from(deal)
    .leftJoin(merchants, eq(deal.merchantId, merchants.id))
    .where(eq(deal.status, "active" as const))
    .orderBy(desc(deal.priority), desc(deal.createdAt));

  const grouped = rows.reduce<Record<string, typeof rows>>((accumulator, row) => {
    const category = row.category ?? "Other";

    if (!accumulator[category]) {
      accumulator[category] = [];
    }

    if (accumulator[category].length < 10) {
      accumulator[category].push(row);
    }

    return accumulator;
  }, {});

  return res.json(
    Object.fromEntries(
      Object.entries(grouped)
        .filter(([, deals]) => deals.length > 0)
        .map(([categoryName, deals]) => [
          categoryName,
          deals.map((row) => ({
            ...row,
            startDate: row.startDate?.toISOString() ?? null,
            endDate: (row.endDate ?? row.expiresAt)?.toISOString() ?? null,
            expiresAt: row.expiresAt?.toISOString() ?? null,
          })),
        ]),
    ),
  );
}

export async function getDealDetail(req: Request, res: Response) {
  const session = requireSession(req, res);

  if (!session) return;

  const [record] = await db
    .select({
      deal: {
        id: deal.id,
        title: deal.title,
        description: deal.description,
        category: deal.category,
        dealType: deal.dealType,
        status: deal.status,
        expiresAt: deal.expiresAt,
        redemptionData: deal.redemptionData,
        syncedAt: deal.syncedAt,
        createdAt: deal.createdAt,
        merchantId: deal.merchantId,
        discountValue: deal.discountValue,
        merchantLogo: deal.merchantLogo,
        merchantWebsite: deal.merchantWebsite,
        images: deal.images,
        thumbnailUrl: deal.thumbnailUrl,
        metadata: deal.metadata,
        coupontoolsCouponId: deal.coupontoolsCouponId,
      },
      merchant: {
        id: merchants.id,
        userId: merchants.userId,
        businessName: merchants.businessName,
        businessCategory: merchants.businessCategory,
        contactEmail: merchants.contactEmail,
        website: merchants.website,
        coupontoolsMerchantId: merchants.coupontoolsMerchantId,
        status: merchants.status,
        createdAt: merchants.createdAt,
      },
      walletStatus: walletItems.status,
    })
    .from(deal)
    .leftJoin(merchants, eq(deal.merchantId, merchants.id))
    .leftJoin(
      walletItems,
      and(eq(walletItems.dealId, deal.id), eq(walletItems.userId, session.user.id)),
    )
    .where(and(eq(deal.id, req.params.id), eq(deal.status, "active" as const)))
    .limit(1);

  if (!record) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Deal not found" },
    });
  }

  return res.json({
    deal: {
      ...record.deal,
      expiresAt: record.deal.expiresAt?.toISOString() ?? null,
      syncedAt: record.deal.syncedAt?.toISOString() ?? null,
      createdAt: record.deal.createdAt?.toISOString() ?? null,
    },
    merchant: record.merchant
      ? {
          ...record.merchant,
          createdAt: record.merchant.createdAt?.toISOString() ?? null,
        }
      : null,
    isSaved: record.walletStatus === "saved" || record.walletStatus === "redeemed",
    isRedeemed: record.walletStatus === "redeemed",
  });
}
