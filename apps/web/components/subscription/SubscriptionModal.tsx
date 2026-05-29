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
    const hasSelectedPlan = currentUser.hasSelectedPlan === true || currentUser.tier !== "free";
    setIsOpen(!hasSelectedPlan);
  }, [currentUser, isExcludedRoute, pathname]);

  if (!isOpen || !currentUser) {
    return null;
  }

  // Handle clicking the close (X) button
  const handleClose = async () => {
    const hasPlan = currentUser.hasSelectedPlan === true || currentUser.tier !== "free";
    
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

  const handleChoosePlan = async (tier: "free" | "basic" | "gold") => {
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
        } else {
          throw new Error("Direct upgrade failed");
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to set Free plan. Please try again.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative my-8 w-full max-w-5xl rounded-[32px] bg-white p-6 shadow-2xl md:p-10 text-slate-800">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={loadingTier !== null}
          className="absolute right-6 top-6 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          aria-label="Close"
        >
          {loadingTier === "cancelling" ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          ) : (
            <X className="h-5 w-5" />
          )}
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-start">
          <div className="flex items-center gap-2">
            <span className="font-black text-[#1b3a62] text-xl flex items-center gap-1.5 uppercase tracking-tighter">
              <span className="bg-[#0f7af7] text-white p-1 rounded-lg">P</span>
              Polokaz
            </span>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row">
            {/* Consumer Badge */}
            <div className="rounded-full border border-blue-100 bg-[#f0f6ff] px-4 py-1 text-xs font-semibold text-[#0f7af7]">
              Consumer Subscription
            </div>

            {/* Billing period switcher toggle */}
            <div className="flex items-center rounded-full bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setBillingPeriod("monthly")}
                className={`rounded-full px-4 py-1 text-xs font-bold transition-all ${
                  billingPeriod === "monthly"
                    ? "bg-[#0f7af7] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod("yearly")}
                className={`relative flex items-center gap-1.5 rounded-full px-4 py-1 text-xs font-bold transition-all ${
                  billingPeriod === "yearly"
                    ? "bg-[#0f7af7] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Yearly
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${
                  billingPeriod === "yearly"
                    ? "bg-amber-400 text-slate-900"
                    : "bg-emerald-100 text-emerald-800"
                }`}>
                  Save 30%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="mt-8 text-center">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            Perfect Plan for <span className="text-[#0f7af7] italic underline decoration-[#ef8a23]/65 decoration-wavy decoration-2 underline-offset-4 font-black">Your Needs</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-500">
            Get access to exclusive deals, special discounts, and premium offers. Pick the subscription that gives you the savings and perks you deserve.
          </p>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <p className="font-semibold">{errorMessage}</p>
          </div>
        )}

        {/* Plan Grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          
          {/* Card 1: Basic Plan (White/Blue Border) */}
          <div className="flex flex-col justify-between rounded-3xl border border-blue-400 bg-white p-6 shadow-sm relative transition-all duration-300 hover:shadow-md">
            <div>
              <h3 className="text-base font-bold text-slate-500">Basic Plan</h3>
              <div className="mt-4 flex items-baseline text-slate-900">
                <span className="text-4xl font-extrabold tracking-tight">$0</span>
                <span className="ml-1 text-sm font-semibold text-slate-400">/ month</span>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-400">Free forever - No card needed</p>
              
              <hr className="my-6 border-slate-100" />

              <ul className="space-y-4">
                {[
                  "Access to limited deals and coupons",
                  "Earn small rewards on select offers",
                  "Get notified about upcoming promotions",
                  "No payment required - join instantly",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs text-slate-600 leading-normal">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <button
                type="button"
                disabled={loadingTier !== null}
                onClick={() => handleChoosePlan("free")}
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#0f7af7] bg-[#f0f6ff] py-3 text-xs font-bold text-[#0f7af7] transition hover:bg-[#dfeafc] disabled:opacity-60"
              >
                {loadingTier === "free" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Get Started Free"
                )}
              </button>
            </div>
          </div>

          {/* Card 2: Premium Plan (Blue background, White text) */}
          <div className="flex flex-col justify-between rounded-3xl bg-[#0f7af7] p-6 text-white shadow-xl relative transition-all duration-300 hover:shadow-2xl">
            
            {/* Most Popular badge */}
            <div className="absolute right-4 top-4">
              <span className="rounded-full bg-white/20 backdrop-blur px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white">
                Most Popular
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-blue-100">Premium Plan</h3>
              <div className="mt-4 flex items-baseline text-white">
                <span className="text-4xl font-extrabold tracking-tight">
                  {billingPeriod === "monthly" ? "$20" : "$14"}
                </span>
                <span className="ml-1 text-sm font-semibold text-blue-200">/ month</span>
              </div>
              <p className="mt-2 text-xs font-semibold text-blue-100">
                {billingPeriod === "monthly" ? "Billed monthly" : "Billed yearly ($168/yr)"} - Cancel anytime
              </p>

              <hr className="my-6 border-white/10" />

              <ul className="space-y-4">
                {[
                  "Unlock more deals and higher savings",
                  "Early access to special discount campaigns",
                  "Priority customer support for queries",
                  "Monthly bonus coupons and perks",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs text-blue-50 leading-normal">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <button
                type="button"
                disabled={loadingTier !== null}
                onClick={() => handleChoosePlan("basic")}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-xs font-extrabold text-[#0f7af7] transition hover:bg-blue-50 disabled:opacity-60 shadow-lg"
              >
                {loadingTier === "basic" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#0f7af7]" />
                ) : (
                  "Purchase Plan"
                )}
              </button>
            </div>
          </div>

          {/* Card 3: Exclusive Plan (Black background, Yellow/Orange details) */}
          <div className="flex flex-col justify-between rounded-3xl bg-[#090b0e] border border-white/5 p-6 text-white shadow-xl relative transition-all duration-300 hover:shadow-2xl">
            
            {/* Exclusive Badge */}
            <div className="absolute right-4 top-4">
              <span className="rounded-full bg-amber-400 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1 shadow-md">
                <Sparkles className="h-2.5 w-2.5" />
                Exclusive
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-amber-200">Exclusive Plan</h3>
              <div className="mt-4 flex items-baseline text-white">
                <span className="text-4xl font-extrabold tracking-tight">
                  {billingPeriod === "monthly" ? "$30" : "$21"}
                </span>
                <span className="ml-1 text-sm font-semibold text-slate-400">/ month</span>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-400">
                {billingPeriod === "monthly" ? "Billed monthly" : "Billed yearly ($252/yr)"} - Cancel anytime
              </p>

              <hr className="my-6 border-white/5" />

              <ul className="space-y-4">
                {[
                  "VIP-only offers and biggest discounts",
                  "Access to limited-time and partner deals",
                  "Personalized recommendations and rewards",
                  "Premium support and priority updates",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/10 text-amber-400">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs text-slate-300 leading-normal">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <button
                type="button"
                disabled={loadingTier !== null}
                onClick={() => handleChoosePlan("gold")}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 py-3 text-xs font-extrabold text-slate-950 transition hover:bg-amber-300 disabled:opacity-60 shadow-lg"
              >
                {loadingTier === "gold" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                ) : (
                  "Purchase Plan"
                )}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
