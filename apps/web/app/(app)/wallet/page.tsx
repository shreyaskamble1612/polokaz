"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_DEALS } from "@/lib/mock-deals";
import { AnimatePresence, motion } from "motion/react";
import {
  Bookmark,
  CheckCircle2,
  Coins,
  ExternalLink,
  PackageOpen,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type WalletTab = "saved" | "redeemed";

type SavedWalletItem = {
  id: string;
  savedAt: string;
  dealId: string;
};

type RedeemedWalletItem = {
  id: string;
  redeemedAt: string;
  pointsEarned: number;
  dealId: string;
};

const INITIAL_SAVED_ITEMS: SavedWalletItem[] = [
  { id: "saved-1", dealId: MOCK_DEALS[0]!.id, savedAt: "2026-05-08" },
  { id: "saved-2", dealId: MOCK_DEALS[4]!.id, savedAt: "2026-05-10" },
  { id: "saved-3", dealId: MOCK_DEALS[9]!.id, savedAt: "2026-05-12" },
];

const REDEEMED_ITEMS: RedeemedWalletItem[] = [
  {
    id: "redeemed-1",
    dealId: MOCK_DEALS[1]!.id,
    redeemedAt: "2026-05-03",
    pointsEarned: 50,
  },
  {
    id: "redeemed-2",
    dealId: MOCK_DEALS[6]!.id,
    redeemedAt: "2026-05-09",
    pointsEarned: 50,
  },
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function findDeal(dealId: string) {
  return MOCK_DEALS.find((deal) => deal.id === dealId) ?? null;
}

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<WalletTab>("saved");
  const [savedItems, setSavedItems] =
    useState<SavedWalletItem[]>(INITIAL_SAVED_ITEMS);

  const savedDeals = useMemo(
    () =>
      savedItems
        .map((item) => {
          const deal = findDeal(item.dealId);
          return deal ? { item, deal } : null;
        })
        .filter(
          (
            entry
          ): entry is {
            item: SavedWalletItem;
            deal: NonNullable<ReturnType<typeof findDeal>>;
          } => entry !== null
        ),
    [savedItems]
  );

  const redeemedDeals = useMemo(
    () =>
      REDEEMED_ITEMS.map((item) => {
        const deal = findDeal(item.dealId);
        return deal ? { item, deal } : null;
      }).filter(
        (
          entry
        ): entry is {
          item: RedeemedWalletItem;
          deal: NonNullable<ReturnType<typeof findDeal>>;
        } => entry !== null
      ),
    []
  );

  const summary = {
    saved: savedDeals.length,
    redeemed: redeemedDeals.length,
    pointsBalance: redeemedDeals.reduce(
      (total, redemption) => total + redemption.item.pointsEarned,
      0
    ),
  };

  const removeSavedDeal = (itemId: string) => {
    setSavedItems((current) => current.filter((item) => item.id !== itemId));
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.11),transparent_24%),linear-gradient(180deg,#09090f_0%,#11111a_48%,#07070b_100%)] text-white">
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
                Your Polokaz wallet tracks the deals you want to use next, the
                rewards you already redeemed, and the points you have earned
                along the way.
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
                  label: "Points Balance",
                  value: `${summary.pointsBalance} pts`,
                  icon: Coins,
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
                {activeTab === "saved" ? (
                  savedDeals.length > 0 ? (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {savedDeals.map(({ item, deal }) => (
                        <Card
                          key={item.id}
                          className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(24,24,31,0.96)_0%,rgba(12,12,18,0.98)_100%)] py-0 shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
                        >
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
                                onClick={() => removeSavedDeal(item.id)}
                                className="inline-flex size-9 items-center justify-center rounded-full border border-white/12 bg-black/35 text-zinc-200 backdrop-blur transition hover:bg-white/12 hover:text-white"
                                aria-label={`Remove ${deal.title}`}
                              >
                                <X className="size-4" />
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
                              <span>Expires {formatDate(deal.expiresAt)}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <Button className="flex-1 rounded-full bg-[linear-gradient(135deg,#f5d061_0%,#dca93b_100%)] text-zinc-950 hover:brightness-105">
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
                      ))}
                    </div>
                  ) : (
                    <div className="grid place-items-center rounded-[30px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-16 text-center">
                      <div className="max-w-md">
                        <div className="mx-auto flex size-20 items-center justify-center rounded-[28px] border border-cyan-300/12 bg-cyan-500/10 text-cyan-200 shadow-[0_18px_40px_rgba(34,211,238,0.14)]">
                          <PackageOpen className="size-9" />
                        </div>
                        <h2 className="mt-6 text-2xl font-semibold text-white">
                          No saved deals yet.
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-zinc-400">
                          Browse deals to save some and build your personal
                          wallet of offers.
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
                ) : redeemedDeals.length > 0 ? (
                  <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.03] shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
                    <div className="divide-y divide-white/8">
                      {redeemedDeals.map(({ item, deal }) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                        >
                          <div className="min-w-0">
                            <p className="text-lg font-semibold text-white">
                              {deal.title}
                            </p>
                            <p className="mt-1 text-sm text-zinc-400">
                              {deal.merchantName}
                            </p>
                          </div>

                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                            <div className="text-sm text-zinc-400">
                              Redeemed {formatDate(item.redeemedAt)}
                            </div>
                            <Badge className="w-fit border-amber-300/20 bg-amber-500/14 text-amber-100">
                              {item.pointsEarned} pts
                            </Badge>
                          </div>
                        </div>
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
