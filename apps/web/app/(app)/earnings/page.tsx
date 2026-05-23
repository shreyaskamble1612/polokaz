"use client";

import { authClient } from "@polokaz/auth/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Banknote, Crown, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const MOCK_GOLD_TIER = "gold";

const EARNINGS_STATS = {
  totalEarned: 1240,
  pendingPayout: 180,
  totalReferrals: 38,
  conversionRate: 27,
};

const MONTHLY_EARNINGS = [
  { month: "Jan", amount: 110 },
  { month: "Feb", amount: 160 },
  { month: "Mar", amount: 220 },
  { month: "Apr", amount: 195 },
  { month: "May", amount: 260 },
  { month: "Jun", amount: 295 },
];

const REFERRAL_ROWS = [
  { id: "ref-1", name: "An*** C.", joinedDate: "2026-01-04", status: "active", commission: 35 },
  { id: "ref-2", name: "Jo*** M.", joinedDate: "2026-01-18", status: "active", commission: 50 },
  { id: "ref-3", name: "Sa*** W.", joinedDate: "2026-02-02", status: "inactive", commission: 20 },
  { id: "ref-4", name: "Le*** P.", joinedDate: "2026-02-14", status: "active", commission: 45 },
  { id: "ref-5", name: "Ri*** T.", joinedDate: "2026-03-06", status: "active", commission: 65 },
  { id: "ref-6", name: "Ma*** K.", joinedDate: "2026-03-26", status: "inactive", commission: 25 },
  { id: "ref-7", name: "Ka*** N.", joinedDate: "2026-04-08", status: "active", commission: 60 },
  { id: "ref-8", name: "De*** R.", joinedDate: "2026-04-19", status: "active", commission: 55 },
  { id: "ref-9", name: "Ti*** B.", joinedDate: "2026-05-01", status: "active", commission: 70 },
  { id: "ref-10", name: "El*** J.", joinedDate: "2026-05-11", status: "active", commission: 48 },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function EarningsPage() {
  const session = authClient.useSession();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const isGoldUser = useMemo(() => {
    const sessionTier = (session.data?.user as { tier?: string | null } | undefined)?.tier;
    return (sessionTier ?? MOCK_GOLD_TIER) === "gold";
  }, [session.data?.user]);

  const maxEarning = Math.max(...MONTHLY_EARNINGS.map((item) => item.amount));

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
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-300/80">
                Gold Earnings
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Track commissions, conversions, and payout momentum.
              </h1>
            </div>

            <Badge className="w-fit border-amber-300/20 bg-amber-500/14 text-amber-100">
              Gold Member Dashboard
            </Badge>
          </div>
        </section>

        {!isGoldUser ? (
          <Card className="mt-8 border-amber-300/18 bg-[linear-gradient(180deg,rgba(46,32,12,0.92)_0%,rgba(13,13,18,0.98)_100%)] py-0 shadow-[0_20px_70px_rgba(245,208,97,0.12)]">
            <CardContent className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <Crown className="size-5 text-amber-200" />
                  <h2 className="text-2xl font-semibold text-white">
                    Upgrade to Gold to unlock cash commissions
                  </h2>
                </div>
                <p className="mt-2 text-sm text-zinc-300">
                  Gold members can earn commission payouts from successful referrals and premium conversions.
                </p>
              </div>

              <Button asChild className="rounded-full bg-[linear-gradient(135deg,#f5d061_0%,#dca93b_100%)] text-zinc-950 hover:brightness-105">
                <Link href="/plans">Upgrade to Gold</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 space-y-8">
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Total Earned",
                  value: formatCurrency(EARNINGS_STATS.totalEarned),
                  icon: Banknote,
                },
                {
                  label: "Pending Payout",
                  value: formatCurrency(EARNINGS_STATS.pendingPayout),
                  icon: TrendingUp,
                },
                {
                  label: "Total Referrals",
                  value: EARNINGS_STATS.totalReferrals,
                  icon: Users,
                },
                {
                  label: "Conversion Rate",
                  value: `${EARNINGS_STATS.conversionRate}%`,
                  icon: ArrowRight,
                },
              ].map((stat) => (
                <Card
                  key={stat.label}
                  className="border-white/10 bg-white/[0.04] py-0 shadow-[0_18px_60px_rgba(0,0,0,0.3)]"
                >
                  <CardContent className="px-5 py-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                        {stat.label}
                      </p>
                      <stat.icon className="size-4 text-cyan-200" />
                    </div>
                    <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
                      {stat.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </section>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_240px]">
              <Card className="border-white/10 bg-white/[0.04] py-0 shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
                <CardContent className="px-6 py-6">
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">Monthly Earnings</h2>
                      <p className="mt-2 text-sm text-zinc-400">
                        Last 6 months of Gold-tier commission performance.
                      </p>
                    </div>
                  </div>

                  <div className="flex h-72 items-end gap-4">
                    {MONTHLY_EARNINGS.map((item, index) => (
                      <div key={item.month} className="flex flex-1 flex-col items-center gap-3">
                        <div className="flex h-full w-full items-end">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(item.amount / maxEarning) * 100}%` }}
                            transition={{ duration: 0.6, delay: index * 0.06 }}
                            className="w-full rounded-t-3xl bg-[linear-gradient(180deg,#38bdf8_0%,#f5d061_100%)] shadow-[0_16px_32px_rgba(56,189,248,0.18)]"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-white">{item.month}</p>
                          <p className="mt-1 text-xs text-zinc-500">{formatCurrency(item.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(24,24,31,0.96)_0%,rgba(12,12,18,0.98)_100%)] py-0 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <CardContent className="px-6 py-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300/80">
                    Payout
                  </p>
                  <p className="mt-4 text-4xl font-semibold tracking-tight text-white">
                    {formatCurrency(EARNINGS_STATS.pendingPayout)}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-zinc-400">
                    Request a payout for currently pending commission earnings.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setToast("Payout request submitted")}
                    className="mt-6 w-full rounded-full bg-[linear-gradient(135deg,#f5d061_0%,#dca93b_100%)] text-zinc-950 hover:brightness-105"
                  >
                    Request Payout
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="border-white/10 bg-white/[0.04] py-0 shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
              <CardContent className="px-6 py-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-white">Referral Performance</h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    Top converting referrals and earned commissions.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                    <thead>
                      <tr className="text-zinc-400">
                        <th className="px-4 py-3 text-left font-medium">Name</th>
                        <th className="px-4 py-3 text-left font-medium">Joined Date</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Commission Earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {REFERRAL_ROWS.map((row) => (
                        <tr key={row.id}>
                          <td className="rounded-l-2xl border border-white/8 bg-black/20 px-4 py-4 text-white">
                            {row.name}
                          </td>
                          <td className="border-y border-white/8 bg-black/20 px-4 py-4 text-zinc-300">
                            {formatDate(row.joinedDate)}
                          </td>
                          <td className="border-y border-white/8 bg-black/20 px-4 py-4">
                            <Badge
                              className={
                                row.status === "active"
                                  ? "border-emerald-300/20 bg-emerald-500/14 text-emerald-100"
                                  : "border-zinc-600 bg-zinc-800 text-zinc-300"
                              }
                            >
                              {row.status}
                            </Badge>
                          </td>
                          <td className="rounded-r-2xl border border-white/8 bg-black/20 px-4 py-4 text-right font-semibold text-white">
                            {formatCurrency(row.commission)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
