"use client";

import { PointsWidget } from "@/components/points/PointsWidget";
import { ReferralCard } from "@/components/referral/ReferralCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatePresence, motion } from "motion/react";
import { Check, ShieldCheck, Store, X } from "lucide-react";
import { useEffect, useState } from "react";

type ConsumerTier = "free" | "basic" | "gold";

type PlanCard = {
  id: ConsumerTier;
  name: string;
  price: string;
  cta: string;
  features: string[];
  highlighted?: boolean;
};

const CURRENT_TIER: ConsumerTier = "free";

const CONSUMER_PLANS: PlanCard[] = [
  {
    id: "free",
    name: "Free",
    price: "$0/mo",
    cta: "Current Plan",
    features: [
      "Access to core member deals",
      "Save favorite offers to wallet",
      "Basic referral rewards",
      "Monthly points summary",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: "$9.99/mo",
    cta: "Upgrade to Basic",
    features: [
      "Everything in Free",
      "Priority access to new drops",
      "Bonus points on redemptions",
      "Enhanced referral earning rate",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    price: "$24.99/mo",
    cta: "Upgrade to Gold",
    highlighted: true,
    features: [
      "Everything in Basic",
      "Premium merchant-only campaigns",
      "VIP concierge-style support",
      "Highest points multiplier",
    ],
  },
];

const MERCHANT_FEATURES = [
  "Create and manage campaigns",
  "Track coupon performance and conversions",
  "Merchant redemption workflow",
  "Audience growth and referral visibility",
];

const COMPARISON_ROWS = [
  {
    label: "Browse member deals",
    free: true,
    basic: true,
    gold: true,
  },
  {
    label: "Save to wallet",
    free: true,
    basic: true,
    gold: true,
  },
  {
    label: "Priority access to new offers",
    free: false,
    basic: true,
    gold: true,
  },
  {
    label: "Bonus points multiplier",
    free: false,
    basic: true,
    gold: true,
  },
  {
    label: "Premium exclusive campaigns",
    free: false,
    basic: false,
    gold: true,
  },
];

function getCtaLabel(tier: ConsumerTier) {
  if (tier === CURRENT_TIER) return "Current Plan";

  if (CURRENT_TIER === "gold") {
    if (tier === "basic" || tier === "free") return "Downgrade";
  }

  if (CURRENT_TIER === "basic" && tier === "free") return "Downgrade";

  return tier === "basic" ? "Upgrade to Basic" : "Upgrade to Gold";
}

function PlanAvailability({
  available,
}: {
  available: boolean;
}) {
  return available ? (
    <Check className="mx-auto size-4 text-emerald-300" />
  ) : (
    <X className="mx-auto size-4 text-zinc-500" />
  );
}

export default function PlansPage() {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleUpgrade = (tier: ConsumerTier | "merchant") => {
    const planName =
      tier === "merchant"
        ? "Merchant"
        : CONSUMER_PLANS.find((plan) => plan.id === tier)?.name ?? tier;
    setToast(`Redirecting to checkout for ${planName}...`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_24%),linear-gradient(180deg,#09090f_0%,#11111a_48%,#07070b_100%)] text-white">
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
        <section className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-300/80">
            Membership Plans
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Choose the Polokaz plan that matches how you save.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">
            Compare member tiers, unlock more premium offers, and see how far
            your points and referrals can take you.
          </p>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            <section className="grid gap-5 lg:grid-cols-3">
              {CONSUMER_PLANS.map((plan) => {
                const isCurrent = plan.id === CURRENT_TIER;

                return (
                  <Card
                    key={plan.id}
                    className={`relative overflow-hidden border py-0 ${
                      plan.highlighted
                        ? "border-amber-300/30 bg-[linear-gradient(180deg,rgba(48,33,11,0.96)_0%,rgba(16,14,18,0.98)_100%)] shadow-[0_0_0_1px_rgba(245,208,97,0.12),0_26px_80px_rgba(245,208,97,0.18)]"
                        : "border-white/10 bg-[linear-gradient(180deg,rgba(24,24,31,0.96)_0%,rgba(12,12,18,0.98)_100%)] shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
                    }`}
                  >
                    {plan.highlighted ? (
                      <div className="absolute top-4 right-4">
                        <Badge className="border-amber-300/20 bg-amber-500/16 text-amber-100">
                          Most Popular
                        </Badge>
                      </div>
                    ) : null}

                    <CardContent className="space-y-6 px-6 py-6">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-semibold text-white">
                            {plan.name}
                          </h2>
                          {isCurrent ? (
                            <Badge className="border-emerald-300/20 bg-emerald-500/14 text-emerald-100">
                              Current Plan
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
                          {plan.price}
                        </p>
                      </div>

                      <div className="space-y-3">
                        {plan.features.map((feature) => (
                          <div key={feature} className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-full bg-emerald-500/14 p-1 text-emerald-300">
                              <Check className="size-3.5" />
                            </div>
                            <p className="text-sm leading-7 text-zinc-300">
                              {feature}
                            </p>
                          </div>
                        ))}
                      </div>

                      <Button
                        type="button"
                        disabled={isCurrent}
                        onClick={() => handleUpgrade(plan.id)}
                        className={`w-full rounded-full ${
                          plan.highlighted
                            ? "bg-[linear-gradient(135deg,#f5d061_0%,#dca93b_100%)] text-zinc-950 hover:brightness-105"
                            : "bg-white text-zinc-950 hover:bg-cyan-100"
                        }`}
                      >
                        {getCtaLabel(plan.id)}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            <section className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.3)] sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <ShieldCheck className="size-5 text-cyan-300" />
                <h2 className="text-2xl font-semibold text-white">
                  Feature Comparison
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-zinc-400">
                      <th className="px-4 py-3 text-left font-medium">Feature</th>
                      <th className="px-4 py-3 text-center font-medium">Free</th>
                      <th className="px-4 py-3 text-center font-medium">Basic</th>
                      <th className="px-4 py-3 text-center font-medium">Gold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map((row) => (
                      <tr key={row.label}>
                        <td className="rounded-l-2xl border border-white/8 bg-black/20 px-4 py-4 text-white">
                          {row.label}
                        </td>
                        <td className="border-y border-white/8 bg-black/20 px-4 py-4 text-center">
                          <PlanAvailability available={row.free} />
                        </td>
                        <td className="border-y border-white/8 bg-black/20 px-4 py-4 text-center">
                          <PlanAvailability available={row.basic} />
                        </td>
                        <td className="rounded-r-2xl border border-white/8 bg-black/20 px-4 py-4 text-center">
                          <PlanAvailability available={row.gold} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-[30px] border border-amber-300/18 bg-[linear-gradient(180deg,rgba(46,32,12,0.92)_0%,rgba(13,13,18,0.98)_100%)] p-6 shadow-[0_20px_70px_rgba(245,208,97,0.12)] sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3">
                    <Store className="size-5 text-amber-200" />
                    <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200/80">
                      For Businesses
                    </p>
                  </div>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                    Merchant Plan
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-zinc-300">
                    Launch campaigns, convert members into paying customers, and
                    manage performance from one polished merchant dashboard.
                  </p>
                  <div className="mt-6 space-y-3">
                    {MERCHANT_FEATURES.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-amber-500/16 p-1 text-amber-200">
                          <Check className="size-3.5" />
                        </div>
                        <p className="text-sm leading-7 text-zinc-300">
                          {feature}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full max-w-sm rounded-[26px] border border-white/10 bg-black/25 p-5">
                  <Badge className="border-transparent bg-white/12 text-white">
                    Merchant
                  </Badge>
                  <p className="mt-4 text-4xl font-semibold tracking-tight text-white">
                    Custom
                  </p>
                  <p className="mt-2 text-sm leading-7 text-zinc-400">
                    Tailored pricing based on campaigns, merchants, and support
                    needs.
                  </p>
                  <Button
                    type="button"
                    onClick={() => handleUpgrade("merchant")}
                    className="mt-6 w-full rounded-full bg-[linear-gradient(135deg,#f5d061_0%,#dca93b_100%)] text-zinc-950 hover:brightness-105"
                  >
                    Get Started as Merchant
                  </Button>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <PointsWidget />
            <ReferralCard />
          </div>
        </div>
      </div>
    </div>
  );
}
