"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@polokaz/auth/client";
import { clientFetch } from "@/lib/api/client-fetch";
import { Check, X, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export function SubscriptionModal() {
  const router = useRouter();
  const pathname = usePathname();
  const session = authClient.useSession();

  const [isOpen, setIsOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Exclude auth routes, admin routes, and public landing pages
  const isExcludedRoute =
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/admin");

  const currentUser = session.data?.user as {
    id: string;
    name: string;
    email: string;
    role?: string | null;
    tier?: string | null;
    hasSelectedPlan?: boolean | null;
  } | undefined;

  useEffect(() => {
    // If not logged in or on excluded routes, do not show the popup
    if (!currentUser || isExcludedRoute) {
      setIsOpen(false);
      return;
    }

    // Merchants and Admins do not need to choose consumer subscription plans
    if (currentUser.role === "merchant" || currentUser.role === "admin") {
      setIsOpen(false);
      return;
    }

    // Show popup if the user has not chosen a subscription tier yet
    const hasSelectedPlan = currentUser.hasSelectedPlan === true || (currentUser.tier !== "free" && currentUser.tier !== null && currentUser.tier !== undefined);
    setIsOpen(!hasSelectedPlan);
  }, [currentUser, isExcludedRoute, pathname]);

  if (!currentUser) {
    return null;
  }

  // Handle clicking the close (X) button
  const handleClose = async () => {
    const hasPlan = currentUser.hasSelectedPlan === true || (currentUser.tier !== "free" && currentUser.tier !== null && currentUser.tier !== undefined);
    
    if (hasPlan) {
      setIsOpen(false);
    } else {
      // If a new user cancels the subscription popup without selecting a plan,
      // we log them out and redirect to home to prevent bypassing the gate.
      try {
        setLoadingTier("cancelling");
        await authClient.signOut();
        router.push("/");
        router.refresh();
      } catch (err) {
        setErrorMessage("Failed to cancel session cleanly.");
      } finally {
        setLoadingTier(null);
      }
    }
  };

  const handleChoosePlan = async (tier: "free" | "regular" | "premium") => {
    setLoadingTier(tier);
    setErrorMessage(null);

    // Free Plan Upgrade (Direct DB Activation)
    if (tier === "free") {
      try {
        const data = await clientFetch<{ success: boolean }>("/api/plans/upgrade", {
          method: "POST",
          body: JSON.stringify({ tier: "free" }),
        });

        if (data.success) {
          await authClient.getSession();
          setIsOpen(false);
          router.refresh();
          router.push("/dashboard");
        } else {
          throw new Error("Direct upgrade failed");
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to set Basic plan. Please try again.");
      } finally {
        setLoadingTier(null);
      }
      return;
    }

    // Paid Plan Upgrades (Stripe Checkout redirect)
    try {
      const stripeRes = await clientFetch<{ url: string }>("/api/stripe/create-checkout", {
        method: "POST",
        body: JSON.stringify({
          tier,
          interval: billingPeriod,
        }),
      });

      if (stripeRes?.url) {
        window.location.href = stripeRes.url;
      } else {
        throw new Error("Stripe checkout redirect not returned");
      }
    } catch (err: any) {
      console.warn("Stripe Checkout Session creation failed. Falling back to direct database upgrade for testing.", err);
      
      // Fallback upgrade for dev/testing if Stripe credentials are not set
      try {
        const data = await clientFetch<{ success: boolean }>("/api/plans/upgrade", {
          method: "POST",
          body: JSON.stringify({ tier }),
        });

        if (data.success) {
          await authClient.getSession();
          setIsOpen(false);
          router.refresh();
          router.push("/dashboard");
        } else {
          throw new Error("Dev fallback upgrade failed");
        }
      } catch (innerErr: any) {
        setErrorMessage("Stripe billing integration offline. Direct upgrade failed.");
      }
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
            className="relative my-8 w-full max-w-5xl rounded-[32px] border border-zinc-800/80 bg-[#090b0f] p-6 shadow-[0_0_50px_rgba(0,0,0,0.85)] md:p-10 text-white overflow-hidden"
          >
            {/* Ambient Background Glows */}
            <div className="absolute -left-1/4 -top-1/4 h-[350px] w-[350px] rounded-full bg-blue-500/10 blur-[130px] pointer-events-none" />
            <div className="absolute -right-1/4 -bottom-1/4 h-[350px] w-[350px] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={handleClose}
              disabled={loadingTier !== null}
              className="absolute right-6 top-6 rounded-full p-2 text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition"
              aria-label="Close"
            >
              {loadingTier === "cancelling" ? (
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </button>

            {/* Modal Header */}
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-start relative z-10">
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-xl flex items-center gap-1.5 uppercase tracking-tighter">
                  <span className="bg-[#0f7af7] text-white p-1.5 rounded-lg flex items-center justify-center font-black">P</span>
                  Polokaz
                </span>
              </div>

              <div className="flex flex-col items-center gap-4 sm:flex-row">
                {/* Consumer Badge */}
                <div className="rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-1 text-xs font-semibold text-blue-400">
                  Consumer Subscription
                </div>

                {/* Billing period switcher toggle */}
                <div className="flex items-center rounded-full bg-zinc-900/90 p-1 border border-zinc-850">
                  <button
                    type="button"
                    onClick={() => setBillingPeriod("monthly")}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                      billingPeriod === "monthly"
                        ? "bg-[#0f7af7] text-white shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingPeriod("yearly")}
                    className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                      billingPeriod === "yearly"
                        ? "bg-[#0f7af7] text-white shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Yearly
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${
                      billingPeriod === "yearly"
                        ? "bg-amber-400 text-slate-950"
                        : "bg-amber-400/10 text-amber-300 border border-amber-400/20"
                    }`}>
                      Save 30%
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Headline */}
            <div className="mt-8 text-center relative z-10">
              <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                Choose Your <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-amber-300 bg-clip-text text-transparent italic underline decoration-amber-500/35 decoration-wavy decoration-2 underline-offset-4 font-black">Polokaz Membership</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
                Unlock the ultimate value. Save on book purchases, gain exclusive dealer access, and maximize your referral incentives.
              </p>
            </div>

            {/* Error Feedback */}
            {errorMessage && (
              <div className="mt-6 flex items-center gap-3 rounded-2xl bg-red-950/40 border border-red-500/30 p-4 text-sm text-red-300 relative z-10">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                <p className="font-semibold">{errorMessage}</p>
              </div>
            )}

            {/* Plan Grid */}
            <div className="mt-8 grid gap-6 md:grid-cols-3 relative z-10">
              
              {/* Card 1: Basic Plan (Free) */}
              <div className="flex flex-col justify-between rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6 shadow-sm relative transition-all duration-300 hover:border-zinc-700/60 hover:bg-zinc-900/40">
                <div>
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Basic Membership</h3>
                  <div className="mt-4 flex items-baseline text-white">
                    <span className="text-4xl font-extrabold tracking-tight">$0</span>
                    <span className="ml-1 text-sm font-semibold text-zinc-500">/ month</span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-zinc-500">Free forever - No card needed</p>
                  
                  <hr className="my-6 border-zinc-800" />

                  <ul className="space-y-4">
                    {[
                      "Limited catalog access",
                      "Basic referral participation",
                      "Save deals to wallet",
                      "Standard support",
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-400">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs text-zinc-400 leading-normal">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <button
                    type="button"
                    disabled={loadingTier !== null}
                    onClick={() => handleChoosePlan("free")}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/50 py-3 text-xs font-bold text-white transition hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {loadingTier === "free" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Get Started Free"
                    )}
                  </button>
                </div>
              </div>

              {/* Card 2: Regular Plan */}
              <div className="flex flex-col justify-between rounded-3xl border border-blue-500/25 bg-gradient-to-b from-blue-950/20 to-zinc-950/60 p-6 shadow-xl relative transition-all duration-300 hover:border-blue-500/40 hover:shadow-blue-500/5">
                
                {/* Most Popular badge */}
                <div className="absolute right-4 top-4">
                  <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-blue-300">
                    Most Popular
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Regular Membership</h3>
                  <div className="mt-4 flex items-baseline text-white">
                    <span className="text-4xl font-extrabold tracking-tight">
                      {billingPeriod === "monthly" ? "$5" : "$3.50"}
                    </span>
                    <span className="ml-1 text-sm font-semibold text-zinc-500">/ month</span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-blue-300/80">
                    {billingPeriod === "monthly" ? "Billed monthly" : "Billed yearly ($42/yr)"}
                  </p>

                  <hr className="my-6 border-zinc-800" />

                  <ul className="space-y-4">
                    {[
                      "Expanded catalog access",
                      "Regular referral eligibility",
                      "Enhanced reward options",
                      "Priority support",
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-950/50 text-blue-400 border border-blue-800/20">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs text-zinc-300 leading-normal">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <button
                    type="button"
                    disabled={loadingTier !== null}
                    onClick={() => handleChoosePlan("regular")}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0f7af7] py-3 text-xs font-extrabold text-white transition hover:bg-blue-600 disabled:opacity-60 shadow-lg shadow-blue-500/10"
                  >
                    {loadingTier === "regular" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      "Subscribe Now"
                    )}
                  </button>
                </div>
              </div>

              {/* Card 3: Premium Plan */}
              <div className="flex flex-col justify-between rounded-3xl border border-amber-500/25 bg-gradient-to-b from-amber-950/20 to-zinc-950/60 p-6 shadow-xl relative transition-all duration-300 hover:border-amber-500/40 hover:shadow-amber-500/5">
                
                {/* Premium Badge */}
                <div className="absolute right-4 top-4">
                  <span className="rounded-full bg-amber-400 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-zinc-950 flex items-center gap-1 shadow-md">
                    <Sparkles className="h-2.5 w-2.5" />
                    Premium VIP
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Premium Membership</h3>
                  <div className="mt-4 flex items-baseline text-white">
                    <span className="text-4xl font-extrabold tracking-tight">
                      {billingPeriod === "monthly" ? "$15" : "$10.50"}
                    </span>
                    <span className="ml-1 text-sm font-semibold text-zinc-500">/ month</span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-amber-300/80">
                    {billingPeriod === "monthly" ? "Billed monthly" : "Billed yearly ($126/yr)"}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-1 font-semibold">
                    *Plus $25 activation fee (setup)
                  </p>

                  <hr className="my-6 border-zinc-800" />

                  <ul className="space-y-4">
                    {[
                      "Full catalog access",
                      "Vendor referral eligibility",
                      "Advanced incentive opportunities",
                      "Direct payouts & residual rewards",
                      "Exclusive performance bonuses",
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-950/50 text-amber-400 border border-amber-800/20">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs text-zinc-300 leading-normal">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <button
                    type="button"
                    disabled={loadingTier !== null}
                    onClick={() => handleChoosePlan("premium")}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 py-3 text-xs font-extrabold text-zinc-950 transition hover:from-amber-300 hover:to-amber-400 disabled:opacity-60 shadow-lg shadow-amber-500/10"
                  >
                    {loadingTier === "premium" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                    ) : (
                      "Get Premium"
                    )}
                  </button>
                </div>
              </div>

            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
