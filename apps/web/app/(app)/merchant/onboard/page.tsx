"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  PlugZap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";

const connectionNotes = [
  "Your merchant business profile is already saved during sign up.",
  "This page only connects Coupontools for sync and redemption tracking.",
  "After connection, your merchant dashboard can start syncing data.",
  "You can return here later if you need to reconnect the integration.",
];

function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, index) => ({
        id: index,
        left: 18 + (index % 7) * 10,
        top: 18 + Math.floor(index / 7) * 12,
        rotation: (index % 4) * 20,
        color: ["#0f7af7", "#22c55e", "#f59e0b", "#8b5cf6"][index % 4],
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute h-2.5 w-1.5 rounded-full"
          style={{
            left: `${piece.left}%`,
            top: `${piece.top}%`,
            backgroundColor: piece.color,
          }}
          initial={{ opacity: 0, y: 0, rotate: 0, scale: 0.8 }}
          animate={{
            opacity: [0, 1, 0],
            y: [-8, -110],
            rotate: piece.rotation + 180,
            scale: [0.8, 1.1, 0.6],
          }}
          transition={{
            duration: 1.5,
            delay: (piece.id % 7) * 0.08,
            ease: "easeOut",
            repeat: Infinity,
            repeatDelay: 0.85,
          }}
        />
      ))}
    </div>
  );
}

export default function Page() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [progress, setProgress] = useState(25);

  const statusText = isConnected
    ? "Connected"
    : isConnecting
      ? "Connecting"
      : "Not connected";

  const statusTone = isConnected
    ? "bg-emerald-500/12 text-emerald-700"
    : isConnecting
      ? "bg-amber-500/12 text-amber-700"
      : "bg-slate-500/12 text-slate-700";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eef6ff_0%,#f8fafc_45%,#ffffff_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-4xl border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-6 bg-[linear-gradient(110deg,#0b3a68_0%,#0f7af7_52%,#0ea5e9_100%)] px-6 py-8 text-white sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <Badge className="mb-4 rounded-full bg-white/15 px-3 py-1 text-white hover:bg-white/15">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Coupontools sync
              </Badge>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                Connect your merchant account.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
                Business details and merchant account creation happen during sign up. This page only connects Coupontools so your offers and redemptions can sync.
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/75">Sync status</p>
              <div className="mt-2 flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusTone}`}>
                  {statusText}
                </span>
                <span className="text-sm text-white/80">Merchant account ready</span>
              </div>
            </div>
          </div>

          <CardContent className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_0.9fr] lg:p-10">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0f7af7] text-white">
                    <PlugZap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0f7af7]">Step 3</p>
                    <h2 className="text-2xl font-black tracking-tight text-slate-950">Connect with Coupontools</h2>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
                  {connectionNotes.map((note) => (
                    <div key={note} className="flex gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 rounded-2xl border border-dashed border-[#0f7af7]/25 bg-white p-4">
                  <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
                    <span>Connection progress</span>
                    <span className="font-semibold text-slate-950">{progress}%</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2" aria-hidden="true">
                    {[
                      progress >= 25,
                      progress >= 50,
                      progress >= 75,
                      progress >= 100,
                    ].map((filled, index) => (
                      <div
                        key={index}
                        className={filled ? "h-2 rounded-full bg-[#0f7af7]" : "h-2 rounded-full bg-slate-100"}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Your merchant profile is already complete. This action only handles the integration link.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    if (isConnecting || isConnected) return;

                    setIsConnecting(true);
                    setProgress(42);

                    window.setTimeout(() => {
                      setIsConnecting(false);
                      setIsConnected(true);
                      setProgress(100);
                    }, 1600);
                  }}
                  disabled={isConnecting || isConnected}
                  className="gap-2 rounded-full px-5"
                >
                  {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isConnected ? "Connected" : "Connect with Coupontools"}
                </Button>
                <Button asChild variant="outline" className="gap-2 rounded-full border-slate-200 bg-white px-5 text-slate-700 hover:bg-slate-50">
                  <Link href="/merchant">
                    Go to dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top,rgba(15,122,247,0.14),transparent_26%),linear-gradient(180deg,#08111f_0%,#0a0f18_52%,#05070b_100%)] p-6 text-white shadow-[0_20px_55px_rgba(15,23,42,0.18)]">
              <ConfettiBurst />
              <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/70">
                  <ShieldCheck className="h-4 w-4" />
                  Secure integration
                </div>
                <h3 className="mt-4 text-3xl font-light tracking-tight sm:text-4xl">
                  Sync deals after signup
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/72">
                  The merchant signup already captured business profile, plan, and access details. After this connection, the merchant dashboard can start syncing redemptions and coupons through Coupontools.
                </p>

                <div className="mt-6 rounded-3xl border border-white/12 bg-white/8 p-5 backdrop-blur">
                  <p className="text-sm font-semibold text-white">What happens next</p>
                  <div className="mt-4 space-y-3 text-sm text-white/72">
                    <div className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-300" />Merchant account remains authorized</div>
                    <div className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-300" />Coupontools sync is enabled</div>
                    <div className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-300" />Dashboard stays available anytime</div>
                  </div>
                </div>

                <div className="mt-auto pt-8">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/50">Merchant account ready</p>
                  <h4 className="mt-2 text-xl font-semibold text-white">No duplicate onboarding data required</h4>
                </div>
              </div>
            </div>
          </CardContent>
        </section>
      </div>
    </main>
  );
}
