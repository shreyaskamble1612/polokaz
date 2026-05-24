import type { ApiDeal } from "@/lib/api/deals";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export type WalletStatus = "saved" | "redeemed";

export type WalletApiItem = {
  id: string;
  userId: string;
  dealId: string;
  status: WalletStatus;
  savedAt: string;
  redeemedAt: string | null;
  deal: ApiDeal;
  merchant: {
    id: string;
    businessName: string;
    businessCategory: string | null;
    contactEmail: string;
    website: string | null;
    status: string;
  } | null;
};

export type WalletResponse = {
  items: WalletApiItem[];
  savedCount: number;
  redeemedCount: number;
};

export type ApiClientError = Error & {
  status?: number;
  code?: string;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | {
        error?: { message?: string; code?: string };
        message?: string;
      }
    | null;

  if (!response.ok) {
    const error = new Error(
      payload?.error?.message || payload?.message || response.statusText || "Request failed",
    ) as ApiClientError;
    error.status = response.status;
    error.code = payload?.error?.code;
    throw error;
  }

  return payload as T;
}

export async function fetchWallet(status?: WalletStatus) {
  const search = status ? `?status=${status}` : "";
  const response = await fetch(`${API_URL}/api/wallet${search}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return parseResponse<WalletResponse>(response);
}

export async function saveWalletDeal(dealId: string) {
  const response = await fetch(`${API_URL}/api/wallet/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ dealId }),
  });

  return parseResponse<{ item: WalletApiItem | null }>(response);
}

export async function removeWalletDeal(dealId: string) {
  const response = await fetch(`${API_URL}/api/wallet/${dealId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return parseResponse<{ success: true }>(response);
}
