"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Deal } from "./types";
import { AnimatePresence, motion } from "motion/react";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  LoaderCircle,
  MapPin,
  Ticket,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const dealTypeLabel: Record<Deal["dealType"], string> = {
  coupon: "Coupon",
  voucher: "Voucher",
  loyalty: "Loyalty Card",
};

const dealTypeClasses: Record<Deal["dealType"], string> = {
  coupon: "border-cyan-400/30 bg-cyan-500/12 text-cyan-100",
  voucher: "border-amber-400/30 bg-amber-500/12 text-amber-100",
  loyalty: "border-fuchsia-400/30 bg-fuchsia-500/12 text-fuchsia-100",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getDaysRemaining(date: string) {
  const now = new Date();
  const target = new Date(date);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function DealDetailView({
  deal,
  collectionHref = "/deals",
  collectionLabel = "Deals",
  isSaved = false,
  isRedeemed = false,
  savePending = false,
  saveMessage,
  redeemPending = false,
  redeemMessage = null,
  onSave,
  onRedeem,
}: {
  deal: Deal;
  collectionHref?: string;
  collectionLabel?: string;
  isSaved?: boolean;
  isRedeemed?: boolean;
  savePending?: boolean;
  saveMessage?: string | null;
  redeemPending?: boolean;
  redeemMessage?: string | null;
  onSave?: () => void | Promise<void>;
  onRedeem?: () => void | Promise<void>;
}) {
  const [termsOpen, setTermsOpen] = useState(false);

  const daysRemaining = useMemo(() => getDaysRemaining(deal.expiresAt), [deal.expiresAt]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.11),transparent_24%),linear-gradient(180deg,#09090f_0%,#11111a_48%,#07070b_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span>&gt;</span>
          <Link href={collectionHref} className="transition hover:text-white">
            {collectionLabel}
          </Link>
          <span>&gt;</span>
          <Link
            href={collectionHref}
            className="transition hover:text-white"
          >
            {deal.category}
          </Link>
          <span>&gt;</span>
          <span className="text-zinc-200">{deal.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
              <div className="relative h-[260px] sm:h-[360px] lg:h-[460px]">
                <Image
                  src={deal.imageUrl}
                  alt={deal.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 900px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,14,0.08)_0%,rgba(8,8,14,0.88)_100%)]" />
                <div className="absolute right-4 bottom-4 left-4 flex flex-wrap gap-2">
                  <Badge className="border-white/12 bg-white/10 text-white backdrop-blur-md">
                    {deal.category}
                  </Badge>
                  <Badge className={dealTypeClasses[deal.dealType]}>
                    {dealTypeLabel[deal.dealType]}
                  </Badge>
                  <Badge className="border-emerald-300/20 bg-emerald-500/14 text-emerald-100">
                    Expires {formatDate(deal.expiresAt)}
                  </Badge>
                </div>
              </div>
            </div>

            {deal.redemptionData?.url ? (
              <section id="coupontools-widget" className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] sm:p-6">
                <h3 className="text-xl font-bold tracking-tight text-white mb-4 flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-[#f5d061]" />
                  Interactive Validation & Play
                </h3>
                <div className="relative w-full h-[650px] rounded-[20px] overflow-hidden bg-black/40 border border-white/5">
                  <iframe
                    src={deal.redemptionData.url as string}
                    title="Interactive Coupon/Voucher"
                    className="absolute inset-0 w-full h-full border-none"
                    allow="geolocation; camera; microphone"
                  />
                </div>
                <p className="mt-3 text-xs text-zinc-400 text-center">
                  Use this interactive widget to play games, collect stamps, or show the code to the merchant at checkout.
                </p>
              </section>
            ) : null}

            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative size-16 overflow-hidden rounded-2xl border border-white/10 bg-white/8 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                    <Image
                      src="/api/placeholder/80/80"
                      alt={`${deal.merchantName} logo`}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">
                      {deal.merchantName}
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                      {deal.title}
                    </h1>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.26em] text-zinc-500">
                    Time left
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {daysRemaining} days
                  </p>
                </div>
              </div>

              <p className="mt-6 text-base leading-8 text-zinc-300">
                {deal.description}
              </p>

              <div className="mt-8 overflow-hidden rounded-2xl border border-white/8 bg-black/20">
                <button
                  type="button"
                  onClick={() => setTermsOpen((current) => !current)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Terms &amp; Conditions
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      Offer rules, redemption limits, and availability details.
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "size-5 text-zinc-400 transition-transform duration-300",
                      termsOpen && "rotate-180"
                    )}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {termsOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.24 }}
                      className="overflow-hidden border-t border-white/8"
                    >
                      <div className="space-y-3 px-5 py-4 text-sm leading-7 text-zinc-300">
                        {deal.termsAndConditions.map((term) => (
                          <p key={term}>{term}</p>
                        ))}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="space-y-5">
              <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(25,21,11,0.92)_0%,rgba(14,14,18,0.98)_100%)] py-0 shadow-[0_22px_70px_rgba(0,0,0,0.45)]">
                <CardContent className="space-y-6 px-6 py-6">
                  <div className="rounded-[24px] border border-amber-300/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.26)_0%,rgba(245,158,11,0.08)_100%)] p-5 text-center shadow-[0_18px_40px_rgba(245,158,11,0.18)]">
                    <p className="text-xs uppercase tracking-[0.34em] text-amber-100/80">
                      Member Benefit
                    </p>
                    <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
                      {deal.discount}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {!isSaved && !isRedeemed && !savePending ? (
                      <Button
                        type="button"
                        onClick={() => onSave?.()}
                        className="h-12 w-full rounded-full bg-[linear-gradient(135deg,#f5d061_0%,#dca93b_100%)] text-zinc-950 shadow-[0_18px_38px_rgba(245,208,97,0.22)] hover:brightness-105"
                      >
                        Save to Wallet
                      </Button>
                    ) : null}

                    {savePending ? (
                      <Button
                        type="button"
                        disabled
                        className="h-12 w-full rounded-full bg-[linear-gradient(135deg,#f5d061_0%,#dca93b_100%)] text-zinc-950"
                      >
                        <LoaderCircle className="size-4 animate-spin" />
                        Saving...
                      </Button>
                    ) : null}

                    {isSaved || isRedeemed ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 22 }}
                        className="rounded-3xl border border-emerald-400/18 bg-emerald-500/10 px-4 py-5"
                      >
                        <div className="flex items-start gap-3">
                          <motion.div
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 320, damping: 18 }}
                            className="rounded-full bg-emerald-500/18 p-2 text-emerald-300"
                          >
                            <CheckCircle2 className="size-5" />
                          </motion.div>
                          <div>
                            <p className="text-base font-semibold text-white">
                              {isRedeemed ? "Already Redeemed" : "Saved to Wallet!"}
                            </p>
                            <Link
                              href="/wallet"
                              className="mt-1 inline-flex text-sm text-emerald-300 transition hover:text-emerald-200"
                            >
                              View Wallet
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    ) : null}

                    {saveMessage ? (
                      <p className="text-sm text-zinc-400">{saveMessage}</p>
                    ) : null}

                    {isRedeemed ? (
                      <Button
                        type="button"
                        disabled
                        variant="outline"
                        className="h-12 w-full rounded-full border-emerald-400/18 bg-emerald-500/10 text-emerald-300"
                      >
                        Already Redeemed
                      </Button>
                    ) : deal.redemptionData?.url ? (
                      <Button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById("coupontools-widget");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="h-12 w-full rounded-full bg-[linear-gradient(135deg,#059669_0%,#047857_100%)] text-white shadow-[0_18px_38px_rgba(5,150,105,0.22)] hover:brightness-105"
                      >
                        Validate & Play
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        disabled={redeemPending}
                        onClick={() => onRedeem?.()}
                        variant="outline"
                        className="h-12 w-full rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-60"
                      >
                        {redeemPending ? (
                          <>
                            <LoaderCircle className="size-4 animate-spin mr-2" />
                            Redeeming...
                          </>
                        ) : (
                          "Redeem Now"
                        )}
                      </Button>
                    )}

                    {redeemMessage ? (
                      <p className="text-sm text-amber-300 mt-2">{redeemMessage}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-zinc-300">
                    <div className="flex items-start gap-3">
                      <Clock3 className="mt-0.5 size-4 text-cyan-300" />
                      <div>
                        <p className="font-medium text-white">Expires in {daysRemaining} days</p>
                        <p className="text-zinc-400">Offer ends on {formatDate(deal.expiresAt)}.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Ticket className="mt-0.5 size-4 text-amber-300" />
                      <div>
                        <p className="font-medium text-white">{dealTypeLabel[deal.dealType]}</p>
                        <p className="text-zinc-400">Ready to save first, redeem later.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.04] py-0 shadow-[0_16px_42px_rgba(0,0,0,0.3)]">
                <CardContent className="space-y-4 px-5 py-5">
                  <div className="flex items-center gap-3">
                    <div className="relative size-14 overflow-hidden rounded-2xl border border-white/10 bg-white/8">
                      <Image
                        src="/api/placeholder/72/72"
                        alt={`${deal.merchantName} logo`}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
                        Merchant
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-white">
                        {deal.merchantName}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm leading-7 text-zinc-300">
                    {deal.merchantSummary}
                  </p>

                  <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-zinc-300">
                    <MapPin className="mt-0.5 size-4 text-cyan-300" />
                    <div>
                      <p className="font-medium text-white">Location</p>
                      <p className="mt-1 text-zinc-400">{deal.merchantLocation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
