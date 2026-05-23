"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Filter,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Range = 7 | 30 | 90;

const topDeals = [
  { title: "Weekend Burger Combo", redemptions: 148, revenue: 2664 },
  { title: "Summer Spa Offer", redemptions: 112, revenue: 4704 },
  { title: "Coffee Loyalty Bonus", redemptions: 91, revenue: 546 },
  { title: "Travel Voucher Boost", redemptions: 64, revenue: 6144 },
  { title: "Retail Welcome Gift", redemptions: 42, revenue: 504 },
];

const categoryBase = [
  { label: "Food & Beverage", value: 40, color: "#0f7af7", colorClass: "bg-[#0f7af7]" },
  { label: "Health & Wellness", value: 24, color: "#22c55e", colorClass: "bg-emerald-500" },
  { label: "Travel & Hospitality", value: 18, color: "#f59e0b", colorClass: "bg-amber-500" },
  { label: "Retail", value: 12, color: "#8b5cf6", colorClass: "bg-violet-500" },
  { label: "Other", value: 6, color: "#94a3b8", colorClass: "bg-slate-400" },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildDailySeries(range: Range) {
  const length = range;
  const base = range === 7 ? 28 : range === 30 ? 22 : 18;

  return Array.from({ length }, (_, index) => {
    const wave = Math.sin(index / (range === 7 ? 1.3 : range === 30 ? 2.5 : 4)) * 4;
    const trend = index * (range === 7 ? 1.2 : range === 30 ? 0.35 : 0.18);

    return {
      label: `${index + 1}`,
      value: Math.max(4, Math.round(base + wave + trend)),
    };
  });
}

function buildCategoryBreakdown(range: Range) {
  const multiplier = range === 7 ? 1 : range === 30 ? 3 : 7;

  return categoryBase.map((item, index) => ({
    ...item,
    value: item.value * multiplier + index * (range === 90 ? 10 : 3),
  }));
}

function LineChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  const points = data
    .map((item, index) => {
      const x = (index / (data.length - 1 || 1)) * 100;
      const y = 100 - (item.value / max) * 72 - 14;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Daily Redemptions</p>
          <p className="text-xs text-slate-500">Mock activity for the selected period</p>
        </div>
        <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">Line chart</Badge>
      </div>

      <svg viewBox="0 0 100 100" className="mt-5 h-72 w-full overflow-visible">
        {[20, 40, 60, 80].map((grid) => (
          <line key={grid} x1="0" x2="100" y1={grid} y2={grid} stroke="#e2e8f0" strokeDasharray="2 3" />
        ))}
        <polyline
          points={points}
          fill="none"
          stroke="#0f7af7"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((item, index) => {
          const x = (index / (data.length - 1 || 1)) * 100;
          const y = 100 - (item.value / max) * 72 - 14;

          return <circle key={`${item.label}-${index}`} cx={x} cy={y} r="1.6" fill="#0f7af7" />;
        })}
      </svg>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Start</span>
        <span>Today</span>
      </div>
    </div>
  );
}

function DonutChart({ data }: { data: Array<{ label: string; value: number; color: string; colorClass: string }> }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let offset = 25;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Category Breakdown</p>
          <p className="text-xs text-slate-500">Redemptions by category</p>
        </div>
        <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">Donut chart</Badge>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-[220px_1fr] md:items-center">
        <div className="relative mx-auto h-[220px] w-[220px]">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="34" fill="none" stroke="#e2e8f0" strokeWidth="12" />
            {data.map((item) => {
              const circumference = 2 * Math.PI * 34;
              const dash = (item.value / total) * circumference;
              const circle = (
                <circle
                  key={item.label}
                  cx="50"
                  cy="50"
                  r="34"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="12"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                />
              );

              offset -= dash;
              return circle;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total</p>
            <p className="text-3xl font-black tracking-tight text-slate-950">{formatNumber(total)}</p>
            <p className="text-xs text-slate-500">redemptions</p>
          </div>
        </div>

        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${item.colorClass}`} />
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </div>
              <span className="text-sm font-semibold text-slate-950">{formatNumber(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [range, setRange] = useState<Range>(7);

  const dailySeries = useMemo(() => buildDailySeries(range), [range]);
  const breakdown = useMemo(() => buildCategoryBreakdown(range), [range]);

  const totalRedemptions = dailySeries.reduce((sum, item) => sum + item.value, 0);
  const revenue = totalRedemptions * 12;
  const averageDaily = Math.round(totalRedemptions / range);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eef6ff_0%,#f8fafc_46%,#ffffff_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#0f7af7]">
              <Filter className="h-3.5 w-3.5" />
              Redemption analytics
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Merchant Analytics</h1>
            <p className="mt-2 text-sm text-slate-600">
              Choose a date range and inspect redemption trends, category performance, and the top-dealing merchants.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 rounded-full border border-slate-200 bg-slate-50 p-2">
            {([7, 30, 90] as const).map((option) => (
              <Button
                key={option}
                type="button"
                variant={range === option ? "default" : "ghost"}
                className="rounded-full px-4"
                onClick={() => setRange(option)}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Last {option} days
              </Button>
            ))}
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Total Redemptions", value: formatNumber(totalRedemptions), delta: "+11%", icon: TrendingUp },
            { label: "Revenue Generated", value: formatCurrency(revenue), delta: "+8.6%", icon: CircleDollarSign },
            { label: "Average Per Day", value: formatNumber(averageDaily), delta: "stable", icon: CalendarDays },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.label} className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                  <div>
                    <CardDescription>{item.label}</CardDescription>
                    <CardTitle className="mt-2 text-3xl tracking-tight text-slate-950">{item.value}</CardTitle>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-[#0f7af7] to-[#5bb2ff] text-white shadow-lg">
                    <Icon className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">{item.delta}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <LineChart data={dailySeries} />
          <DonutChart data={breakdown} />
        </div>

        <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
            <div>
              <CardTitle className="text-2xl tracking-tight">Top Deals</CardTitle>
              <CardDescription>The best performing deals in the current range.</CardDescription>
            </div>
            <Button variant="outline" className="rounded-full">
              Export Report
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Redemptions</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Conversion Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDeals.map((deal, index) => (
                  <TableRow key={deal.title}>
                    <TableCell className="font-medium text-slate-950">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                          {index + 1}
                        </span>
                        {deal.title}
                      </div>
                    </TableCell>
                    <TableCell>{formatNumber(deal.redemptions)}</TableCell>
                    <TableCell>{formatCurrency(deal.revenue)}</TableCell>
                    <TableCell>{Math.round((deal.redemptions / totalRedemptions) * 100)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}