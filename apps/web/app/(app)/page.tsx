export const dynamic = "force-dynamic";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { getServerSession } from "@/lib/auth/server-session";
import { getUserRole } from "@polokaz/auth/roles";
import {
  ArrowRight,
  Gift,
  Users,
  Sparkles,
  Check,
  Building,
  Store,
  Coins,
  Percent,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const steps = [
  "Start on this landing page when you arrive without a referral link.",
  "Use Get started to open the welcome screen, then choose your path.",
  "Open the about page to learn what Polokaz is and continue to sign up.",
  "Create your account, sign in anytime, and access your dashboard.",
];

const useCases = [
  "Members can discover deals, redeem rewards, and share referral links.",
  "Shoppers can browse curated offers and keep track of saved opportunities.",
  "Merchants can onboard later as the merchant flow expands.",
  "Logged-in users are routed straight to the right dashboard for their role.",
];

export default async function Home() {
  const session = await getServerSession();

  if (session?.session) {
    const role = getUserRole(session.user);

    if (role === "admin") {
      redirect("/admin");
    }

    if (role === "merchant") {
      redirect("/merchant");
    }

    redirect("/customer");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#030008] dark:text-slate-100 transition-colors duration-300 selection:bg-indigo-500/30 selection:text-white">
      {/* Background radial glow effects and overlays */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Glow Effects */}
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[150px] dark:bg-indigo-600/10 bg-indigo-500/5" />
        <div className="absolute top-[20%] right-[-10%] h-[700px] w-[700px] rounded-full bg-purple-600/8 blur-[180px] dark:bg-purple-600/8 bg-purple-500/4" />
        <div className="absolute bottom-[10%] left-[-20%] h-[800px] w-[800px] rounded-full bg-cyan-600/6 blur-[200px] dark:bg-cyan-600/6 bg-cyan-500/3" />
        <div className="absolute -bottom-40 right-[-10%] h-[600px] w-[600px] rounded-full bg-indigo-500/8 blur-[150px] dark:bg-indigo-500/8 bg-indigo-500/4" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />
      </div>

      {/* Header (Navbar) */}
      <header className="relative z-10 mx-auto max-w-7xl px-6 py-6 flex items-center justify-between border-b border-slate-200/60 dark:border-white/5 backdrop-blur-sm">
        <BrandLogo href="/" size="md" priority />
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 rounded-full px-5 transition-all">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild className="relative overflow-hidden text-sm font-semibold text-slate-950 bg-gradient-to-r from-indigo-200 via-cyan-100 to-indigo-100 hover:brightness-105 rounded-full px-6 py-2 shadow-[0_4px_20px_rgba(99,102,241,0.15)] dark:shadow-[0_4px_20px_rgba(99,102,241,0.2)] transition-all duration-300">
            <Link href="/sign-up/about" className="flex items-center gap-1.5">
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4.5 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.06)] dark:shadow-[0_0_20px_rgba(99,102,241,0.1)] backdrop-blur-md">
          <Sparkles className="size-3.5 text-cyan-500 dark:text-cyan-300 animate-pulse" />
          Memberships · Deals · Rewards
        </div>

        {/* Heading */}
        <h1 className="mt-8 mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl leading-[1.1] sm:leading-[1.1] lg:leading-[1.1]">
          Unlock exclusive deals. <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 dark:from-indigo-400 dark:via-purple-300 dark:to-cyan-300">
            Earn while you share.
          </span>
        </h1>

        {/* Subheading */}
        <p className="mt-6 mx-auto max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-400 sm:text-lg">
          Join Polokaz to save on your favorite local merchants, redeem coupons, and earn cash commissions or points every time your friends sign up.
        </p>

        {/* Hero CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-8 shadow-[0_0_30px_rgba(99,102,241,0.2)] dark:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all duration-300 hover:scale-[1.02]">
            <Link href="/sign-up/about" className="flex items-center gap-2">
              Start free
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 px-8 backdrop-blur-sm transition-all duration-300">
            <Link href="#pricing">See pricing</Link>
          </Button>
        </div>

        {/* Metrics Row */}
        <div className="mt-20 mx-auto max-w-5xl grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { value: "10k+", label: "Active Members", desc: "Saving every single day" },
            { value: "500+", label: "Local Merchants", desc: "Offering curated coupons" },
            { value: "$2M+", label: "Member Savings", desc: "Earned & saved in wallets" },
          ].map((metric, i) => (
            <div key={i} className="relative group overflow-hidden rounded-2xl border border-slate-200 dark:border-white/5 bg-white/40 dark:bg-white/[0.02] p-6 backdrop-blur-md hover:border-indigo-500/20 hover:bg-white/80 dark:hover:bg-white/[0.04] transition-all duration-300 shadow-sm dark:shadow-none">
              <div className="absolute -inset-px bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-950 to-slate-700 dark:from-white dark:to-slate-300 sm:text-4xl">
                  {metric.value}
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-300">{metric.label}</div>
                <div className="mt-1 text-xs text-slate-500">{metric.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 border-t border-slate-200 dark:border-white/5 bg-slate-100/30 dark:bg-white/[0.01] py-24 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-400">Value Propositions</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Designed for shopper rewards & growth</h2>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                title: "Exclusive deals",
                desc: "Hand-picked coupons & vouchers from your favorite local spots, refreshed automatically.",
                icon: Gift,
                glow: "from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10",
                iconBg: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20",
              },
              {
                title: "Earn rewards",
                desc: "Points or cash commissions every time you redeem or refer. Premium members get paid.",
                icon: Coins,
                glow: "from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10",
                iconBg: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-500/20",
              },
              {
                title: "Scale to 50%",
                desc: "Tiered commission schedule. Top affiliates earn up to 50% on every active referral.",
                icon: Percent,
                glow: "from-cyan-500/5 to-blue-500/5 dark:from-cyan-500/10 dark:to-blue-500/10",
                iconBg: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200/50 dark:border-cyan-500/20",
              },
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-950/40 p-8 hover:border-indigo-500/20 hover:bg-white dark:hover:bg-slate-950/60 transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feat.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className={`inline-flex items-center justify-center h-12 w-12 rounded-2xl ${feat.iconBg} mb-6`}>
                        <Icon className="size-5" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors duration-200">{feat.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{feat.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Membership Pricing Section (Consumers) */}
      <section id="pricing" className="relative z-10 border-t border-slate-200 dark:border-white/5 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400">Membership plans</p>
            <h2 className="mt-3 text-4xl font-extrabold text-slate-900 dark:text-white sm:text-5xl">Choose your membership</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm sm:text-base">Start free. Upgrade anytime. Cancel whenever.</p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
            {[
              {
                id: "basic",
                name: "Basic",
                price: "$0",
                period: "forever",
                desc: "Explore the community, save coupons, and start sharing with friends.",
                features: ["Access to limited catalog deals", "Basic referral participation", "Save favorite offers to wallet"],
                cta: "Start free",
                link: "/sign-up/about",
                highlight: false,
              },
              {
                id: "regular",
                name: "Regular",
                price: "$5",
                period: "/month",
                desc: "Unlock deeper catalog access and start generating points on redemptions.",
                features: ["Everything in Basic", "Expanded catalog access", "Regular referral eligibility", "Earn points on redemptions"],
                cta: "Get Regular",
                link: "/sign-up/about",
                highlight: false,
              },
              {
                id: "premium",
                name: "Premium",
                price: "$15",
                period: "/month",
                desc: "Maximize your earnings with cash commissions and absolute campaign access.",
                features: [
                  "Everything in Regular",
                  "Full catalog access",
                  "Vendor referral eligibility",
                  "Cash commissions on referrals",
                  "Advanced incentives & perks",
                ],
                cta: "Get Premium",
                link: "/sign-up/about",
                highlight: true,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-300 ${
                  plan.highlight
                    ? "border border-indigo-500/20 bg-gradient-to-b from-indigo-50/50 to-slate-100/80 dark:border-indigo-500/30 dark:from-indigo-950/40 dark:to-slate-950/80 shadow-md dark:shadow-[0_0_40px_rgba(99,102,241,0.15)] scale-100 lg:scale-[1.03] lg:-translate-y-1"
                    : "border border-slate-200 dark:border-white/5 bg-white/40 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-white/10"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute top-0 right-8 -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{plan.price}</span>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{plan.period}</span>
                  </div>
                  <p className="mt-4 text-xs leading-5 text-slate-600 dark:text-slate-400">{plan.desc}</p>
                  <ul className="mt-6 space-y-3.5">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                        <Check className="size-4 shrink-0 text-emerald-500 dark:text-emerald-400 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8">
                  <Button
                    asChild
                    className={`w-full rounded-full h-11 text-xs font-bold transition-all duration-300 ${
                      plan.highlight
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_4px_15px_rgba(99,102,241,0.25)] hover:scale-[1.01]"
                        : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    }`}
                  >
                    <Link href={plan.link}>{plan.cta}</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Pricing Section */}
      <section className="relative z-10 border-t border-slate-200 dark:border-white/5 py-24 bg-slate-100/30 dark:bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-400">Business & Partners</p>
            <h2 className="mt-3 text-4xl font-extrabold text-slate-900 dark:text-white sm:text-5xl">Organizations & Vendors</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm sm:text-base">Grow your audience, launch campaigns, and drive local foot traffic.</p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
            {[
              {
                name: "Organization",
                price: "$15",
                period: "/month",
                desc: "For schools, teams, churches, and nonprofits to raise funds easily.",
                features: ["Custom member campaigns", "Admin-controlled commissions", "Direct group payouts", "Supporter analytics dashboard"],
                cta: "Apply",
                link: "/sign-up/merchant",
                highlight: false,
                icon: Building,
                accent: "text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20",
              },
              {
                name: "Small Vendor",
                price: "$35",
                period: "/month",
                desc: "Includes +$80 one-time setup fee. Ideal for single brick-and-mortar stores.",
                features: ["1-5 physical locations", "List active catalog deals", "Real-time redemption tracking", "Basic customer insight reports"],
                cta: "Apply",
                link: "/sign-up/merchant",
                highlight: false,
                icon: Store,
                accent: "text-cyan-600 bg-cyan-50 border-cyan-200 dark:text-cyan-400 dark:bg-cyan-500/10 dark:border-cyan-500/20",
              },
              {
                name: "Premium Vendor",
                price: "$25",
                period: "/mo/location",
                desc: "Includes +$80 one-time setup fee. Built for multi-location businesses.",
                features: [
                  "6+ physical locations",
                  "Dynamic per-location pricing",
                  "Priority deal placement",
                  "Custom API access & integration",
                  "Dedicated partner support",
                ],
                cta: "Apply",
                link: "/sign-up/merchant",
                highlight: true,
                icon: Store,
                accent: "text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-500/10 dark:border-purple-500/20",
              },
            ].map((plan, i) => {
              const Icon = plan.icon;
              return (
                <div
                  key={i}
                  className={`relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-300 ${
                    plan.highlight
                      ? "border border-purple-500/20 bg-gradient-to-b from-purple-50/50 to-slate-100/80 dark:border-purple-500/30 dark:from-purple-950/30 dark:to-slate-950/80 shadow-md dark:shadow-[0_0_40px_rgba(168,85,247,0.1)]"
                      : "border border-slate-200 dark:border-white/5 bg-white/40 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-white/10"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl border ${plan.accent}`}>
                        <Icon className="size-4" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                    </div>
                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{plan.price}</span>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{plan.period}</span>
                    </div>
                    <p className="mt-4 text-xs leading-5 text-slate-600 dark:text-slate-400">{plan.desc}</p>
                    <ul className="mt-6 space-y-3.5">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                          <Check className="size-4 shrink-0 text-cyan-500 dark:text-cyan-400 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-8">
                    <Button
                      asChild
                      className={`w-full rounded-full h-11 text-xs font-bold transition-all duration-300 ${
                        plan.highlight
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_4px_15px_rgba(168,85,247,0.25)]"
                          : "bg-transparent border border-slate-300 dark:border-slate-700 hover:border-slate-500 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Link href={plan.link}>{plan.cta}</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Affiliate Section */}
      <section className="relative z-10 border-t border-slate-200 dark:border-white/5 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Copy */}
            <div className="lg:col-span-5 max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400">Affiliate Program</p>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">Earn up to 50% on every referral</h2>
              <p className="mt-6 text-sm leading-7 text-slate-600 dark:text-slate-400">
                Get 5 active referrals to qualify. Premium members earn cash commissions directly into their wallets, while other members accumulate points for high-tier catalog redemptions and perks.
              </p>
              <div className="mt-8">
                <Button asChild className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-8 shadow-[0_0_20px_rgba(99,102,241,0.15)] dark:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                  <Link href="/sign-up/about" className="flex items-center gap-2">
                    Start referring
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Grid (Tiers) */}
            <div className="lg:col-span-7 grid grid-cols-2 gap-4">
              {[
                { percent: "50%", label: "5–24 active refs", desc: "Top Tier Affiliate", highlight: true },
                { percent: "40%", label: "25–49 active refs", desc: "Advanced Affiliate", highlight: false },
                { percent: "35%", label: "50–99 active refs", desc: "Partner Affiliate", highlight: false },
                { percent: "30%", label: "100+ active refs", desc: "Enterprise Level", highlight: false },
              ].map((tier, idx) => (
                <div
                  key={idx}
                  className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 ${
                    tier.highlight
                      ? "border-indigo-500/20 bg-indigo-50/50 dark:border-indigo-500/25 dark:bg-indigo-950/20 shadow-sm dark:shadow-[0_0_30px_rgba(99,102,241,0.1)]"
                      : "border-slate-200 dark:border-white/5 bg-white/45 dark:bg-slate-950/40"
                  }`}
                >
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                      {tier.percent}
                    </span>
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">{tier.label}</h4>
                  <p className="mt-1 text-xs text-slate-500">{tier.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding & Guide Section (How it works & Who it is for) */}
      <section className="relative z-10 border-t border-slate-200 dark:border-white/5 py-24 bg-slate-100/30 dark:bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* How it works */}
            <div className="rounded-3xl border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-950/40 p-8 shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-md hover:border-indigo-500/25 hover:bg-white transition-all duration-300">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400">How to use it</p>
              <h3 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Start here, then flow into sign-up</h3>
              <div className="mt-8 space-y-4">
                {steps.map((step, index) => (
                  <div key={index} className="flex gap-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] p-4.5 hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-all duration-200">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-xs font-bold text-white shadow-sm">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Who it is for */}
            <div className="rounded-3xl border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-950/40 p-8 shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-md hover:border-cyan-500/25 hover:bg-white transition-all duration-300">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-400">Who it is for</p>
              <h3 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Everything in one place</h3>
              <div className="mt-8 space-y-4">
                {useCases.map((item, index) => (
                  <div key={index} className="flex gap-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] p-4.5 hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-all duration-200">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-xs font-bold text-white shadow-sm">
                      <Check className="size-3.5" />
                    </div>
                    <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-white/5 py-12 bg-slate-100 dark:bg-[#020005]">
        <div className="mx-auto max-w-7xl px-6 flex flex-col items-center justify-between gap-6 sm:flex-row">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            &copy; {new Date().getFullYear()} Polokaz. All rights reserved.
          </p>
          <p className="text-xs text-slate-500 text-center sm:text-right">
            Built with ❤️ for shoppers and merchants.
          </p>
        </div>
      </footer>
    </main>
  );
}
