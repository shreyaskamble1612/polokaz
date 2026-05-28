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
import Link from "next/link";
import useSWR from "swr";
import { clientFetch } from "@/lib/api/client-fetch";
import { Loader2 } from "lucide-react";

type Range = 7 | 30 | 90;


function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
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
          <p className="text-xs text-slate-500">Live activity for the selected period</p>
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
              const dash = total > 0 ? (item.value / total) * circumference : 0;
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
          {data.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4">No categories recorded yet</div>
          ) : (
            data.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${item.colorClass}`} />
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-slate-950">{formatNumber(item.value)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [range, setRange] = useState<Range>(7);

  const { data: dealsData, error: dealsError, isLoading: dealsLoading } = useSWR<any>(
    "/api/merchants/me/deals",
    clientFetch
  );

  const { data: analyticsData, error: analyticsError, isLoading: analyticsLoading } = useSWR<any>(
    `/api/merchants/me/analytics?range=${range}d`,
    clientFetch
  );

  const isLoading = dealsLoading || analyticsLoading;
  const isError = dealsError || analyticsError;

  const dailySeries = useMemo(() => {
    const series: Array<{ label: string; value: number }> = [];
    const rawData = analyticsData?.redemptionsPerDay || [];
    const rawMap = new Map<string, number>(rawData.map((r: any) => [r.date, Number(r.count)]));

    for (let i = range - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD
      const count = rawMap.get(dateString) || 0;
      series.push({
        label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        value: count,
      });
    }
    return series;
  }, [analyticsData, range]);

  const breakdown = useMemo(() => {
    if (!dealsData?.deals) return [];
    const categories: Record<string, number> = {};
    for (const d of dealsData.deals) {
      const cat = d.category || "Other";
      categories[cat] = (categories[cat] || 0) + (d.redemptionCount || 0);
    }
    const colors = ["#0f7af7", "#22c55e", "#f59e0b", "#8b5cf6", "#94a3b8", "#ec4899", "#14b8a6"];
    const colorClasses = ["bg-[#0f7af7]", "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-slate-400", "bg-pink-500", "bg-teal-500"];
    return Object.entries(categories)
      .filter(([_, value]) => value > 0)
      .map(([label, value], i) => ({
        label,
        value,
        color: colors[i % colors.length],
        colorClass: colorClasses[i % colorClasses.length],
      }));
  }, [dealsData]);

  if (dealsError && (dealsError.message.includes("not found") || dealsError.message.includes("profile"))) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f1f8ff_0%,#f8fafc_44%,#ffffff_100%)] px-4 py-16 text-slate-900">
        <div className="mx-auto max-w-xl text-center space-y-6 rounded-[30px] border border-slate-200 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
          <TrendingUp className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="text-3xl font-bold tracking-tight text-slate-950">Become a Partner Merchant</h2>
          <p className="text-slate-600">
            Start launching promotions, tracking redemptions, and growing your business with Polokaz today.
          </p>
          <Button asChild className="rounded-full bg-blue-600 px-8 py-6 text-lg hover:bg-blue-700">
            <Link href="/merchant/onboard">Onboard Now</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eef6ff_0%,#f8fafc_46%,#ffffff_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8 animate-pulse">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="h-32 rounded-[28px] bg-slate-200" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-200" />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="h-96 rounded-3xl bg-slate-200" />
            <div className="h-96 rounded-3xl bg-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eef6ff_0%,#f8fafc_46%,#ffffff_100%)] px-4 py-16 text-slate-900">
        <div className="mx-auto max-w-xl text-center space-y-6 rounded-[30px] border border-red-200 bg-white p-8 shadow-xl">
          <h2 className="text-3xl font-bold tracking-tight text-red-600">Error loading analytics</h2>
          <p className="text-slate-600">{(dealsError || analyticsError)?.message || "Something went wrong."}</p>
        </div>
      </main>
    );
  }

  const totalRedemptions = analyticsData?.totalRedemptions ?? 0;
  const uniqueCustomers = analyticsData?.uniqueCustomers ?? 0;
  const averageDaily = analyticsData?.avgPerDay ?? 0;

  const topDealsList = analyticsData?.topDeals || [];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eef6ff_0%,#f8fafc_46%,#ffffff_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#0f7af7]">
              <TrendingUp className="h-3.5 w-3.5" />
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
            { label: "Total Redemptions", value: formatNumber(totalRedemptions), delta: `Last ${range} days`, icon: TrendingUp },
            { label: "Unique Customers", value: formatNumber(uniqueCustomers), delta: "Distinct users", icon: CircleDollarSign },
            { label: "Average Per Day", value: formatNumber(averageDaily), delta: "Avg / day", icon: CalendarDays },
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
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Redemptions</TableHead>
                  <TableHead>Share of Redemptions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDealsList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-slate-500">
                      No data recorded for the selected period.
                    </TableCell>
                  </TableRow>
                ) : (
                  topDealsList.map((deal: any, index: number) => (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium text-slate-950">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                            {index + 1}
                          </span>
                          {deal.title}
                        </div>
                      </TableCell>
                      <TableCell>{formatNumber(deal.redemptionCount)}</TableCell>
                      <TableCell>{Math.round((deal.redemptionCount / (totalRedemptions || 1)) * 100)}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}