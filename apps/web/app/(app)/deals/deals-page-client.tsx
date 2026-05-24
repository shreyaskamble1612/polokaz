"use client";

import { DealsBrowser } from "@/components/deals/DealsBrowser";
import { fetchDealsByCategory } from "@/lib/api/deals";
import { flattenDealsByCategory } from "@/lib/deals-adapter";
import useSWR from "swr";

export function DealsPageClient() {
  const { data, error, isLoading } = useSWR("/api/deals/by-category", fetchDealsByCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#09090f_0%,#11111a_48%,#07070b_100%)] px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl rounded-[24px] border border-white/10 bg-white/[0.04] p-8 text-center">
          Loading deals...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#09090f_0%,#11111a_48%,#07070b_100%)] px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl rounded-[24px] border border-red-400/20 bg-red-500/10 p-8 text-center">
          Failed to load deals.
        </div>
      </div>
    );
  }

  return <DealsBrowser deals={flattenDealsByCategory(data)} />;
}
