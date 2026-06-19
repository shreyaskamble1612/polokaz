import { API_URL } from "./config";

export interface ApiDeal {
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
  expiresAt?: string | null;
  images: string[] | null;
  thumbnailUrl: string | null;
  featured: boolean;
  coupontoolsCouponId: string | null;
}

export type Deal = ApiDeal;

export interface DealsListResponse {
  deals: ApiDeal[];
  total: number;
  page: number;
  totalPages: number;
  categories: string[];
}

export type DealsByCategoryResponse = Record<string, ApiDeal[]>;

export interface DealDetailResponse {
  deal: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    dealType: "coupon" | "voucher" | "loyalty";
    status: string;
    expiresAt: string | null;
    redemptionData: Record<string, unknown> | null;
    syncedAt: string | null;
    createdAt: string | null;
    merchantId: string | null;
    discountValue: string | null;
    merchantLogo: string | null;
    merchantWebsite: string | null;
    images: string[] | null;
    thumbnailUrl: string | null;
    metadata: Record<string, unknown> | null;
    coupontoolsCouponId: string | null;
  };
  merchant: {
    id: string;
    userId: string;
    businessName: string;
    businessCategory: string | null;
    contactEmail: string;
    website: string | null;
    coupontoolsMerchantId: string | null;
    status: string;
    createdAt: string | null;
  } | null;
  isSaved: boolean;
  isRedeemed: boolean;
}

export interface ListDealsParams {
  category?: string;
  type?: "coupon" | "voucher" | "loyalty";
  page?: number;
  limit?: number;
  search?: string;
}

async function apiFetch<T>(path: string) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function fetchDeals(params: ListDealsParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.category) searchParams.set("category", params.category);
  if (params.type) searchParams.set("type", params.type);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return apiFetch<DealsListResponse>(`/api/deals${suffix}`);
}

export async function fetchDealsByCategory() {
  return apiFetch<DealsByCategoryResponse>("/api/deals/by-category");
}

export async function fetchDealDetail(id: string) {
  return apiFetch<DealDetailResponse>(`/api/deals/${id}`);
}

export async function syncDealsFromCoupontools(): Promise<{
  inserted: number;
  updated: number;
  deactivated: number;
}> {
  const response = await fetch(`${API_URL}/api/admin/sync-deals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to sync deals: ${response.statusText}`);
  }

  return response.json();
}

