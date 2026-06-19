import { API_URL } from "./config";

export type AdminModerationDeal = {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  dealType: "coupon" | "voucher" | "loyalty";
  status: "active" | "inactive" | "pending_moderation" | "rejected";
  createdAt: string;
  expiresAt?: string | null;
  businessName: string | null;
  ownerEmail: string | null;
  merchantId?: string | null;
  rejectionReason: string | null;
  redemptionCount?: number;
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

export async function fetchPendingAdminDeals() {
  const response = await fetch(`${API_URL}/api/admin/deals/pending`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  return parseResponse<{ deals: AdminModerationDeal[] }>(response);
}

export async function fetchAllAdminDeals() {
  const response = await fetch(`${API_URL}/api/admin/deals`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  return parseResponse<{ deals: AdminModerationDeal[] }>(response);
}

export async function approveAdminDeal(id: string) {
  const response = await fetch(`${API_URL}/api/admin/deals/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  return parseResponse<{ deal: AdminModerationDeal }>(response);
}

export async function rejectAdminDeal(id: string, reason: string) {
  const response = await fetch(`${API_URL}/api/admin/deals/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ reason }),
  });

  return parseResponse<{ deal: AdminModerationDeal }>(response);
}
