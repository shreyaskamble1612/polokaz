"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "motion/react";
import { ArrowRight, Coins, Sparkles } from "lucide-react";
import Link from "next/link";

const POINTS_BALANCE = 350;

const TRANSACTIONS = [
  { id: "txn-1", label: "Deal redeemed", detail: "+50 pts" },
  { id: "txn-2", label: "Referral signup", detail: "+200 pts" },
  { id: "txn-3", label: "Weekend bonus", detail: "+100 pts" },
];

function getTier(points: number) {
  if (points >= 500) return "Gold";
  if (points >= 201) return "Basic";
  return "Free";
}

function getProgress(points: number) {
  return Math.min((points / 500) * 100, 100);
}

export function PointsWidget() {
  const tier = getTier(POINTS_BALANCE);
  const progress = getProgress(POINTS_BALANCE);

  return (
    <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(24,24,31,0.96)_0%,rgba(12,12,18,0.98)_100%)] py-0 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <CardContent className="space-y-6 px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300/80">
              Points Balance
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
              {POINTS_BALANCE} pts
            </p>
          </div>
          <div className="rounded-full bg-cyan-500/12 p-3 text-cyan-200">
            <Coins className="size-5" />
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-zinc-400">Tier progress</span>
            <Badge className="border-emerald-300/20 bg-emerald-500/14 text-emerald-100">
              {tier}
            </Badge>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-white/8">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-[linear-gradient(90deg,#38bdf8_0%,#f5d061_100%)]"
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-zinc-500">
            <span>Free</span>
            <span>Basic</span>
            <span>Gold</span>
          </div>
        </div>

        <div className="space-y-3">
          {TRANSACTIONS.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-500/12 p-2 text-amber-200">
                  <Sparkles className="size-4" />
                </div>
                <span className="text-sm text-zinc-200">{item.label}</span>
              </div>
              <span className="text-sm font-semibold text-white">{item.detail}</span>
            </div>
          ))}
        </div>

        <Link
          href="/wallet"
          className="inline-flex items-center gap-2 text-sm font-medium text-cyan-200 transition hover:text-cyan-100"
        >
          View full history
          <ArrowRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
