/**
 * Deals API Client
 * Frontend API client for fetching deals from the backend
 */

export interface Deal {
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

export interface DealsResponse {
  deals: Deal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ListDealsParams {
  category?: string;
  search?: string;
  featured?: boolean;
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetch deals from the API
 */
export async function fetchDeals(params: ListDealsParams = {}): Promise<DealsResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.category) searchParams.set("category", params.category);
  if (params.search) searchParams.set("search", params.search);
  if (params.featured) searchParams.set("featured", "true");
  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());

  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/deals?${searchParams.toString()}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch deals: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Sync deals from Coupontools (admin only)
 */
export async function syncDealsFromCoupontools(): Promise<{
  synced: number;
  errors: number;
  deactivated: number;
}> {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/sync-deals`;
  
  const response = await fetch(url, {
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

/**
 * Get dummy deals for development/testing
 */
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
      images: ["/customer/thumbnail.png"],
      thumbnailUrl: "/customer/thumbnail.png",
      featured: false,
      coupontoolsCouponId: "F3100C",
    },
  ];
}
