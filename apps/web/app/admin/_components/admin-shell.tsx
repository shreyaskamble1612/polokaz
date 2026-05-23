"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BadgeDollarSign,
  CircleDollarSign,
  Gauge,
  Shield,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";

type AdminNavItem = {
  label: string;
  href: string;
  count: number;
  icon: typeof Gauge;
};

const NAV_ITEMS: AdminNavItem[] = [
  { label: "Overview", href: "/admin", count: 18, icon: Gauge },
  { label: "Users", href: "/admin/users", count: 25, icon: Users },
  { label: "Deals", href: "/admin/deals", count: 12, icon: BarChart3 },
  { label: "Merchants", href: "/admin/merchants", count: 8, icon: Shield },
  { label: "Payouts", href: "/admin/payouts", count: 6, icon: BadgeDollarSign },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eff6ff_0%,#f8fafc_44%,#ffffff_100%)] text-slate-900 lg:flex">
      <aside className="border-slate-200/80 bg-slate-950 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-80 lg:flex-col lg:border-r">
        <div className="border-b border-white/10 px-6 py-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/18 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
            <Shield className="h-3.5 w-3.5" />
            Admin
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight">Polokaz Control</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Platform operations, moderation, and finance tools.
          </p>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-2xl border px-4 py-3 transition",
                  active
                    ? "border-cyan-300/20 bg-cyan-400/12 text-white shadow-[0_18px_40px_rgba(34,211,238,0.12)]"
                    : "border-white/8 bg-white/3 text-slate-300 hover:border-white/12 hover:bg-white/6 hover:text-white",
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </span>
                <Badge className="border-white/10 bg-white/10 text-white">{item.count}</Badge>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-4 py-4 space-y-4">
          <div className="rounded-3xl border border-amber-300/18 bg-[linear-gradient(180deg,rgba(46,32,12,0.95)_0%,rgba(13,13,18,0.98)_100%)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-200/70">Platform Health</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
                <p className="text-zinc-500">Users</p>
                <p className="mt-2 text-xl font-semibold text-white">1,248</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
                <p className="text-zinc-500">Payouts</p>
                <p className="mt-2 text-xl font-semibold text-white">$42k</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
                <p className="text-zinc-500">Deals</p>
                <p className="mt-2 text-xl font-semibold text-white">86</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
                <p className="text-zinc-500">Merchants</p>
                <p className="mt-2 text-xl font-semibold text-white">31</p>
              </div>
            </div>
          </div>

          <LogoutButton className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:border-white/15 hover:bg-white/10" />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Admin Workspace</p>
              <h2 className="text-lg font-semibold text-slate-950">Platform operations dashboard</h2>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 md:flex">
              <CircleDollarSign className="h-4 w-4 text-emerald-500" />
              Pending payout window closes in 2 days
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}