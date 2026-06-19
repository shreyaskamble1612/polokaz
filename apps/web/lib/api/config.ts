// Dynamic API URL resolution to handle CORS and cookie routing.
export const getAPIUrl = (): string => {
  if (typeof window !== "undefined") {
    // Client-side: Make requests relative to the current frontend host so they pass through the Next.js rewrite proxy.
    return "";
  }
  // Server-side: Make requests directly to the backend API server.
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
};

export const API_URL = getAPIUrl();
