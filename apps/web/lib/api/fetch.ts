import { headers } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function serverFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const reqHeaders = await headers();
  const cookie = reqHeaders.get("cookie");

  const headersInit = new Headers(options.headers);
  if (cookie) {
    headersInit.set("cookie", cookie);
  }
  if (!headersInit.has("Content-Type")) {
    headersInit.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: headersInit,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.error?.message || errorBody?.message || response.statusText || "Request failed";
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
