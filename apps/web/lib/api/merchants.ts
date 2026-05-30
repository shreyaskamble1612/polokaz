const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export type MerchantProfile = {
  id: string;
  userId: string;
  businessName: string;
  businessCategory: string | null;
  contactEmail: string;
  website: string | null;
  coupontoolsMerchantId: string | null;
  status: "pending" | "active" | "suspended";
  createdAt: string;
};

export type MerchantDeal = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  dealType: "coupon" | "voucher" | "loyalty";
  discountValue: string | null;
  expiresAt: string | null;
  status: "active" | "inactive" | "pending_moderation" | "rejected";
  rejectionReason: string | null;
  createdAt: string;
  redemptionCount: number;
};

type ApiError = {
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiError | T | null;

  if (!response.ok) {
    const message =
      (payload as ApiError | null)?.error?.message ||
      (payload as ApiError | null)?.message ||
      response.statusText ||
      "Request failed";
    throw new Error(message);
  }

  return payload as T;
}

export async function onboardMerchant(input: {
  businessName: string;
  businessCategory: string;
  contactEmail: string;
  website?: string;
}) {
  const response = await fetch(`${API_URL}/api/merchants/onboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  return parseResponse<{ merchant: MerchantProfile }>(response);
}

export async function fetchMerchantDeals() {
  const response = await fetch(`${API_URL}/api/merchants/deals`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  return parseResponse<{ merchant: MerchantProfile; deals: MerchantDeal[] }>(response);
}

export async function createMerchantDeal(input: {
  title: string;
  description: string;
  category: string;
  dealType: "coupon" | "voucher" | "loyalty";
  discountValue: string;
  expiresAt: string;
  imageUrl?: string;
}) {
  const response = await fetch(`${API_URL}/api/merchants/deals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  return parseResponse<{ deal: MerchantDeal; message: string }>(response);
}
