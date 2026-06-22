"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BadgeDollarSign,
  CircleDollarSign,
  Gauge,
  Shield,
  Users,
  Menu,
  X,
  Settings,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";
import { authClient } from "@polokaz/auth/client";
import { NavUser } from "@/components/layout/home/nav-user";

type AdminNavItem = {
  label: string;
  href: string;
  count: number;
  icon: React.ComponentType<any>;
};

// Navigation items list will be computed dynamically in the component

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (!mounted || isPending || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent" />
      </div>
    );
  }

  const currentUser = {
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image,
    role: session.user.role,
  };

  const navItems = [
    { label: "Overview", href: "/admin", count: 18, icon: Gauge },
    { label: "Users", href: "/admin/users", count: 25, icon: Users },
    { label: "Deals", href: "/admin/deals", count: 12, icon: BarChart3 },
    { label: "Merchants", href: "/admin/merchants", count: 8, icon: Shield },
    { label: "Payouts", href: "/admin/payouts", count: 6, icon: BadgeDollarSign },
    { label: "Settings", href: "/admin/settings", count: 0, icon: Settings },
  ];

  if (session?.user?.role === "super_admin") {
    navItems.push({ label: "Audit Logs", href: "/admin/audit-logs", count: 0, icon: Shield });
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Header/Logo section */}
        <div className="border-b border-white/10 px-6 py-6 flex flex-col gap-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/18 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.32em] text-cyan-200">
            <Shield className="h-3.5 w-3.5" />
            Admin
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white flex items-center gap-1.5 uppercase">
            <span className="bg-cyan-500 text-slate-950 p-1 rounded-lg text-sm">P</span>
            Polokaz Ctrl
          </h1>
          <p className="text-xs leading-5 text-slate-400 font-medium">
            Platform operations, moderation, and finance tools.
          </p>
        </div>
 
        {/* Nav links */}
        <nav className="space-y-1.5 px-4 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-2xl border px-4 py-3 transition duration-200",
                  active
                    ? "border-cyan-300/20 bg-cyan-400/12 text-white shadow-[0_12px_30px_-4px_rgba(34,211,238,0.18)]"
                    : "border-transparent bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-cyan-400" : "text-slate-400")} />
                  <span className="text-sm font-semibold tracking-wide">{item.label}</span>
                </span>
                <Badge className={cn("border-white/10 bg-white/10 text-white font-bold", active && "bg-cyan-500/25 border-cyan-400/20 text-cyan-200")}>
                  {item.count}
                </Badge>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer/Logout */}
      <div className="border-t border-white/10 px-4 py-4">
        <LogoutButton className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-semibold text-white transition hover:border-white/15 hover:bg-white/10 duration-200" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eff6ff_0%,#f8fafc_44%,#ffffff_100%)] text-slate-900 flex flex-col">
      {/* Top sticky horizontal header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950 text-white backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          
          {/* Left section: Brand/Logo & admin control badge */}
          <div className="flex items-center gap-4">
            {/* Hamburger on mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            <Link href="/admin" className="flex items-center gap-1.5">
              <span className="font-black text-white text-md flex items-center gap-1 uppercase tracking-tighter">
                <span className="bg-cyan-500 text-slate-950 px-1.5 py-0.5 rounded-md text-xs">P</span>
                Polokaz Ctrl
              </span>
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-cyan-300/18 bg-cyan-400/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.24em] text-cyan-200">
              <Shield className="h-3 w-3" />
              Admin
            </span>
          </div>

          {/* Center section: Desktop navigation link items */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3.5 py-2.5 transition duration-200",
                    active
                      ? "border-cyan-300/20 bg-cyan-400/12 text-white shadow-[0_8px_20px_-4px_rgba(34,211,238,0.12)]"
                      : "border-transparent bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-cyan-400" : "text-slate-400")} />
                  <span className="text-xs font-semibold tracking-wide">{item.label}</span>
                  {item.count > 0 && (
                    <Badge className={cn("border-white/10 bg-white/10 text-white text-[9px] px-1 py-0 rounded-md font-bold", active && "bg-cyan-500/25 border-cyan-400/20 text-cyan-200")}>
                      {item.count}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right section: user profile, logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <NavUser user={currentUser} />
              <LogoutButton className="hidden md:inline-flex text-slate-300 hover:text-white transition rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-semibold" />
            </div>
          </div>

        </div>
      </header>

      {/* Mobile Navigation Drawer Overlay */}
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

            {/* Sidebar Menu Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 24, stiffness: 220 }}
              className="fixed bottom-0 left-0 top-0 z-50 flex h-full w-76 flex-col border-r border-white/10 bg-slate-950 text-white shadow-2xl lg:hidden"
            >
              {/* Close Drawer Button */}
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

      {/* Dashboard main slot */}
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}