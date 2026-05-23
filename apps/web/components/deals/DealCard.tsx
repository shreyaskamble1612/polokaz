"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Deal } from "./types";
import { motion } from "motion/react";
import { BookmarkPlus, Clock3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const dealTypeLabel: Record<Deal["dealType"], string> = {
  coupon: "Coupon",
  voucher: "Voucher",
  loyalty: "Loyalty Card",
};

const dealTypeClasses: Record<Deal["dealType"], string> = {
  coupon:
    "border-cyan-400/30 bg-cyan-500/15 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.15)]",
  voucher:
    "border-amber-400/30 bg-amber-500/15 text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.15)]",
  loyalty:
    "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100 shadow-[0_0_24px_rgba(217,70,239,0.15)]",
};

function formatExpiry(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DealCard({
  deal,
  onSave,
}: {
  deal: Deal;
  onSave: (deal: Deal) => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="w-[270px] shrink-0 sm:w-[300px] lg:w-[320px]"
    >
      <Card className="group overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(24,24,31,0.96)_0%,rgba(12,12,18,0.98)_100%)] py-0 shadow-[0_16px_40px_rgba(0,0,0,0.32)] transition-shadow duration-300 hover:shadow-[0_28px_70px_rgba(14,165,233,0.18)]">
        <div className="relative h-40 overflow-hidden">
          <Image
            src={deal.imageUrl}
            alt={deal.title}
            fill
            sizes="(max-width: 640px) 270px, (max-width: 1024px) 300px, 320px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,20,0.1)_0%,rgba(5,10,20,0.88)_100%)]" />
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <Badge className="border-transparent bg-white/14 text-white backdrop-blur-md">
              {deal.merchantName}
            </Badge>
            <Badge className={dealTypeClasses[deal.dealType]}>
              {dealTypeLabel[deal.dealType]}
            </Badge>
          </div>
          <div className="absolute bottom-4 left-4">
            <span className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-500/15 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-emerald-100">
              {deal.discount}
            </span>
          </div>
        </div>

        <CardHeader className="gap-3 px-5 pt-5 pb-0">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
              {deal.category}
            </p>
            <Link href={`/deals/${deal.id}`} className="block">
              <CardTitle className="line-clamp-2 text-lg leading-tight text-white transition-colors group-hover:text-cyan-100">
                {deal.title}
              </CardTitle>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="px-5 pt-0">
          <p className="line-clamp-3 text-sm leading-6 text-zinc-400">
            {deal.description}
          </p>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-white/8 px-5 py-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Clock3 className="size-4 text-cyan-300" />
            <span>Expires {formatExpiry(deal.expiresAt)}</span>
          </div>

          <Button
            size="sm"
            onClick={() => onSave(deal)}
            className="rounded-full bg-white text-zinc-950 shadow-[0_8px_24px_rgba(255,255,255,0.18)] hover:bg-cyan-200"
          >
            <BookmarkPlus className="size-4" />
            Save Deal
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
