"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  ChartColumn,
  HandCoins,
  LucideIcon,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import useSWR from "swr";
import { clientFetch } from "@/lib/api/client-fetch";
import { Loader2 } from "lucide-react";

type StatCard = {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  tone: string;
};

const recentAdminActions = [
  { label: "System Status: Online", detail: "All sync runners operating normally." },
  { label: "Coupontools Integration", detail: "Connected to Coupontools API." },
  { label: "Moderation Queue", detail: "Check for pending deal submissions." },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Page() {
  const { data, error, isLoading } = useSWR<any>(
    "/api/admin/metrics",
    clientFetch
  );

  const metrics = data?.metrics;

  const chartData = useMemo(() => {
    const series = [];
    const rawData = metrics?.dailyRedemptions || [];
    const rawMap = new Map(rawData.map((r: any) => [r.date, r.count]));

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD
      const count = rawMap.get(dateString) || 0;
      series.push({
        day: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        redemptions: count,
      });
    }
    return series;
  }, [metrics]);

  const totalUsers = metrics?.usersByTier?.reduce((sum: number, t: any) => sum + t.count, 0) || 0;
  const goldUsers = metrics?.usersByTier?.find((t: any) => t.tier === "gold")?.count || 0;
  const merchantUsers = metrics?.usersByTier?.find((t: any) => t.tier === "merchant")?.count || 0;
  const totalDeals = metrics?.totalDeals || 0;
  const redemptionsThisMonth = metrics?.redemptionsThisMonth || 0;
  const pendingPayouts = metrics?.pendingPayouts || 0;
  const newSignups = metrics?.newSignups || 0;

  const statsList: StatCard[] = [
    { label: "Total Users", value: totalUsers.toLocaleString(), delta: "All time registered", icon: Users, tone: "from-sky-500 to-cyan-400" },
    { label: "Gold Tiers", value: goldUsers.toLocaleString(), delta: "Premium subscribers", icon: TrendingUp, tone: "from-emerald-500 to-emerald-400" },
    { label: "Partner Merchants", value: merchantUsers.toLocaleString(), delta: "Active businesses", icon: Sparkles, tone: "from-pink-500 to-rose-400" },
    { label: "Active Deals", value: totalDeals.toLocaleString(), delta: "Live on platform", icon: ChartColumn, tone: "from-violet-500 to-fuchsia-400" },
    { label: "Redemptions (Month)", value: redemptionsThisMonth.toLocaleString(), delta: "Since 1st of month", icon: HandCoins, tone: "from-amber-500 to-orange-400" },
    { label: "Pending Payouts", value: formatCurrency(pendingPayouts), delta: "Waiting for approval", icon: Wallet, tone: "from-slate-700 to-slate-500" },
  ];

  const dealsByCategory = useMemo(() => {
    const raw = metrics?.dealsByCategory || [];
    return raw.map((r: any) => ({
      category: r.category || "Uncategorized",
      deals: r.deals || 0,
    }));
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 rounded-[28px] bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="h-96 rounded-3xl bg-slate-200" />
          <div className="h-96 rounded-3xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-center text-red-800">
        <h2 className="text-2xl font-bold">Failed to load admin metrics</h2>
        <p className="mt-2 text-sm">{error.message || "Please make sure you have administrator privileges."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge className="mb-4 rounded-full bg-cyan-400/12 px-3 py-1 text-cyan-700 hover:bg-cyan-400/12">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Admin overview
            </Badge>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Platform metrics at a glance.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Monitor the Polokaz marketplace, moderation pipeline, user growth,
              and payout operations from one command center.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statsList.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label} className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div>
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle className="mt-2 text-3xl tracking-tight text-slate-950">{stat.value}</CardTitle>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br ${stat.tone} text-white shadow-lg`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm font-medium text-slate-500">{stat.delta}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl tracking-tight">Daily Redemptions Over Time</CardTitle>
            <CardDescription>Last 30 days of redemption activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid #e2e8f0",
                      background: "rgba(255,255,255,0.96)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="redemptions"
                    stroke="#0f7af7"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl tracking-tight">Platform Status</CardTitle>
            <CardDescription>Quick operational status and metrics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAdminActions.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="font-semibold text-slate-950">{item.label}</p>
                <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
              </div>
            ))}
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-4">
              <p className="text-sm font-semibold text-cyan-900">New Signups This Week</p>
              <p className="mt-1 text-2xl font-black text-cyan-950">{newSignups} users</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl tracking-tight">Deals by Category</CardTitle>
            <CardDescription>Active deal distribution across the marketplace.</CardDescription>
          </CardHeader>
          <CardContent>
            {dealsByCategory.length === 0 ? (
              <div className="h-80 w-full flex items-center justify-center text-slate-500 border border-dashed rounded-3xl">
                No active deals found.
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dealsByCategory} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="category" stroke="#94a3b8" tick={{ fontSize: 12 }} interval={0} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 16,
                        border: "1px solid #e2e8f0",
                        background: "rgba(255,255,255,0.96)",
                      }}
                    />
                    <Bar dataKey="deals" radius={[10, 10, 0, 0]} fill="#0f7af7" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl tracking-tight">Admin Quick Links</CardTitle>
            <CardDescription>Jump to the most used operational tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Manage Users", href: "/admin/users" },
              { label: "Moderate Deals", href: "/admin/deals" },
              { label: "Review Payouts", href: "/admin/payouts" },
            ].map((item) => (
              <Button key={item.href} asChild variant="outline" className="h-12 w-full justify-between rounded-2xl">
                <a href={item.href}>
                  {item.label}
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
