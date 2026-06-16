"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  FileSpreadsheet,
  Gauge,
  HeartHandshake,
  Loader2,
  Medal,
  Percent,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import useSWR from "swr";
import { clientFetch } from "@/lib/api/client-fetch";
import { authClient } from "@polokaz/auth/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TIER_COLORS: Record<string, string> = {
  free: "#94a3b8",
  basic: "#64748b",
  regular: "#0ea5e9",
  premium: "#6366f1",
  organization: "#ec4899",
  small_vendor: "#8b5cf6",
  premium_vendor: "#d946ef",
  merchant: "#a855f7",
};

const CHART_COLORS = ["#0ea5e9", "#6366f1", "#ec4899", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function tierBadge(tier: string) {
  switch (tier.toLowerCase()) {
    case "gold":
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Gold</Badge>;
    case "basic":
      return <Badge className="bg-slate-100 text-slate-800 border-slate-200">Basic</Badge>;
    case "regular":
      return <Badge className="bg-sky-100 text-sky-800 border-sky-200">Regular</Badge>;
    case "premium":
      return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Premium</Badge>;
    case "organization":
      return <Badge className="bg-pink-100 text-pink-800 border-pink-200">Organization</Badge>;
    case "small_vendor":
      return <Badge className="bg-violet-100 text-violet-800 border-violet-200">Small Vendor</Badge>;
    case "premium_vendor":
      return <Badge className="bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200">Premium Vendor</Badge>;
    default:
      return <Badge variant="secondary">Free</Badge>;
  }
}

// ==========================================
// 1. OVERVIEW TAB
// ==========================================
function OverviewTab() {
  const { data: overview, error: overviewError, isLoading: overviewLoading } = useSWR<any>(
    "/api/admin/analytics/overview",
    clientFetch
  );

  const { data: atRiskData, error: atRiskError, isLoading: atRiskLoading } = useSWR<any>(
    "/api/admin/analytics/at-risk",
    clientFetch
  );

  if (overviewLoading || atRiskLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-slate-100 border border-slate-200" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-80 rounded-3xl bg-slate-100 border border-slate-200" />
          <div className="h-80 rounded-3xl bg-slate-100 border border-slate-200" />
        </div>
      </div>
    );
  }

  if (overviewError || atRiskError) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
        <h3 className="text-lg font-bold">Failed to load Overview Analytics</h3>
        <p className="mt-1 text-sm">Please refresh the page or contact system support.</p>
      </div>
    );
  }

  const activeCount = overview?.activeMembers ?? 0;
  const newThisMonth = overview?.newThisMonth ?? 0;
  const mrr = overview?.mrr ?? 0;
  const churnRate = overview?.churnRate ?? 0;
  const suspendedCount = overview?.suspended ?? 0;
  const terminatedCount = overview?.terminated ?? 0;
  const tierBreakdown = overview?.tierBreakdown || [];

  const tierChartData = tierBreakdown.map((item: any) => ({
    name: item.tier.charAt(0).toUpperCase() + item.tier.slice(1),
    value: item.count,
    fill: TIER_COLORS[item.tier] || "#94a3b8",
  }));

  const atRiskList = atRiskData?.atRisk || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200/80 shadow-xs rounded-3xl hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-slate-500 font-medium">Active Members</CardDescription>
            <Users className="h-5 w-5 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <h3 className="text-3xl font-black text-slate-950">{activeCount.toLocaleString()}</h3>
            <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
              <span className="font-semibold text-emerald-600">Active</span> in current platform database.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs rounded-3xl hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-slate-500 font-medium">Gross MRR</CardDescription>
            <Wallet className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <h3 className="text-3xl font-black text-slate-950">{formatCurrency(mrr)}</h3>
            <p className="mt-1 text-xs text-slate-500">
              Estimated active subscription value.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs rounded-3xl hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-slate-500 font-medium">New This Month</CardDescription>
            <Activity className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <h3 className="text-3xl font-black text-slate-950">+{newThisMonth}</h3>
            <p className="mt-1 text-xs text-slate-500">
              Signups since 1st of month.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs rounded-3xl hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-slate-500 font-medium">30d Churn Rate</CardDescription>
            <Percent className="h-5 w-5 text-rose-600" />
          </CardHeader>
          <CardContent>
            <h3 className="text-3xl font-black text-slate-950">{churnRate.toFixed(1)}%</h3>
            <p className="mt-1 text-xs text-slate-500">
              {churnRate > 10 ? (
                <span className="font-semibold text-red-600 flex items-center gap-0.5">
                  <AlertTriangle className="h-3 w-3 inline" /> High
                </span>
              ) : churnRate > 5 ? (
                <span className="font-semibold text-amber-600">Moderate</span>
              ) : (
                <span className="font-semibold text-emerald-600">Healthy</span>
              )}{" "}
              cancellations vs total base.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overview Analytics Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tier Breakdown Chart */}
        <Card className="border-slate-200/80 shadow-xs rounded-3xl">
          <CardHeader>
            <CardTitle className="text-xl tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-600" />
              Member Tier Distribution
            </CardTitle>
            <CardDescription>Breakdown of active users by membership tier</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-2">
            {tierChartData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-slate-400">
                No active users found.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6 w-full justify-around">
                <div className="h-56 w-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tierChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {tierChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2.5 max-w-[200px] w-full">
                  {tierChartData.map((item: any) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="font-medium text-slate-700">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-950">{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6 w-full pt-4 border-t border-slate-100 flex items-center justify-around text-center text-xs text-slate-500">
              <div>
                <p className="font-bold text-slate-900 text-lg">{suspendedCount}</p>
                <p>Suspended Accounts</p>
              </div>
              <div className="border-l border-slate-100 h-8" />
              <div>
                <p className="font-bold text-slate-900 text-lg">{terminatedCount}</p>
                <p>Terminated Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* At Risk Members Notifications */}
        <Card className="border-slate-200/80 shadow-xs rounded-3xl flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-xl tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Churn Risk Notifications
            </CardTitle>
            <CardDescription>Members showing risk signals (inactivity / payment failure)</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto max-h-[300px]">
            {atRiskList.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center text-slate-500 border border-dashed rounded-2xl p-4 text-center">
                <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
                <p className="font-semibold text-slate-800 text-sm">No at-risk users flagged</p>
                <p className="text-xs mt-0.5">All members showing active usage signatures.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {atRiskList.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-2xl border border-amber-100 bg-amber-50/40 text-xs">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">{user.name || "Unnamed user"}</p>
                      <p className="text-slate-500 font-mono text-[10px]">{user.email}</p>
                      <p className="text-[10px] text-slate-400">
                        Joined: {new Date(user.createdAt).toLocaleDateString()} | Last active: {new Date(user.lastLoginAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right space-y-1.5 shrink-0">
                      {tierBadge(user.tier)}
                      <p className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                        {user.riskSignal}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ==========================================
// 2. GROWTH TAB
// ==========================================
function GrowthTab() {
  const [days, setDays] = useState("30");
  const { data, error, isLoading } = useSWR<any>(
    `/api/admin/analytics/growth?days=${days}`,
    clientFetch
  );

  const signupsData = useMemo(() => {
    const raw = data?.signups || [];
    const dateMap: Record<string, Record<string, number>> = {};
    const tiersFound = new Set<string>();

    raw.forEach((item: any) => {
      if (!dateMap[item.date]) {
        dateMap[item.date] = {};
      }
      dateMap[item.date][item.tier] = item.count;
      tiersFound.add(item.tier);
    });

    return {
      tiers: Array.from(tiersFound),
      chart: Object.entries(dateMap)
        .map(([date, counts]) => {
          const formattedDate = new Date(date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });
          const total = Object.values(counts).reduce((sum, v) => sum + v, 0);
          return {
            dateKey: date,
            dateLabel: formattedDate,
            total,
            ...counts,
          };
        })
        .sort((a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime()),
    };
  }, [data]);

  const totalSignups = useMemo(() => {
    return signupsData.chart.reduce((sum, row) => sum + (row.total || 0), 0);
  }, [signupsData]);

  const peakSignups = useMemo(() => {
    let max = 0;
    let maxDate = "";
    signupsData.chart.forEach((row) => {
      if (row.total > max) {
        max = row.total;
        maxDate = row.dateLabel;
      }
    });
    return { count: max, date: maxDate };
  }, [signupsData]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 w-48 rounded-xl bg-slate-100" />
        <div className="h-96 rounded-3xl bg-slate-100 border border-slate-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
        <h3 className="text-lg font-bold">Failed to load Growth Analytics</h3>
        <p className="mt-1 text-sm">Please select a different period or retry.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selection & Growth Summary Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Display Range:</span>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[140px] rounded-xl">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="365">Last 365 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-4">
          <Badge className="bg-cyan-50 text-cyan-800 border-cyan-100 px-3 py-1.5 rounded-xl text-xs font-semibold">
            Total signups: {totalSignups}
          </Badge>
          {peakSignups.count > 0 && (
            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-100 px-3 py-1.5 rounded-xl text-xs font-semibold">
              Peak: {peakSignups.count} on {peakSignups.date}
            </Badge>
          )}
        </div>
      </div>

      <Card className="border-slate-200/80 shadow-xs rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl tracking-tight flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Account Registration Timeline
          </CardTitle>
          <CardDescription>Daily new user registrations by target tier</CardDescription>
        </CardHeader>
        <CardContent>
          {signupsData.chart.length === 0 ? (
            <div className="h-80 w-full flex items-center justify-center text-slate-500 border border-dashed rounded-3xl">
              No registration events recorded in this period.
            </div>
          ) : (
            <div className="h-96 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signupsData.chart}>
                  <defs>
                    <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="dateLabel" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid #e2e8f0",
                      background: "rgba(255,255,255,0.96)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Daily Signups"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSignups)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==========================================
// 3. CHURN TAB
// ==========================================
function ChurnTab() {
  const { data, error, isLoading } = useSWR<any>(
    "/api/admin/analytics/churn",
    clientFetch
  );

  const reasonsData = useMemo(() => {
    const raw = data?.churnReasons || [];
    return raw.map((item: any, index: number) => ({
      ...item,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [data]);

  const sourceData = data?.churnBySource || [];
  const tierData = data?.churnByTier || [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-80 rounded-3xl bg-slate-100" />
          <div className="h-80 rounded-3xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
        <h3 className="text-lg font-bold">Failed to load Churn Analytics</h3>
        <p className="mt-1 text-sm">Please refresh the page to try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Churn Reasons Pie */}
        <Card className="border-slate-200/80 shadow-xs rounded-3xl">
          <CardHeader>
            <CardTitle className="text-xl tracking-tight flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-rose-600" />
              Primary Cancellation Reasons
            </CardTitle>
            <CardDescription>Breakdown of declared member cancellation reasons</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-2">
            {reasonsData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-slate-400">
                No cancellation feedback recorded.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6 w-full justify-around">
                <div className="h-56 w-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reasonsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="reason"
                      >
                        {reasonsData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2.5 max-w-[200px] w-full">
                  {reasonsData.map((item: any) => (
                    <div key={item.reason} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="font-medium text-slate-700 truncate max-w-[120px]">{item.reason}</span>
                      </div>
                      <span className="font-bold text-slate-950">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referred vs Direct retention */}
        <Card className="border-slate-200/80 shadow-xs rounded-3xl">
          <CardHeader>
            <CardTitle className="text-xl tracking-tight flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-cyan-600" />
              Referral vs Direct Retention
            </CardTitle>
            <CardDescription>Comparative cohort analyses based on signup vectors</CardDescription>
          </CardHeader>
          <CardContent>
            {sourceData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-slate-400">
                No user logs found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Signup Route</TableHead>
                    <TableHead className="text-center">Total Accounts</TableHead>
                    <TableHead className="text-center">Cancellations</TableHead>
                    <TableHead className="text-right">Churn Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sourceData.map((row: any) => {
                    const total = row.count || 0;
                    const cancelled = row.cancelled || 0;
                    const active = total - cancelled;
                    const churnRate = total > 0 ? (cancelled / total) * 100 : 0;

                    return (
                      <TableRow key={row.isReferred}>
                        <TableCell className="font-semibold text-slate-900">
                          {row.isReferred === "referred" ? "Referred (Affiliated)" : "Direct Signups"}
                        </TableCell>
                        <TableCell className="text-center font-semibold">{total.toLocaleString()}</TableCell>
                        <TableCell className="text-center text-slate-500">{cancelled}</TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-black text-xs px-2 py-0.5 rounded-full ${
                              churnRate > 10
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {churnRate.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tier Churn Table */}
      <Card className="border-slate-200/80 shadow-xs rounded-3xl">
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">Tier-Specific Churn Ratios</CardTitle>
          <CardDescription>Evaluation of churn counts mapped by active paid tiers</CardDescription>
        </CardHeader>
        <CardContent>
          {tierData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-slate-400 border border-dashed rounded-3xl">
              No users registered on paid tiers yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier name</TableHead>
                  <TableHead className="text-center">Active Members</TableHead>
                  <TableHead className="text-center">Cancelled Members</TableHead>
                  <TableHead className="text-right">Lapsed / Total ratio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tierData.map((row: any) => {
                  const active = row.active || 0;
                  const cancelled = row.cancelled || 0;
                  const total = active + cancelled;
                  const ratio = total > 0 ? (cancelled / total) * 100 : 0;

                  return (
                    <TableRow key={row.tier}>
                      <TableCell className="font-medium flex items-center gap-2 py-3.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TIER_COLORS[row.tier] || "#94a3b8" }} />
                        {row.tier.toUpperCase()}
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-900">{active.toLocaleString()}</TableCell>
                      <TableCell className="text-center text-slate-500">{cancelled}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-black text-xs px-2.5 py-0.5 rounded-full ${
                            ratio > 15
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : ratio > 7
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {ratio.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==========================================
// 4. REVENUE TAB
// ==========================================
function RevenueTab() {
  const { data, error, isLoading } = useSWR<any>(
    "/api/admin/analytics/revenue",
    clientFetch
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-slate-100" />
          ))}
        </div>
        <div className="h-48 rounded-3xl bg-slate-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
        <h3 className="text-lg font-bold">Failed to load Revenue Analytics</h3>
        <p className="mt-1 text-sm">Please refresh the page to try again.</p>
      </div>
    );
  }

  const grossMRR = data?.grossMRR ?? 0;
  const netMRR = data?.netMRR ?? 0;
  const signupFees = data?.signupFeesThisMonth ?? 0;
  const commissionsThisMonth = data?.commissionsThisMonth ?? 0;
  const payoutRatio = data?.payoutRatio ?? 0;
  const alerts = data?.alerts || [];

  return (
    <div className="space-y-6">
      {/* Revenue Alerts */}
      {alerts.map((alert: any, index: number) => (
        <div
          key={index}
          className={`rounded-2xl border p-4.5 flex items-start gap-3 text-xs leading-5 ${
            alert.level === "critical"
              ? "bg-red-50 text-red-800 border-red-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }`}
        >
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold uppercase tracking-wider text-[9px]">
              {alert.level === "critical" ? "Critical Risk Alert" : "Liability Warning"}
            </p>
            <p className="mt-1 font-semibold">{alert.message}</p>
          </div>
        </div>
      ))}

      {/* Financial Breakdown Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-slate-200/80 shadow-xs rounded-3xl bg-[linear-gradient(225deg,rgba(14,165,233,0.03)_0%,rgba(255,255,255,0)_100%)]">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 font-medium">Gross MRR</CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="text-3xl font-black text-slate-950">{formatCurrency(grossMRR)}</h3>
            <p className="mt-1 text-[11px] text-slate-500">
              Active subscriptions aggregate before payouts.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs rounded-3xl bg-[linear-gradient(225deg,rgba(16,185,129,0.03)_0%,rgba(255,255,255,0)_100%)]">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 font-medium">Net Platform MRR</CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="text-3xl font-black text-emerald-950">{formatCurrency(netMRR)}</h3>
            <p className="mt-1 text-[11px] text-slate-500">
              Retained platform earnings after referral deductions.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs rounded-3xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 font-medium">Monthly Setup Fees</CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="text-3xl font-black text-slate-950">{formatCurrency(signupFees)}</h3>
            <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
              One-time <span className="font-semibold text-slate-800">$25 setup payments</span> this month.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Safety Threshold Gauge */}
      <Card className="border-slate-200/80 shadow-xs rounded-3xl">
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">Commission Payout Liability</CardTitle>
          <CardDescription>Referral commissions vs MRR. Safety threshold maximum: 45.0%</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-600">Current Payout Ratio</span>
            <span className={`font-black ${payoutRatio > 45 ? "text-red-600" : payoutRatio > 40 ? "text-amber-600" : "text-emerald-600"}`}>
              {payoutRatio.toFixed(1)}%
            </span>
          </div>

          <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden border">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                payoutRatio > 45 ? "bg-red-500" : payoutRatio > 40 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, (payoutRatio / 45) * 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0.0% (No Payouts)</span>
            <span>22.5% (Ideal Target)</span>
            <span className="font-bold text-red-500">45.0% (Safety Threshold)</span>
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-slate-500 font-medium">Total Commissions Tracked (Month)</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(commissionsThisMonth)}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-slate-500 font-medium">Platform Margin Ratio</p>
              <p className="mt-1 text-lg font-bold text-emerald-700">{(100 - payoutRatio).toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==========================================
// 5. AFFILIATES TAB
// ==========================================
function AffiliatesTab() {
  const { data, error, isLoading } = useSWR<any>(
    "/api/admin/analytics/affiliates",
    clientFetch
  );

  const leaderboard = data?.leaderboard || [];
  const flagged = data?.flaggedAffiliates || [];
  const fraud = data?.fraudSignals || [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 rounded-3xl bg-slate-100" />
        <div className="h-64 rounded-3xl bg-slate-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
        <h3 className="text-lg font-bold">Failed to load Affiliate Analytics</h3>
        <p className="mt-1 text-sm">Please refresh the page to retry.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert items (Fraud & high churn flags) */}
      {(flagged.length > 0 || fraud.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {fraud.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4.5 flex items-start gap-3 text-xs leading-5 text-red-800">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-bold uppercase tracking-wider text-[9px]">Sybil Attack / Fraud Warning</p>
                <p className="mt-1 font-semibold">
                  {fraud.length} affiliates triggered referral velocities exceeding 10 signups within the last 24 hours.
                </p>
                <ul className="mt-2 space-y-1 font-mono text-[10px] bg-red-100/60 p-2.5 rounded-xl border border-red-200/50">
                  {fraud.map((f: any) => (
                    <li key={f.id} className="flex justify-between">
                      <span>{f.name || f.email}</span>
                      <span className="font-black text-red-700">{f.referralsCount24h} conversions/24h</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {flagged.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4.5 flex items-start gap-3 text-xs leading-5 text-amber-800">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-bold uppercase tracking-wider text-[9px]">High Churn Affiliates</p>
                <p className="mt-1 font-semibold">
                  {flagged.length} affiliates have referred members with a retention failure rate exceeding 30%.
                </p>
                <ul className="mt-2 space-y-1 font-mono text-[10px] bg-amber-100/60 p-2.5 rounded-xl border border-amber-200/50">
                  {flagged.map((f: any) => (
                    <li key={f.id} className="flex justify-between">
                      <span>{f.name || f.email}</span>
                      <span className="font-black text-amber-700">{f.churnRate}% churn ({f.churnedCount}/{f.referralCount})</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Affiliates Leaderboard */}
      <Card className="border-slate-200/80 shadow-xs rounded-3xl">
        <CardHeader>
          <CardTitle className="text-xl tracking-tight flex items-center gap-2">
            <Medal className="h-5 w-5 text-amber-500" />
            Top Affiliate Partners
          </CardTitle>
          <CardDescription>Leaderboard of members driving premium activations</CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-slate-400 border border-dashed rounded-3xl">
              No referral conversions recorded yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate Name / Email</TableHead>
                  <TableHead className="text-center">Active Referrals</TableHead>
                  <TableHead className="text-center">Churned Referrals</TableHead>
                  <TableHead className="text-center">Total Referred</TableHead>
                  <TableHead className="text-right">Referred Churn Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium py-3.5">
                      <p className="text-slate-900 font-semibold">{row.name || "Unnamed Affiliate"}</p>
                      <p className="text-slate-400 text-[10px] font-mono">{row.email}</p>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-emerald-600">{row.activeCount}</TableCell>
                    <TableCell className="text-center text-slate-500">{row.churnedCount}</TableCell>
                    <TableCell className="text-center font-bold text-slate-900">{row.referralCount}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-full ${
                          row.churnRate > 30
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : row.churnRate > 15
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {row.churnRate.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==========================================
// 6. ORGANIZATIONS TAB
// ==========================================
function OrganizationsTab() {
  const { data, error, isLoading } = useSWR<any>(
    "/api/admin/analytics/orgs",
    clientFetch
  );

  const orgs = data?.orgs || [];
  const donationQueue = data?.donationQueue || [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 rounded-3xl bg-slate-100" />
        <div className="h-48 rounded-3xl bg-slate-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
        <h3 className="text-lg font-bold">Failed to load Organization Analytics</h3>
        <p className="mt-1 text-sm">Please refresh the page to try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Annual Donation Queue */}
      <Card className="border-slate-200/80 shadow-xs rounded-3xl bg-[linear-gradient(180deg,rgba(236,72,153,0.02)_0%,rgba(255,255,255,0)_100%)]">
        <CardHeader>
          <CardTitle className="text-xl tracking-tight flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-pink-600" />
            Annual Donation Reserve Queue
          </CardTitle>
          <CardDescription>
            Organizations meeting the qualification criteria of at least 5 referred active members (10% allocation)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {donationQueue.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-slate-500 border border-dashed rounded-2xl p-4 text-center">
              <p className="font-semibold text-slate-800 text-sm">Donation queue is empty</p>
              <p className="text-xs mt-0.5">No registered organizations currently satisfy the 5 active member threshold.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization Name / Email</TableHead>
                  <TableHead className="text-center">Referred Members</TableHead>
                  <TableHead className="text-center">Direct Earnings</TableHead>
                  <TableHead className="text-right">Donation Grant (10%)</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donationQueue.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium py-3.5">
                      <p className="text-slate-900 font-semibold">{row.name || "Unnamed Org"}</p>
                      <p className="text-slate-400 text-[10px] font-mono">{row.email}</p>
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-900">{row.memberCount}</TableCell>
                    <TableCell className="text-center text-slate-600">{formatCurrency(row.earnings)}</TableCell>
                    <TableCell className="text-right font-black text-pink-700">{formatCurrency(row.donationAmount)}</TableCell>
                    <TableCell className="text-right">
                      <span className="bg-pink-50 border border-pink-200 text-pink-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Accruing Allocation
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* General Organizations List */}
      <Card className="border-slate-200/80 shadow-xs rounded-3xl">
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">Active Platform Organizations</CardTitle>
          <CardDescription>Listing and performance metrics for registered nonprofit partners</CardDescription>
        </CardHeader>
        <CardContent>
          {orgs.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-slate-400 border border-dashed rounded-3xl">
              No organization tier accounts registered.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Referred Members</TableHead>
                  <TableHead className="text-center">Platform Status</TableHead>
                  <TableHead className="text-right">Total Earnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-semibold text-slate-900 py-3.5">{row.name || "Unnamed Org"}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{row.email}</TableCell>
                    <TableCell className="text-center font-bold">{row.memberCount}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold uppercase text-[9px] tracking-wider px-2.5 py-0.5">
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900">{formatCurrency(row.earnings)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==========================================
// MAIN DASHBOARD PAGE
// ==========================================
export default function AdminPage() {
  const { data: session } = authClient.useSession();
  const isSuperAdmin = session?.user?.role === "super_admin";
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (dataset: string) => {
    try {
      setExporting(dataset);
      // Trigger a browser file download of the export CSV
      window.location.href = `/api/admin/analytics/export?dataset=${dataset}`;
    } catch (e) {
      console.error("Export trigger error", e);
    } finally {
      // Small timeout to reset loading spinner state in button
      setTimeout(() => setExporting(null), 1500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header Card */}
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <Badge className="mb-4 rounded-full bg-cyan-400/12 px-3 py-1 text-cyan-700 hover:bg-cyan-400/12">
              <Gauge className="mr-2 h-3.5 w-3.5" />
              Platform Analytics
            </Badge>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Platform Command Center.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Track real-time registrations, retention vectors, payout liabilities, organization donation accruals, and download platform audit logs.
            </p>
          </div>

          {/* Super Admin CSV Export Button */}
          {isSuperAdmin && (
            <div className="shrink-0 flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xs hover:bg-slate-50 gap-2 h-11 px-4.5">
                    {exporting ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin text-cyan-600" />
                    ) : (
                      <FileSpreadsheet className="h-4.5 w-4.5 text-cyan-600" />
                    )}
                    <span>Export Center</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[180px]">
                  <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2.5 py-1.5">
                    Select CSV Dataset
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleExport("users")}
                    className="rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Export Users Database
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExport("audit-log")}
                    className="rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Export Admin Audit Logs
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExport("overview")}
                    className="rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Export Platform Overview
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </section>

      {/* Tabs Layout */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap gap-1 h-auto w-fit max-w-full border shadow-inner">
          <TabsTrigger value="overview" className="rounded-xl font-bold text-xs py-2 px-3 data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-xs transition duration-200">
            Overview
          </TabsTrigger>
          <TabsTrigger value="growth" className="rounded-xl font-bold text-xs py-2 px-3 data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-xs transition duration-200">
            Member Growth
          </TabsTrigger>
          <TabsTrigger value="churn" className="rounded-xl font-bold text-xs py-2 px-3 data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-xs transition duration-200">
            Churn & Retention
          </TabsTrigger>
          <TabsTrigger value="revenue" className="rounded-xl font-bold text-xs py-2 px-3 data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-xs transition duration-200">
            Revenue & Margins
          </TabsTrigger>
          <TabsTrigger value="affiliates" className="rounded-xl font-bold text-xs py-2 px-3 data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-xs transition duration-200">
            Affiliates Leaderboard
          </TabsTrigger>
          <TabsTrigger value="orgs" className="rounded-xl font-bold text-xs py-2 px-3 data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-xs transition duration-200">
            Organization Seasons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="focus-visible:outline-hidden outline-hidden mt-0">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="growth" className="focus-visible:outline-hidden outline-hidden mt-0">
          <GrowthTab />
        </TabsContent>

        <TabsContent value="churn" className="focus-visible:outline-hidden outline-hidden mt-0">
          <ChurnTab />
        </TabsContent>

        <TabsContent value="revenue" className="focus-visible:outline-hidden outline-hidden mt-0">
          <RevenueTab />
        </TabsContent>

        <TabsContent value="affiliates" className="focus-visible:outline-hidden outline-hidden mt-0">
          <AffiliatesTab />
        </TabsContent>

        <TabsContent value="orgs" className="focus-visible:outline-hidden outline-hidden mt-0">
          <OrganizationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

