"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { DealCard } from "./DealCard";
import type { Deal } from "./types";

export function CategoryRow({
  category,
  deals,
  onSave,
  savingDealId,
  savedDealIds,
}: {
  category: Deal["category"];
  deals: Deal[];
  onSave: (deal: Deal) => void | Promise<void>;
  savingDealId?: string | null;
  savedDealIds?: Set<string>;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scrollByAmount = (direction: "left" | "right") => {
    const node = scrollerRef.current;
    if (!node) return;

    node.scrollBy({
      left: direction === "left" ? -node.clientWidth * 0.9 : node.clientWidth * 0.9,
      behavior: "smooth",
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {category}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {deals.length} curated {deals.length === 1 ? "deal" : "deals"}
          </p>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={() => scrollByAmount("left")}
            className="rounded-full border-white/12 bg-white/6 text-white backdrop-blur hover:bg-white/12"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={() => scrollByAmount("right")}
            className="rounded-full border-white/12 bg-white/6 text-white backdrop-blur hover:bg-white/12"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className={cn(
          "flex gap-4 overflow-x-auto pb-3 pr-4 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "md:pb-4 md:[scrollbar-width:thin] md:[scrollbar-color:rgba(161,161,170,0.45)_transparent] md:[&::-webkit-scrollbar]:block md:[&::-webkit-scrollbar]:h-2 md:[&::-webkit-scrollbar-thumb]:rounded-full md:[&::-webkit-scrollbar-thumb]:bg-white/20"
        )}
      >
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            onSave={onSave}
            isSaving={savingDealId === deal.id}
            isSaved={savedDealIds?.has(deal.id) ?? false}
          />
        ))}
      </div>
    </section>
  );
}
