import type { Deal as BrowseDeal } from "@/lib/api/deals";
import type { Deal, DealCategory, DealType } from "@/components/deals/types";

function mapCategory(category: string | null): DealCategory {
  switch (category) {
    case "food":
      return "Food & Dining";
    case "retail":
      return "Retail";
    case "entertainment":
      return "Entertainment";
    case "travel":
      return "Travel";
    default:
      return "Retail";
  }
}

function mapDealType(dealType: string): DealType {
  switch (dealType) {
    case "fixed_amount":
      return "voucher";
    case "loyalty":
      return "loyalty";
    case "percentage":
    case "freebie":
    default:
      return "coupon";
  }
}

function mapDiscount(deal: BrowseDeal): string {
  if (deal.dealType === "percentage" && deal.discountValue) {
    return `${deal.discountValue}% OFF`;
  }

  if (deal.dealType === "fixed_amount" && deal.discountValue) {
    return `$${deal.discountValue} OFF`;
  }

  if (deal.dealType === "freebie") {
    return "FREE ITEM";
  }

  return "SPECIAL OFFER";
}

export function toCustomerDetailDeal(deal: BrowseDeal): Deal {
  return {
    id: deal.id,
    title: deal.title,
    description:
      deal.description ??
      "Enjoy a curated Polokaz member offer with premium access, flexible redemption, and elevated local value.",
    category: mapCategory(deal.category),
    dealType: mapDealType(deal.dealType),
    merchantName: deal.merchantName,
    merchantSummary:
      "Featured Polokaz partner offering member-focused experiences, exclusive value, and premium local perks.",
    merchantLocation: "Las Vegas, Nevada",
    discount: mapDiscount(deal),
    expiresAt: deal.endDate ?? new Date(Date.now() + 14 * 86400000).toISOString(),
    imageUrl: deal.thumbnailUrl || deal.images?.[0] || "/customer/thumbnail.png",
    termsAndConditions: [
      "Offer availability may vary by merchant inventory and operating hours.",
      "One redemption per member unless otherwise specified by the merchant.",
      "Present the saved deal in-wallet before checkout to apply the benefit.",
    ],
  };
}
