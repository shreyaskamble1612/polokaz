"use client";

import { Deal } from "@/lib/api/deals";
import { Button } from "@/components/ui/button";

interface DealCardProps {
  deal: Deal;
  onGetNow?: (dealId: string) => void;
}

export function DealCard({ deal, onGetNow }: DealCardProps) {
  const handleGetNow = () => {
    if (onGetNow) {
      onGetNow(deal.id);
    } else {
      // Default behavior: navigate to deal details or add to wallet
      console.log("Get deal:", deal.id);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getCategoryLabel = (category: string | null) => {
    if (!category) return "General";
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <article className="relative flex overflow-hidden rounded-lg border border-[#0378ED] bg-white">
      {/* Image side */}
      <div className="relative w-[214px] shrink-0">
        <img
          src={deal.thumbnailUrl || deal.images?.[0] || "https://placehold.co/214x218"}
          alt={deal.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0378ED]/25 backdrop-blur-sm" />
        
        {/* Category badge */}
        <div className="absolute left-1 top-1 inline-flex items-center rounded-tl-md rounded-br-sm bg-[#0378ED] px-3 py-1">
          <span className="font-inter text-[12px] text-white">
            {getCategoryLabel(deal.category)}
          </span>
        </div>
        
        {/* Merchant logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={deal.merchantLogo || "https://placehold.co/125x125"}
            alt={deal.merchantName}
            className="h-[125px] w-[125px] rounded-full border border-[#959595] shadow"
          />
        </div>
      </div>

      {/* Content side */}
      <div className="flex flex-1 flex-col p-4 pr-5">
        <div className="mb-2 flex items-start justify-between">
          <div className="font-inter text-[12px] text-[#7A7A7A]">
            {deal.coupontoolsCouponId || deal.id} - {deal.status}
          </div>
          <div className="inline-flex h-6 items-center justify-center rounded-tr-md rounded-bl-sm bg-[#0378ED] px-4">
            <span className="font-inter text-[12px] text-white">
              {deal.merchantName}
            </span>
          </div>
        </div>
        
        <h3 className="mb-2 font-inter text-[24px] font-semibold leading-6">
          {deal.title}
        </h3>
        
        <p className="mb-4 font-inter text-[12px] text-[#7A7A7A] line-clamp-2">
          {deal.description || "No description available"}
        </p>

        <div className="mb-4 grid grid-cols-2 gap-y-2 font-inter text-[12px] text-[#7A7A7A]">
          <div>
            <div>Live Date</div>
            <div>{formatDate(deal.startDate)}</div>
          </div>
          <div>
            <div>End Date</div>
            <div>{formatDate(deal.endDate)}</div>
          </div>
          <div>
            <div>Discount</div>
            <div className="leading-3 text-[#4F4E4E]">
              {deal.dealType === "percentage" && deal.discountValue
                ? `${deal.discountValue}% Off`
                : deal.dealType === "fixed_amount" && deal.discountValue
                ? `$${deal.discountValue} Off`
                : deal.dealType === "freebie"
                ? "Free Item"
                : "Special Offer"}
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-end">
          <Button
            onClick={handleGetNow}
            variant="outline"
            className="inline-flex items-center justify-center rounded-lg border border-[#0378ED] px-5 py-1.5 font-inter text-[12px] font-semibold text-[#0378ED] hover:bg-[#0378ED] hover:text-white transition-colors"
          >
            Get Now
          </Button>
        </div>
      </div>
    </article>
  );
}

