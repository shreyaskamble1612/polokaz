const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function clientFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headersInit = new Headers(options.headers);
  if (!headersInit.has("Content-Type")) {
    headersInit.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: headersInit,
    credentials: "include",
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.error?.message || errorBody?.message || response.statusText || "Request failed";
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
