"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tag,
  TrendingUp,
  Settings2,
  Menu,
  X,
  Store,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { authClient } from "@polokaz/auth/client";
import { NavUser } from "@/components/layout/home/nav-user";
import { BrandLogo } from "@/components/brand/brand-logo";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";
import useSWR from "swr";
import { clientFetch } from "@/lib/api/client-fetch";

type MerchantNavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
};

const NAV_ITEMS: MerchantNavItem[] = [
  { label: "Dashboard", href: "/merchant", icon: LayoutDashboard },
  { label: "Campaigns", href: "/merchant/deals", icon: Tag },
  { label: "Analytics", href: "/merchant/analytics", icon: TrendingUp },
  { label: "Integrations", href: "/merchant/onboard", icon: Settings2 },
];

export function MerchantShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const [mounted, setMounted] = useState(false);

  const { data: profileData } = useSWR<any>(
    session?.user ? "/api/merchants/me" : null,
    clientFetch
  );

  const hasCoupontools = !!profileData?.merchant?.coupontoolsMerchantId;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when routing changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (!mounted || isPending || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const currentUser = {
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image,
    role: session.user.role,
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Header Branding */}
        <div className="border-b border-white/10 px-6 py-6 flex flex-col gap-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-blue-300">
            <Store className="h-3 w-3" />
            Merchant
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-black text-white text-xl flex items-center gap-1.5 uppercase tracking-tighter">
              <span className="bg-blue-600 text-white p-1 rounded-lg">P</span>
              Polokaz
            </span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Store</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5 px-4 py-6">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/merchant" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 transition duration-200",
                  active
                    ? "border-blue-500/20 bg-blue-600/15 text-white shadow-[0_12px_30px_-4px_rgba(59,130,246,0.18)]"
                    : "border-transparent bg-transparent text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-blue-400" : "text-slate-400")} />
                <span className="text-sm font-semibold tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Store Health */}
      <div className="border-t border-white/10 px-4 py-5 space-y-4">
        <div className="rounded-3xl border border-blue-500/15 bg-blue-950/25 p-4.5 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                hasCoupontools ? "bg-emerald-400" : "bg-amber-400"
              )}></span>
              <span className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                hasCoupontools ? "bg-emerald-500" : "bg-amber-500"
              )}></span>
            </span>
            <p className={cn(
              "text-[10px] font-black uppercase tracking-[0.24em]",
              hasCoupontools ? "text-emerald-400" : "text-amber-400"
            )}>Store Status</p>
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-300">
            {hasCoupontools ? "Coupontools Connected" : "Coupontools Not Connected"}
          </p>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Redemptions</span>
            <span className="font-bold text-white">Active</span>
          </div>
        </div>

        <LogoutButton className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-semibold text-white transition hover:border-white/15 hover:bg-white/10 duration-200" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f1f8ff_0%,#f8fafc_44%,#ffffff_100%)] text-slate-900 flex flex-col">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Left Section (Mobile Hamburger, Logo & Badges) */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Branding / Logo */}
            <Link href="/merchant" className="flex items-center gap-2">
              <span className="font-black text-white text-xl flex items-center gap-1.5 uppercase tracking-tighter">
                <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-lg text-sm">P</span>
                Polokaz
              </span>
              <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-blue-400">
                Store
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1.5 ml-8">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/merchant" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-1.5 transition duration-150 text-xs font-bold uppercase tracking-wider",
                      active
                        ? "border-blue-500/20 bg-blue-600/15 text-white shadow-[0_12px_30px_-4px_rgba(59,130,246,0.18)]"
                        : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Section (Health & User Menu) */}
          <div className="flex items-center gap-4">
            {/* Store Status badge */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  hasCoupontools ? "bg-emerald-400" : "bg-amber-400"
                )}></span>
                <span className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  hasCoupontools ? "bg-emerald-500" : "bg-amber-500"
                )}></span>
              </span>
              <span className="font-black uppercase tracking-wider text-[9px] text-slate-300">
                {hasCoupontools ? "Coupontools Live" : "Offline Fallback"}
              </span>
            </div>

            {/* User Profile Dropdown */}
            <NavUser user={currentUser} />
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black lg:hidden"
            />

            {/* Drawer Container */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 24, stiffness: 220 }}
              className="fixed bottom-0 left-0 top-0 z-50 flex h-full w-76 flex-col border-r border-white/10 bg-slate-950 text-white shadow-2xl lg:hidden"
            >
              {/* Close Button Inside Drawer */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-4 top-4.5 inline-flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

