"use client";

import { DealDetailView } from "@/components/deals/DealDetailView";
import { fetchDealDetail } from "@/lib/api/deals";
import { mapDealDetailToUiDeal } from "@/lib/deals-adapter";
import useSWR from "swr";

export function DealDetailClient({ id }: { id: string }) {
  const { data, error, isLoading } = useSWR(id ? `/api/deals/${id}` : null, () => fetchDealDetail(id));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.11),transparent_24%),linear-gradient(180deg,#09090f_0%,#11111a_48%,#07070b_100%)] px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl rounded-[24px] border border-white/10 bg-white/[0.04] p-8 text-center">
          Loading deal...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.11),transparent_24%),linear-gradient(180deg,#09090f_0%,#11111a_48%,#07070b_100%)] px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl rounded-[24px] border border-red-400/20 bg-red-500/10 p-8 text-center">
          Failed to load deal details.
        </div>
      </div>
    );
  }

  return (
    <DealDetailView
      deal={mapDealDetailToUiDeal(data)}
      collectionHref="/deals"
      collectionLabel="Deals"
    />
  );
}
