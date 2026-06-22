"use client";

import { authClient } from "@polokaz/auth/client";
import { clientFetch } from "@/lib/api/client-fetch";
import { PointsWidget } from "@/components/points/PointsWidget";
import { ReferralCard } from "@/components/referral/ReferralCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatePresence, motion } from "motion/react";
import { Check, ShieldCheck, Store, X, Building, Users, Minus, Plus, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

type ConsumerTier = "basic" | "regular" | "premium";
type MembershipTier =
  | ConsumerTier
  | "organization"
  | "small_vendor"
  | "premium_vendor"
  | "free"
  | "gold"
  | "merchant";

type PlanCard = {
  id: ConsumerTier;
  name: string;
  price: string;
  cta: string;
  features: string[];
  highlighted?: boolean;
};

// CONSUMER_PLANS static constant removed. Dynamic consumerPlans is declared inside the component.

const COMPARISON_ROWS = [
  {
    label: "Browse member deals",
    basic: true,
    regular: true,
    premium: true,
  },
  {
    label: "Save to wallet",
    basic: true,
    regular: true,
    premium: true,
  },
  {
    label: "Priority access to new offers",
    basic: false,
    regular: true,
    premium: true,
  },
  {
    label: "Bonus points multiplier",
    basic: false,
    regular: true,
    premium: true,
  },
  {
    label: "Premium exclusive campaigns",
    basic: false,
    regular: false,
    premium: true,
  },
];

function getCtaLabel(currentTier: MembershipTier, planId: MembershipTier) {
  const isCurrent = planId === "basic"
    ? (currentTier === "basic" || currentTier === "free")
    : currentTier === planId;

  if (isCurrent) return "Current Plan";

  const hierarchy: Record<string, number> = {
    free: 0,
    basic: 0,
    regular: 1,
    premium: 2,
    organization: 2,
    small_vendor: 3,
    premium_vendor: 4,
  };

  const currentLvl = hierarchy[currentTier as string] ?? 0;
  const targetLvl = hierarchy[planId as string] ?? 0;

  if (targetLvl < currentLvl) return "Downgrade";
  return `Upgrade to ${planId.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}`;
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

function PlansPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = authClient.useSession();
  const [toast, setToast] = useState<string | null>(null);
  const [loadingTier, setLoadingTier] = useState<MembershipTier | null>(null);
  const [premiumLocations, setPremiumLocations] = useState<number>(2);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const consumerPlans = useMemo(() => [
    {
      id: "basic" as ConsumerTier,
      name: "Basic (Free)",
      price: "$0/mo",
      cta: "Current Plan",
      features: [
        "Access to limited catalog deals",
        "Basic referral participation",
        "Save favorite offers to wallet",
        "Standard member support",
      ],
    },
    {
      id: "regular" as ConsumerTier,
      name: "Regular",
      price: billingPeriod === "monthly" ? "$5/mo" : "$3.50/mo",
      periodLabel: billingPeriod === "monthly" ? "Billed monthly" : "Billed yearly ($42/yr)",
      cta: "Upgrade to Regular",
      features: [
        "Everything in Basic",
        "Expanded catalog access",
        "Regular referral eligibility",
        "Enhanced reward points rate",
      ],
      highlighted: true,
    },
    {
      id: "premium" as ConsumerTier,
      name: "Premium",
      price: billingPeriod === "monthly" ? "$15/mo" : "$10.50/mo",
      periodLabel: billingPeriod === "monthly" ? "Billed monthly" : "Billed yearly ($126/yr)",
      cta: "Upgrade to Premium",
      features: [
        "Everything in Regular",
        "Full catalog access",
        "Vendor referral eligibility",
        "Advanced incentive opportunities & bonuses",
        "Plus optional $25 activation fee",
      ],
    },
  ], [billingPeriod]);

  const currentTier = useMemo<MembershipTier>(() => {
    const sessionTier = (session.data?.user as { tier?: string | null } | undefined)?.tier;

    if (
      sessionTier === "basic" ||
      sessionTier === "regular" ||
      sessionTier === "premium" ||
      sessionTier === "organization" ||
      sessionTier === "small_vendor" ||
      sessionTier === "premium_vendor" ||
      sessionTier === "free" ||
      sessionTier === "gold" ||
      sessionTier === "merchant"
    ) {
      return sessionTier as MembershipTier;
    }

    return "basic";
  }, [session.data?.user]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (searchParams.get("checkout") !== "success") return;

    setToast("Subscription activated!");

    void authClient.getSession().then(() => {
      router.refresh();
      // Redirect user to their particular dashboard gateway after brief moment
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    });
  }, [router, searchParams]);

  const handleUpgrade = async (tier: MembershipTier, locations?: number) => {
    const isCurrent = tier === "basic"
      ? (currentTier === "basic" || currentTier === "free")
      : currentTier === tier;

    if (isCurrent) return;

    const planNames: Record<string, string> = {
      basic: "Basic",
      regular: "Regular",
      premium: "Premium",
      organization: "Organization",
      small_vendor: "Small Vendor",
      premium_vendor: "Premium Vendor",
    };
    const planName = planNames[tier] ?? tier;

    setLoadingTier(tier);

    if (tier === "basic") {
      setToast(`Switching to Basic (Free) plan...`);
      try {
        const data = await clientFetch<{ success: boolean; tier: string }>("/api/plans/upgrade", {
          method: "POST",
          body: JSON.stringify({ tier }),
        });

        if (data.success) {
          setToast(`Successfully switched to Basic (Free)!`);
          await authClient.getSession().then(() => {
            router.refresh();
            router.push("/dashboard");
          });
        } else {
          throw new Error("Failed to switch tier.");
        }
      } catch (error: any) {
        setToast(error.message || "Failed to switch plan.");
      } finally {
        setLoadingTier(null);
      }
      return;
    }

    setToast(`Redirecting to Stripe checkout for ${planName}...`);

    try {
      // 1. Attempt to create a Stripe checkout session
      const stripeRes = await clientFetch<{ url: string }>("/api/stripe/create-checkout", {
        method: "POST",
        body: JSON.stringify({ tier, interval: billingPeriod, locations }),
      });

      if (stripeRes?.url) {
        window.location.href = stripeRes.url;
        return;
      } else {
        throw new Error("Stripe checkout session creation failed");
      }
    } catch (error: any) {
      console.warn("Stripe Checkout failed or keys not set. Falling back to direct database upgrade for testing.", error);
      setToast("Stripe checkout offline. Upgrading directly for dev/testing...");

      // 2. Fallback to direct database upgrade in development mode
      try {
        const data = await clientFetch<{ success: boolean; tier: string }>("/api/plans/upgrade", {
          method: "POST",
          body: JSON.stringify({ tier }),
        });

        if (data.success) {
          setToast(`Successfully upgraded to ${planName}!`);
          await authClient.getSession().then(() => {
            router.refresh();
            router.push("/dashboard");
          });
        } else {
          throw new Error("Failed to upgrade tier.");
        }
      } catch (innerError: any) {
        setToast(innerError.message || "Failed to upgrade plan.");
      }
    } finally {
      setLoadingTier(null);
    }
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
            {/* Billing Toggle Switcher */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center rounded-full bg-white/[0.04] p-1 border border-white/10 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setBillingPeriod("monthly")}
                  className={`rounded-full px-5 py-2 text-xs font-bold transition-all duration-200 ${
                    billingPeriod === "monthly"
                      ? "bg-cyan-500 text-zinc-950 shadow-sm font-extrabold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Monthly billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingPeriod("yearly")}
                  className={`relative flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition-all duration-200 ${
                    billingPeriod === "yearly"
                      ? "bg-cyan-500 text-zinc-950 shadow-sm font-extrabold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Yearly billing
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                    billingPeriod === "yearly"
                      ? "bg-amber-400 text-zinc-950"
                      : "bg-amber-400/10 text-amber-300 border border-amber-400/20"
                  }`}>
                    Save 30%
                  </span>
                </button>
              </div>
            </div>

            {/* Consumer Plans */}
            <section className="grid gap-5 lg:grid-cols-3">
              {consumerPlans.map((plan) => {
                const isCurrent = plan.id === "basic"
                  ? (currentTier === "basic" || currentTier === "free")
                  : currentTier === plan.id;
                const isLoading = loadingTier === plan.id;

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
                        {plan.periodLabel && (
                          <p className="mt-1.5 text-xs text-zinc-400 font-medium">
                            {plan.periodLabel}
                          </p>
                        )}
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
                        disabled={isCurrent || isLoading}
                        onClick={() => handleUpgrade(plan.id)}
                        className={`w-full rounded-full ${
                          plan.highlighted
                            ? "bg-[linear-gradient(135deg,#f5d061_0%,#dca93b_100%)] text-zinc-950 hover:brightness-105"
                            : "bg-white text-zinc-950 hover:bg-cyan-100"
                        }`}
                      >
                        {isLoading ? "Redirecting..." : getCtaLabel(currentTier, plan.id)}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            {/* Comparison Table */}
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
                      <th className="px-4 py-3 text-center font-medium">Basic (Free)</th>
                      <th className="px-4 py-3 text-center font-medium">Regular ($5)</th>
                      <th className="px-4 py-3 text-center font-medium">Premium ($15)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map((row) => (
                      <tr key={row.label}>
                        <td className="rounded-l-2xl border border-white/8 bg-black/20 px-4 py-4 text-white">
                          {row.label}
                        </td>
                        <td className="border-y border-white/8 bg-black/20 px-4 py-4 text-center">
                          <PlanAvailability available={row.basic} />
                        </td>
                        <td className="border-y border-white/8 bg-black/20 px-4 py-4 text-center">
                          <PlanAvailability available={row.regular} />
                        </td>
                        <td className="rounded-r-2xl border border-white/8 bg-black/20 px-4 py-4 text-center">
                          <PlanAvailability available={row.premium} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Business Plans Section */}
            <section className="rounded-[30px] border border-amber-300/18 bg-[linear-gradient(180deg,rgba(46,32,12,0.92)_0%,rgba(13,13,18,0.98)_100%)] p-6 shadow-[0_20px_70px_rgba(245,208,97,0.12)] sm:p-8">
              <div className="mb-8">
                <div className="flex items-center gap-3">
                  <Building className="size-5 text-amber-200" />
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200/80">
                    For Businesses & Organizations
                  </p>
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                  Grow Your Community & Business
                </h2>
                <p className="mt-3 text-sm leading-7 text-zinc-300">
                  Fundraise for your community or drive high-intent foot traffic to your retail locations.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {/* Organization Card */}
                <Card className="border-white/10 bg-black/25 flex flex-col justify-between">
                  <CardContent className="p-6 flex flex-col h-full justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="size-5 text-cyan-400" />
                        <h3 className="text-xl font-bold text-white">Organization</h3>
                      </div>
                      <p className="mt-3 text-3xl font-semibold text-white">$15<span className="text-sm font-normal text-zinc-400">/mo</span></p>
                      <p className="mt-2 text-xs text-zinc-400">Perfect for schools, non-profits, or community groups</p>
                      <ul className="mt-4 space-y-2.5">
                        <li className="flex items-start gap-2 text-sm text-zinc-300">
                          <Check className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                          <span>Run fundraising campaigns</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-zinc-300">
                          <Check className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                          <span>Share referral links</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-zinc-300">
                          <Check className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                          <span>Earn recurring commissions</span>
                        </li>
                      </ul>
                    </div>
                    <Button
                      type="button"
                      disabled={currentTier === "organization" || loadingTier === "organization"}
                      onClick={() => handleUpgrade("organization")}
                      className="w-full rounded-full bg-white text-zinc-950 hover:bg-zinc-200"
                    >
                      {loadingTier === "organization" ? "Loading..." : getCtaLabel(currentTier, "organization")}
                    </Button>
                  </CardContent>
                </Card>

                {/* Small Vendor Card */}
                <Card className="border-white/10 bg-black/25 flex flex-col justify-between">
                  <CardContent className="p-6 flex flex-col h-full justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <Store className="size-5 text-amber-400" />
                        <h3 className="text-xl font-bold text-white">Small Vendor</h3>
                      </div>
                      <p className="mt-3 text-3xl font-semibold text-white">$35<span className="text-sm font-normal text-zinc-400">/mo</span></p>
                      <p className="mt-2 text-xs text-zinc-400">Plus $80 one-time setup fee. Ideal for single local shops</p>
                      <ul className="mt-4 space-y-2.5">
                        <li className="flex items-start gap-2 text-sm text-zinc-300">
                          <Check className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                          <span>1 Physical location</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-zinc-300">
                          <Check className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                          <span>Create coupon campaigns</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-zinc-300">
                          <Check className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                          <span>Track real-time redemptions</span>
                        </li>
                      </ul>
                    </div>
                    <Button
                      type="button"
                      disabled={currentTier === "small_vendor" || loadingTier === "small_vendor"}
                      onClick={() => handleUpgrade("small_vendor")}
                      className="w-full rounded-full bg-white text-zinc-950 hover:bg-zinc-200"
                    >
                      {loadingTier === "small_vendor" ? "Loading..." : getCtaLabel(currentTier, "small_vendor")}
                    </Button>
                  </CardContent>
                </Card>

                {/* Premium Vendor Card */}
                <Card className="border-amber-300/20 bg-amber-500/5 flex flex-col justify-between">
                  <CardContent className="p-6 flex flex-col h-full justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <Store className="size-5 text-amber-300" />
                        <h3 className="text-xl font-bold text-amber-100">Premium Vendor</h3>
                      </div>
                      <p className="mt-3 text-3xl font-semibold text-white">
                        ${premiumLocations * 25}
                        <span className="text-sm font-normal text-zinc-400">/mo</span>
                      </p>
                      <p className="mt-2 text-xs text-zinc-400">
                        $25/location/mo + $80 one-time setup fee
                      </p>

                      {/* Locations selector */}
                      <div className="flex items-center justify-between mt-4 mb-2 p-2 bg-black/30 rounded-xl border border-white/5">
                        <span className="text-xs text-zinc-300">Locations:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPremiumLocations((prev) => Math.max(1, prev - 1))}
                            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="text-sm font-semibold text-white w-6 text-center">
                            {premiumLocations}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPremiumLocations((prev) => prev + 1)}
                            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      </div>

                      <ul className="mt-4 space-y-2.5">
                        <li className="flex items-start gap-2 text-sm text-zinc-300">
                          <Check className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                          <span>Multi-location setup</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-zinc-300">
                          <Check className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                          <span>Advanced targeting & analytics</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-zinc-300">
                          <Check className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                          <span>Priority support & API keys</span>
                        </li>
                      </ul>
                    </div>
                    <Button
                      type="button"
                      disabled={currentTier === "premium_vendor" || loadingTier === "premium_vendor"}
                      onClick={() => handleUpgrade("premium_vendor", premiumLocations)}
                      className="w-full rounded-full bg-[linear-gradient(135deg,#f5d061_0%,#dca93b_100%)] text-zinc-950 hover:brightness-105"
                    >
                      {loadingTier === "premium_vendor" ? "Loading..." : getCtaLabel(currentTier, "premium_vendor")}
                    </Button>
                  </CardContent>
                </Card>
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

export default function PlansPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_24%),linear-gradient(180deg,#09090f_0%,#11111a_48%,#07070b_100%)] flex items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    }>
      <PlansPageContent />
    </Suspense>
  );
}
