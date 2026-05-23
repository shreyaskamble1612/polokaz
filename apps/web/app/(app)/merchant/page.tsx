"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BadgeDollarSign,
  BarChart3,
  CalendarClock,
  HandCoins,
  LayoutDashboard,
  Plus,
  Settings2,
  Sparkles,
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

type StatCard = {
  label: string;
  value: string;
  delta: string;
  icon: typeof BadgeDollarSign;
  accent: string;
};

const stats: StatCard[] = [
  {
    label: "Active Deals",
    value: "18",
    delta: "+3 this week",
    icon: LayoutDashboard,
    accent: "from-[#0f7af7] to-[#5bb2ff]",
  },
  {
    label: "Total Redemptions",
    value: "2,341",
    delta: "+148 today",
    icon: HandCoins,
    accent: "from-emerald-500 to-emerald-400",
  },
  {
    label: "New Redemptions This Week",
    value: "487",
    delta: "+12% vs last week",
    icon: CalendarClock,
    accent: "from-amber-500 to-orange-400",
  },
  {
    label: "Revenue Generated",
    value: "$12,480",
    delta: "+8.4% vs last month",
    icon: BadgeDollarSign,
    accent: "from-violet-500 to-fuchsia-400",
  },
];

const recentRedemptions = [
  {
    id: "red-001",
    deal: "Weekend Burger Combo",
    customer: "Ava Johnson",
    channel: "In-store",
    amount: "$18.00",
    time: "2 min ago",
    status: "approved",
  },
  {
    id: "red-002",
    deal: "Summer Spa Offer",
    customer: "Marcus Lee",
    channel: "QR scan",
    amount: "$42.00",
    time: "11 min ago",
    status: "approved",
  },
  {
    id: "red-003",
    deal: "Coffee Loyalty Bonus",
    customer: "Nina Patel",
    channel: "In-app",
    amount: "$6.50",
    time: "24 min ago",
    status: "pending",
  },
  {
    id: "red-004",
    deal: "Travel Voucher",
    customer: "Jordan Smith",
    channel: "POS",
    amount: "$96.00",
    time: "38 min ago",
    status: "approved",
  },
  {
    id: "red-005",
    deal: "Retail Welcome Gift",
    customer: "Mia Garcia",
    channel: "Website",
    amount: "$12.00",
    time: "1 hr ago",
    status: "approved",
  },
];

function statusBadge(status: string) {
  switch (status) {
    case "approved":
      return <Badge variant="success" className="rounded-full px-2.5 py-0.5">Approved</Badge>;
    case "pending":
      return <Badge variant="warning" className="rounded-full px-2.5 py-0.5">Pending</Badge>;
    default:
      return <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">{status}</Badge>;
  }
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f1f8ff_0%,#f8fafc_44%,#ffffff_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-slate-950 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
          <div className="flex flex-col gap-6 bg-[linear-gradient(110deg,#0b3a68_0%,#0f7af7_52%,#0ea5e9_100%)] px-6 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <Badge className="mb-4 rounded-full bg-white/15 px-3 py-1 text-white hover:bg-white/15">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Merchant dashboard
              </Badge>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                Monitor deals, redemptions, and revenue in one place.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
                Track merchant performance, jump into deal creation, and keep your account healthy from a single command center.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <Button asChild className="justify-start gap-2 rounded-full bg-white text-slate-950 hover:bg-white/95">
                <Link href="/merchant/deals">
                  <Plus className="h-4 w-4" />
                  Create New Deal
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start gap-2 rounded-full border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white">
                <Link href="/merchant/analytics">
                  <BarChart3 className="h-4 w-4" />
                  View Analytics
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start gap-2 rounded-full border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white">
                <Link href="/merchant/onboard">
                  <Settings2 className="h-4 w-4" />
                  Connect Coupontools
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="overflow-hidden border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                  <div>
                    <CardDescription>{stat.label}</CardDescription>
                    <CardTitle className="mt-2 text-3xl tracking-tight text-slate-950">{stat.value}</CardTitle>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br ${stat.accent} text-white shadow-lg`}>
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

        <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <Card className="border-slate-200/80 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl tracking-tight">Recent Redemptions</CardTitle>
              <CardDescription>Latest five redemption events across merchant deals.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRedemptions.map((redemption) => (
                    <TableRow key={redemption.id}>
                      <TableCell className="font-medium text-slate-950">{redemption.deal}</TableCell>
                      <TableCell>{redemption.customer}</TableCell>
                      <TableCell>{redemption.channel}</TableCell>
                      <TableCell>{redemption.time}</TableCell>
                      <TableCell>{redemption.amount}</TableCell>
                      <TableCell>{statusBadge(redemption.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <CardHeader>
              <CardTitle className="text-2xl tracking-tight text-white">Merchant Health</CardTitle>
              <CardDescription className="text-slate-300">Quick snapshot of your current store activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Open campaigns", value: "7" },
                { label: "Average redemption rate", value: "34.8%" },
                { label: "Top performing deal", value: "Weekend Burger Combo" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}

              <div className="rounded-2xl border border-[#0f7af7]/30 bg-[#0f7af7]/10 px-4 py-4">
                <p className="text-sm font-semibold text-white">Need a fresh promotion?</p>
                <p className="mt-1 text-sm text-slate-300">
                  Launch a new deal and keep your redemption stream active.
                </p>
                <Button asChild className="mt-4 rounded-full bg-white text-slate-950 hover:bg-white/95">
                  <Link href="/merchant/deals">
                    Start now
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}