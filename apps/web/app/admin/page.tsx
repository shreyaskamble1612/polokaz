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

 type StatCard = {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  tone: string;
};

const stats: StatCard[] = [
  { label: "Total Users", value: "1,248", delta: "+124 this month", icon: Users, tone: "from-sky-500 to-cyan-400" },
  { label: "Active Users This Week", value: "842", delta: "+11% week over week", icon: TrendingUp, tone: "from-emerald-500 to-emerald-400" },
  { label: "Total Deals", value: "86", delta: "+9 approved this week", icon: ChartColumn, tone: "from-violet-500 to-fuchsia-400" },
  { label: "Redemptions This Month", value: "12,480", delta: "+18% vs last month", icon: HandCoins, tone: "from-amber-500 to-orange-400" },
  { label: "Pending Payouts", value: "$42,180", delta: "31 payouts waiting", icon: Wallet, tone: "from-slate-700 to-slate-500" },
  { label: "New Signups This Week", value: "214", delta: "+42 today", icon: Sparkles, tone: "from-pink-500 to-rose-400" },
];

const signupData = [
  { day: "1", signups: 14 },
  { day: "2", signups: 22 },
  { day: "3", signups: 18 },
  { day: "4", signups: 31 },
  { day: "5", signups: 28 },
  { day: "6", signups: 33 },
  { day: "7", signups: 30 },
  { day: "8", signups: 24 },
  { day: "9", signups: 26 },
  { day: "10", signups: 38 },
  { day: "11", signups: 41 },
  { day: "12", signups: 37 },
  { day: "13", signups: 44 },
  { day: "14", signups: 46 },
  { day: "15", signups: 39 },
  { day: "16", signups: 43 },
  { day: "17", signups: 48 },
  { day: "18", signups: 52 },
  { day: "19", signups: 47 },
  { day: "20", signups: 55 },
  { day: "21", signups: 50 },
  { day: "22", signups: 46 },
  { day: "23", signups: 58 },
  { day: "24", signups: 60 },
  { day: "25", signups: 57 },
  { day: "26", signups: 62 },
  { day: "27", signups: 61 },
  { day: "28", signups: 65 },
  { day: "29", signups: 59 },
  { day: "30", signups: 68 },
];

const dealsByCategory = [
  { category: "Food & Dining", deals: 24 },
  { category: "Retail", deals: 18 },
  { category: "Travel", deals: 13 },
  { category: "Entertainment", deals: 15 },
  { category: "Health & Wellness", deals: 11 },
  { category: "Beauty", deals: 5 },
];

const recentAdminActions = [
  { label: "Approved 3 deals", detail: "Moderation queue cleared in 4 min" },
  { label: "Processed payout batch", detail: "31 commissions moved to review" },
  { label: "Upgraded 12 users", detail: "Tier changes confirmed successfully" },
  { label: "Merchant onboarding", detail: "2 accounts activated this morning" },
];

function formatTick(value: string) {
  return `Day ${value}`;
}

export default function Page() {
  const totalSignups = useMemo(
    () => signupData.reduce((sum, point) => sum + point.signups, 0),
    [],
  );

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

          <Button className="rounded-full bg-slate-950 px-5 text-white hover:bg-slate-800">
            Export Snapshot
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
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
            <CardTitle className="text-2xl tracking-tight">User Signups Over Time</CardTitle>
            <CardDescription>Last 30 days of new registrations.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={signupData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tickFormatter={formatTick} stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid #e2e8f0",
                      background: "rgba(255,255,255,0.96)",
                    }}
                    labelFormatter={(value) => `Day ${value}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="signups"
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
            <CardTitle className="text-2xl tracking-tight">Platform Activity</CardTitle>
            <CardDescription>Quick moderation and operations notes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAdminActions.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="font-semibold text-slate-950">{item.label}</p>
                <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
              </div>
            ))}
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-4">
              <p className="text-sm font-semibold text-cyan-900">This month</p>
              <p className="mt-1 text-2xl font-black text-cyan-950">{totalSignups} signups</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl tracking-tight">Deals by Category</CardTitle>
            <CardDescription>Mock deal distribution across the marketplace.</CardDescription>
          </CardHeader>
          <CardContent>
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
