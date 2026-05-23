import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { getServerSession } from "@/lib/auth/server-session";
import { getUserRole } from "@polokaz/auth/roles";
import { BadgeCheck, ArrowRight, Gift, LayoutDashboard, MapPin, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const featureCards = [
  {
    title: "Curated deals",
    description:
      "Discover member-only coupons, exclusive offers, and local experiences selected for the Polokaz community.",
    icon: Gift,
  },
  {
    title: "Referral rewards",
    description:
      "Invite friends, track conversions, and grow your rewards through shareable referral links.",
    icon: Users,
  },
  {
    title: "Personal dashboard",
    description:
      "Manage your profile, wallet, deals, referrals, and subscription perks from one place.",
    icon: LayoutDashboard,
  },
  {
    title: "Local discovery",
    description:
      "Browse trusted merchants and nearby offers so every visit feels relevant and personal.",
    icon: MapPin,
  },
];

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

  if (!session?.session) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#040507] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_26%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.08),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-size-[72px_72px] opacity-[0.08]" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-10 mix-blend-screen" />
        <div className="absolute inset-0 bg-black/62" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <BrandLogo href="/" size="lg" priority />
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild className="rounded-full bg-white text-slate-950 hover:bg-white/90">
                <Link href="/sign-up/about" className="gap-2">
                  Get started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </header>

          <section className="grid flex-1 items-center gap-14 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/75 backdrop-blur-xl">
                <Sparkles className="size-3.5 text-amber-200" />
                Invite-only rewards platform
              </div>

              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-7xl">
                Deals, referrals, and member perks in one beautiful entry point.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                Polokaz is a curated lifestyle and rewards experience for discovering offers, managing referrals, and unlocking benefits through a personalized dashboard. Start here, learn how it works, then choose sign-up or sign-in.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full bg-white px-8 text-slate-950 hover:bg-white/90">
                  <Link href="/sign-up/about" className="gap-2">
                    Get started
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-white/18 bg-white/6 px-8 text-white hover:bg-white/12">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/68">
                <span className="rounded-full border border-white/12 bg-white/6 px-4 py-2">Welcome screen first</span>
                <span className="rounded-full border border-white/12 bg-white/6 px-4 py-2">About who you are today</span>
                <span className="rounded-full border border-white/12 bg-white/6 px-4 py-2">Then complete sign up</span>
              </div>
            </div>

            <div className="rounded-4xl border border-white/12 bg-white/8 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
              <div className="rounded-[28px] border border-white/12 bg-[#0b1018]/90 p-6">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-white/50">What you get</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Built for members, merchants, and referrals</h2>
                  </div>
                  <BadgeCheck className="size-10 text-emerald-300" />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {featureCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <article key={card.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white">
                          <Icon className="size-5" />
                        </div>
                        <h3 className="text-base font-semibold text-white">{card.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-white/65">{card.description}</p>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-8 pb-12 lg:grid-cols-2">
            <div className="rounded-[28px] border border-white/12 bg-white/6 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.28em] text-white/50">How to use it</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Start here, then flow into sign-up</h2>
              <div className="mt-6 space-y-4">
                {steps.map((step, index) => (
                  <div key={step} className="flex gap-4 rounded-2xl border border-white/10 bg-black/15 p-4">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-sm font-semibold text-slate-950">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-white/70">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-white/6 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.28em] text-white/50">Who it is for</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Everything in one place</h2>
              <div className="mt-6 grid gap-4">
                {useCases.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-black/15 p-4 text-sm leading-6 text-white/70">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const role = getUserRole(session.user);

  if (role === "admin") {
    redirect("/admin");
  }

  if (role === "merchant") {
    redirect("/merchant");
  }

  redirect("/customer/dashboard");
}
