"use client";

import { DealDetailView } from "@/components/deals/DealDetailView";
import { fetchDealDetail } from "@/lib/api/deals";
import { saveWalletDeal, type ApiClientError } from "@/lib/api/wallet";
import { mapDealDetailToUiDeal } from "@/lib/deals-adapter";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useSWRConfig } from "swr";

export function DealDetailClient({ id }: { id: string }) {
  const { data, error, isLoading } = useSWR(id ? `/api/deals/${id}` : null, () => fetchDealDetail(id));
  const { mutate } = useSWRConfig();
  const [savePending, setSavePending] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!saveMessage) return;

    const timer = window.setTimeout(() => setSaveMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

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

  const handleSave = async () => {
    if (savePending || data.isSaved || data.isRedeemed) return;

    setSavePending(true);

    try {
      await saveWalletDeal(id);
      setSaveMessage("Saved to your wallet.");
      await Promise.all([
        mutate(`/api/deals/${id}`),
        mutate("/api/wallet?status=saved"),
        mutate("/api/wallet?status=redeemed"),
      ]);
    } catch (error) {
      const apiError = error as ApiClientError;

      if (apiError.code === "ALREADY_SAVED") {
        setSaveMessage("This deal is already in your wallet.");
        await Promise.all([
          mutate(`/api/deals/${id}`),
          mutate("/api/wallet?status=saved"),
        ]);
      } else {
        setSaveMessage(apiError.message || "Failed to save this deal.");
      }
    } finally {
      setSavePending(false);
    }
  };

  return (
    <DealDetailView
      deal={mapDealDetailToUiDeal(data)}
      collectionHref="/deals"
      collectionLabel="Deals"
      isSaved={data.isSaved}
      isRedeemed={data.isRedeemed}
      savePending={savePending}
      saveMessage={saveMessage}
      onSave={handleSave}
    />
  );
}
