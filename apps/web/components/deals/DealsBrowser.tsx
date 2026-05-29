"use client";

import { AnimatePresence, motion } from "motion/react";
import { Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CategoryRow } from "./CategoryRow";
import type { Deal, DealType } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveWalletDeal, type ApiClientError } from "@/lib/api/wallet";
import { cn } from "@/lib/utils";
import { useSWRConfig } from "swr";

const FILTERS: Array<{ label: string; value: DealType | "all" }> = [
  { label: "All", value: "all" },
  { label: "Coupons", value: "coupon" },
  { label: "Vouchers", value: "voucher" },
  { label: "Loyalty Cards", value: "loyalty" },
];

export function DealsBrowser({ deals }: { deals: Deal[] }) {
  const [activeFilter, setActiveFilter] = useState<DealType | "all">("all");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [savingDealId, setSavingDealId] = useState<string | null>(null);
  const [savedDealIds, setSavedDealIds] = useState<Set<string>>(new Set());
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (!toastOpen) return;

    const timer = window.setTimeout(() => {
      setToastOpen(false);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [toastOpen]);

  const filteredDeals = useMemo(() => {
    if (activeFilter === "all") return deals;
    return deals.filter((deal) => deal.dealType === activeFilter);
  }, [activeFilter, deals]);

  const groupedDeals = useMemo(() => {
    return filteredDeals.reduce<Partial<Record<Deal["category"], Deal[]>>>(
      (accumulator, deal) => {
        accumulator[deal.category] = [...(accumulator[deal.category] ?? []), deal];
        return accumulator;
      },
      {}
    );
  }, [filteredDeals]);

  const categories = (Object.entries(groupedDeals) as Array<
    [Deal["category"], Deal[] | undefined]
  >).filter((entry): entry is [Deal["category"], Deal[]] => Boolean(entry[1]?.length));

  const handleSave = async (deal: Deal) => {
    if (savedDealIds.has(deal.id) || savingDealId === deal.id) return;

    setSavingDealId(deal.id);

    try {
      await saveWalletDeal(deal.id);
      setSavedDealIds((current) => new Set(current).add(deal.id));
      setToastMessage(`Saved "${deal.title}" to your wallet.`);
      setToastOpen(true);
      await Promise.all([
        mutate("/api/wallet?status=saved"),
        mutate("/api/wallet?status=redeemed"),
        mutate(`/api/deals/${deal.id}`),
      ]);
    } catch (error) {
      const apiError = error as ApiClientError;

      if (apiError.code === "ALREADY_SAVED") {
        setSavedDealIds((current) => new Set(current).add(deal.id));
        setToastMessage(`"${deal.title}" is already in your wallet.`);
        setToastOpen(true);
        await Promise.all([
          mutate("/api/wallet?status=saved"),
          mutate(`/api/deals/${deal.id}`),
        ]);
      } else {
        setToastMessage(apiError.message || "Failed to save this deal.");
        setToastOpen(true);
      }
    } finally {
      setSavingDealId(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#09090f_0%,#11111a_48%,#07070b_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04)_0%,transparent_35%,transparent_65%,rgba(34,211,238,0.05)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.16),transparent_58%)] blur-3xl" />

      <AnimatePresence>
        {toastOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.22 }}
            className="fixed right-4 bottom-4 z-50 max-w-xs rounded-2xl border border-emerald-400/20 bg-zinc-950/90 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:right-6 sm:bottom-6"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-emerald-500/14 p-2 text-emerald-300">
                <Sparkles className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Wallet update</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {toastMessage}
                </p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-8 pb-14 sm:px-6 lg:px-8 lg:pt-12">
        <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-300/80">
                Discover Deals
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Stream a premium lineup of savings across the city.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
                Browse curated member-only offers from restaurants, retail brands,
                weekend escapes, and wellness partners in a cinematic browsing
                experience built for Polokaz.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  placeholder="Search merchants, perks, or experiences"
                  className="h-12 rounded-full border-white/10 bg-black/25 pr-4 pl-11 text-white placeholder:text-zinc-500 focus-visible:ring-cyan-400/40"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {FILTERS.map((filter) => (
                  <Button
                    key={filter.value}
                    type="button"
                    variant="outline"
                    onClick={() => setActiveFilter(filter.value)}
                    className={cn(
                      "rounded-full border-white/10 bg-white/5 px-4 text-sm text-zinc-300 backdrop-blur hover:bg-white/10 hover:text-white",
                      activeFilter === filter.value &&
                        "border-cyan-300/25 bg-cyan-400/16 text-cyan-100 shadow-[0_10px_30px_rgba(34,211,238,0.18)]"
                    )}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-10">
          {categories.length > 0 ? (
            categories.map(([category, categoryDeals]) => (
              <CategoryRow
                key={category}
                category={category}
                deals={categoryDeals}
                onSave={handleSave}
                savingDealId={savingDealId}
                savedDealIds={savedDealIds}
              />
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/12 bg-white/[0.03] px-6 py-16 text-center">
              <p className="text-lg font-medium text-white">No deals available yet.</p>
              <p className="mt-2 text-sm text-zinc-400">
                Merchants are being onboarded — check back soon!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
