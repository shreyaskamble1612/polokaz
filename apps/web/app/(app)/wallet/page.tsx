"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchWallet,
  removeWalletDeal,
  type ApiClientError,
  type WalletApiItem,
} from "@/lib/api/wallet";
import { clientFetch } from "@/lib/api/client-fetch";
import { mapWalletItemToUiDeal } from "@/lib/deals-adapter";
import { AnimatePresence, motion } from "motion/react";
import {
  Bookmark,
  CheckCircle2,
  ExternalLink,
  Layers3,
  LoaderCircle,
  PackageOpen,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useSWRConfig } from "swr";

type WalletTab = "saved" | "redeemed";

function formatDate(date: string | null) {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SavedWalletCard({
  item,
  isRemoving,
  isRedeeming,
  onRemove,
  onRedeem,
}: {
  item: WalletApiItem;
  isRemoving: boolean;
  isRedeeming: boolean;
  onRemove: (dealId: string) => void | Promise<void>;
  onRedeem: (dealId: string) => void | Promise<void>;
}) {
  const deal = mapWalletItemToUiDeal(item);

  return (
    <Card className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(24,24,31,0.96)_0%,rgba(12,12,18,0.98)_100%)] py-0 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
      <div className="relative h-44">
        <Image
          src={deal.imageUrl}
          alt={deal.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,14,0.12)_0%,rgba(8,8,14,0.9)_100%)]" />
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={() => onRemove(item.dealId)}
            disabled={isRemoving || isRedeeming}
            className="inline-flex size-9 items-center justify-center rounded-full border border-white/12 bg-black/35 text-zinc-200 backdrop-blur transition hover:bg-white/12 hover:text-white disabled:opacity-60"
            aria-label={`Remove ${deal.title}`}
          >
            {isRemoving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <X className="size-4" />
            )}
          </button>
        </div>
        <div className="absolute right-4 bottom-4 left-4">
          <div className="flex flex-wrap gap-2">
            <Badge className="border-transparent bg-white/14 text-white">
              {deal.merchantName}
            </Badge>
            <Badge className="border-emerald-300/20 bg-emerald-500/14 text-emerald-100">
              {deal.discount}
            </Badge>
          </div>
        </div>
      </div>

      <CardContent className="space-y-5 px-5 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            {deal.category}
          </p>
          <h2 className="mt-2 text-xl font-semibold leading-tight text-white">
            {deal.title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            {deal.description}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>Saved {formatDate(item.savedAt)}</span>
          <span>Expires {formatDate(item.deal.expiresAt ?? item.deal.endDate)}</span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => onRedeem(item.dealId)}
            disabled={isRedeeming || isRemoving}
            className="flex-1 rounded-full bg-[linear-gradient(135deg,#f5d061_0%,#dca93b_100%)] text-zinc-950 hover:brightness-105 disabled:opacity-60"
          >
            {isRedeeming ? (
              <LoaderCircle className="size-4 animate-spin mr-2" />
            ) : null}
            Redeem
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            <Link href={`/deals/${deal.id}`}>
              Details
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RedeemedWalletRow({ item }: { item: WalletApiItem }) {
  const deal = mapWalletItemToUiDeal(item);

  return (
    <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <p className="text-lg font-semibold text-white">{deal.title}</p>
        <p className="mt-1 text-sm text-zinc-400">{deal.merchantName}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <div className="text-sm text-zinc-400">
          Redeemed {formatDate(item.redeemedAt)}
        </div>
        <Badge className="w-fit border-emerald-300/20 bg-emerald-500/14 text-emerald-100">
          Redeemed
        </Badge>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<WalletTab>("saved");
  const [removingDealId, setRemovingDealId] = useState<string | null>(null);
  const [redeemingDealId, setRedeemingDealId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  const savedQuery = useSWR("/api/wallet?status=saved", () => fetchWallet("saved"));
  const redeemedQuery = useSWR("/api/wallet?status=redeemed", () => fetchWallet("redeemed"));

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const savedItems = savedQuery.data?.items ?? [];
  const redeemedItems = redeemedQuery.data?.items ?? [];

  const summary = useMemo(() => {
    const source = savedQuery.data ?? redeemedQuery.data;
    const savedCount = source?.savedCount ?? savedItems.length;
    const redeemedCount = source?.redeemedCount ?? redeemedItems.length;

    return {
      saved: savedCount,
      redeemed: redeemedCount,
      total: savedCount + redeemedCount,
    };
  }, [redeemedItems.length, redeemedQuery.data, savedItems.length, savedQuery.data]);

  const removeSavedDeal = async (dealId: string) => {
    if (removingDealId) return;

    setRemovingDealId(dealId);

    try {
      await removeWalletDeal(dealId);
      setToast("Removed from wallet.");
      await Promise.all([
        mutate("/api/wallet?status=saved"),
        mutate("/api/wallet?status=redeemed"),
        mutate(`/api/deals/${dealId}`),
      ]);
    } catch (error) {
      const apiError = error as ApiClientError;
      setToast(apiError.message || "Failed to remove deal.");
    } finally {
      setRemovingDealId(null);
    }
  };

  const redeemSavedDeal = async (dealId: string) => {
    if (redeemingDealId) return;

    setRedeemingDealId(dealId);

    try {
      const res = await clientFetch<{ success: boolean; pointsEarned: number }>(
        `/api/wallet/${dealId}/redeem`,
        { method: "POST" }
      );
      setToast(`Redeemed! Earned ${res.pointsEarned} points.`);
      await Promise.all([
        mutate("/api/wallet?status=saved"),
        mutate("/api/wallet?status=redeemed"),
        mutate(`/api/deals/${dealId}`),
      ]);
    } catch (error: any) {
      setToast(error.message || "Failed to redeem deal.");
    } finally {
      setRedeemingDealId(null);
    }
  };

  const isLoading = savedQuery.isLoading || redeemedQuery.isLoading;
  const hasError = Boolean(savedQuery.error || redeemedQuery.error);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.11),transparent_24%),linear-gradient(180deg,#09090f_0%,#11111a_48%,#07070b_100%)] text-white">
      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 bottom-4 z-50 rounded-2xl border border-cyan-300/18 bg-zinc-950/92 px-4 py-3 text-sm text-zinc-200 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-300/80">
                Member Wallet
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Keep your saved offers and redemption history in one place.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
                Your Polokaz wallet tracks the deals you want to use next and the
                offers you have already redeemed.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Saved",
                  value: summary.saved,
                  icon: Bookmark,
                  accent: "text-cyan-200",
                },
                {
                  label: "Redeemed",
                  value: summary.redeemed,
                  icon: CheckCircle2,
                  accent: "text-emerald-200",
                },
                {
                  label: "Total Items",
                  value: summary.total,
                  icon: Layers3,
                  accent: "text-amber-200",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="min-w-[170px] rounded-[24px] border border-white/10 bg-black/20 px-5 py-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                      {stat.label}
                    </p>
                    <stat.icon className={`size-4 ${stat.accent}`} />
                  </div>
                  <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as WalletTab)}
            className="space-y-6"
          >
            <TabsList className="h-auto rounded-full border border-white/10 bg-white/[0.04] p-1">
              <TabsTrigger
                value="saved"
                className="rounded-full px-5 py-2.5 text-sm data-[state=active]:bg-white data-[state=active]:text-zinc-950"
              >
                Saved Deals
              </TabsTrigger>
              <TabsTrigger
                value="redeemed"
                className="rounded-full px-5 py-2.5 text-sm data-[state=active]:bg-white data-[state=active]:text-zinc-950"
              >
                Redeemed History
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
              >
                {isLoading ? (
                  <div className="grid place-items-center rounded-[30px] border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
                    <div className="max-w-md">
                      <div className="mx-auto flex size-20 items-center justify-center rounded-[28px] border border-cyan-300/12 bg-cyan-500/10 text-cyan-200 shadow-[0_18px_40px_rgba(34,211,238,0.14)]">
                        <LoaderCircle className="size-9 animate-spin" />
                      </div>
                      <h2 className="mt-6 text-2xl font-semibold text-white">
                        Loading wallet...
                      </h2>
                    </div>
                  </div>
                ) : hasError ? (
                  <div className="grid place-items-center rounded-[30px] border border-red-400/20 bg-red-500/10 px-6 py-16 text-center">
                    <div className="max-w-md">
                      <h2 className="text-2xl font-semibold text-white">
                        Failed to load wallet.
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-zinc-300">
                        Please refresh the page and try again.
                      </p>
                    </div>
                  </div>
                ) : activeTab === "saved" ? (
                  savedItems.length > 0 ? (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {savedItems.map((item) => (
                        <SavedWalletCard
                          key={item.id}
                          item={item}
                          isRemoving={removingDealId === item.dealId}
                          isRedeeming={redeemingDealId === item.dealId}
                          onRemove={removeSavedDeal}
                          onRedeem={redeemSavedDeal}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid place-items-center rounded-[30px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-16 text-center">
                      <div className="max-w-md">
                        <div className="mx-auto flex size-20 items-center justify-center rounded-[28px] border border-cyan-300/12 bg-cyan-500/10 text-cyan-200 shadow-[0_18px_40px_rgba(34,211,238,0.14)]">
                          <PackageOpen className="size-9" />
                        </div>
                        <h2 className="mt-6 text-2xl font-semibold text-white">
                          Your wallet is empty.
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-zinc-400">
                          Browse deals to save some!
                        </p>
                        <Button
                          asChild
                          className="mt-6 rounded-full bg-white text-zinc-950 hover:bg-cyan-100"
                        >
                          <Link href="/deals">Browse Deals</Link>
                        </Button>
                      </div>
                    </div>
                  )
                ) : redeemedItems.length > 0 ? (
                  <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.03] shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
                    <div className="divide-y divide-white/8">
                      {redeemedItems.map((item) => (
                        <RedeemedWalletRow key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid place-items-center rounded-[30px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-16 text-center">
                    <div className="max-w-md">
                      <div className="mx-auto flex size-20 items-center justify-center rounded-[28px] border border-emerald-300/12 bg-emerald-500/10 text-emerald-200 shadow-[0_18px_40px_rgba(16,185,129,0.14)]">
                        <Sparkles className="size-9" />
                      </div>
                      <h2 className="mt-6 text-2xl font-semibold text-white">
                        No redemptions yet.
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-zinc-400">
                        Redeem a saved deal to see it here.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
