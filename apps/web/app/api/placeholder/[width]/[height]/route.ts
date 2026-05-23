import { NextRequest } from "next/server";

function clampDimension(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(1600, Math.max(120, parsed));
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ width: string; height: string }> }
) {
  const { width, height } = await context.params;
  const safeWidth = clampDimension(width, 400);
  const safeHeight = clampDimension(height, 200);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}" fill="none">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="55%" stop-color="#111827" />
          <stop offset="100%" stop-color="#155e75" />
        </linearGradient>
      </defs>
      <rect width="${safeWidth}" height="${safeHeight}" rx="28" fill="url(#bg)" />
      <circle cx="${Math.round(safeWidth * 0.82)}" cy="${Math.round(safeHeight * 0.22)}" r="${Math.round(safeHeight * 0.42)}" fill="rgba(103,232,249,0.16)" />
      <circle cx="${Math.round(safeWidth * 0.18)}" cy="${Math.round(safeHeight * 0.86)}" r="${Math.round(safeHeight * 0.56)}" fill="rgba(59,130,246,0.14)" />
      <text x="28" y="${Math.round(safeHeight * 0.42)}" fill="#f8fafc" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="0.04em">POLOKAZ DEAL</text>
      <text x="28" y="${Math.round(safeHeight * 0.58)}" fill="#bae6fd" font-family="Inter, Arial, sans-serif" font-size="14" letter-spacing="0.28em">PREMIUM MEMBER OFFER</text>
    </svg>
  `.trim();

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
