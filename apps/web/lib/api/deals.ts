const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

export function getDummyDeals(): Deal[] {
  return [
    {
      id: "deal_1",
      title: "20% Off On Overall Bill",
      description: "Enjoy a flat 20% discount on all food and beverage orders at select locations. No minimum bill required.",
      category: "food",
      dealType: "percentage",
      discountValue: "20",
      merchantName: "Abc Merchant",
      merchantId: "merchant_1",
      merchantLogo: null,
      status: "active",
      startDate: "2025-01-01T00:00:00Z",
      endDate: "2025-12-31T23:59:59Z",
      expiresAt: "2025-12-31T23:59:59Z",
      images: ["/customer/thumbnail.png"],
      thumbnailUrl: "/customer/thumbnail.png",
      featured: true,
      coupontoolsCouponId: "C2100B",
    },
    {
      id: "deal_2",
      title: "$25 Off On Clothing",
      description: "Get $25 off on all clothing items. Valid on purchases above $100. Limited time offer.",
      category: "retail",
      dealType: "fixed_amount",
      discountValue: "25",
      merchantName: "Fashion Store",
      merchantId: "merchant_2",
      merchantLogo: null,
      status: "active",
      startDate: "2025-01-01T00:00:00Z",
      endDate: "2025-12-31T23:59:59Z",
      expiresAt: "2025-12-31T23:59:59Z",
      images: ["/customer/thumbnail.png"],
      thumbnailUrl: "/customer/thumbnail.png",
      featured: true,
      coupontoolsCouponId: "V2100B",
    },
    {
      id: "deal_3",
      title: "Free Dessert with Meal",
      description: "Get a complimentary dessert with any main course purchase. Available at all locations.",
      category: "food",
      dealType: "freebie",
      discountValue: null,
      merchantName: "Sweet Treats Cafe",
      merchantId: "merchant_3",
      merchantLogo: null,
      status: "active",
      startDate: "2025-01-01T00:00:00Z",
      endDate: "2025-06-30T23:59:59Z",
      expiresAt: "2025-06-30T23:59:59Z",
      images: ["/customer/thumbnail.png"],
      thumbnailUrl: "/customer/thumbnail.png",
      featured: false,
      coupontoolsCouponId: "F3100C",
    },
  ];
}
