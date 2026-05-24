import type { Deal as UiDeal, DealCategory, DealType } from "@/components/deals/types";
import type { ApiDeal, DealDetailResponse, DealsByCategoryResponse } from "@/lib/api/deals";
import type { WalletApiItem } from "@/lib/api/wallet";

function mapCategory(category: string | null): DealCategory {
  switch ((category ?? "").trim().toLowerCase()) {
    case "food":
    case "food & dining":
    case "dining":
    case "restaurant":
    case "restaurants":
      return "Food & Dining";
    case "entertainment":
      return "Entertainment";
    case "travel":
      return "Travel";
    case "retail":
    default:
      return "Retail";
  }
}

function mapDiscount(deal: Pick<ApiDeal, "discountValue" | "dealType">) {
  if (!deal.discountValue) {
    return deal.dealType === "loyalty" ? "LOYALTY REWARD" : "SPECIAL OFFER";
  }

  if (deal.dealType === "voucher") {
    return deal.discountValue.startsWith("$") ? deal.discountValue : `$${deal.discountValue} OFF`;
  }

  if (deal.dealType === "loyalty") {
    return deal.discountValue;
  }

  return /%|off/i.test(deal.discountValue) ? deal.discountValue : `${deal.discountValue} OFF`;
}

function baseTerms() {
  return [
    "Offer availability may vary by merchant inventory and operating hours.",
    "One redemption per member unless otherwise specified by the merchant.",
    "Present the saved deal in-wallet before checkout to apply the benefit.",
  ];
}

export function mapApiDealToUiDeal(deal: ApiDeal): UiDeal {
  return {
    id: deal.id,
    title: deal.title,
    description:
      deal.description ??
      "Enjoy a curated Polokaz member offer with premium access, flexible redemption, and elevated local value.",
    category: mapCategory(deal.category),
    dealType: deal.dealType as DealType,
    merchantName: deal.merchantName,
    merchantSummary:
      "Featured Polokaz partner offering member-focused experiences, exclusive value, and premium local perks.",
    merchantLocation: "Partner location details available after redemption.",
    discount: mapDiscount(deal),
    expiresAt: deal.endDate ?? deal.expiresAt ?? new Date(Date.now() + 14 * 86400000).toISOString(),
    imageUrl: deal.thumbnailUrl || deal.images?.[0] || "/customer/thumbnail.png",
    termsAndConditions: baseTerms(),
  };
}

export function flattenDealsByCategory(response: DealsByCategoryResponse) {
  return Object.values(response).flat().map(mapApiDealToUiDeal);
}

export function mapDealDetailToUiDeal(response: DealDetailResponse): UiDeal {
  const { deal, merchant } = response;

  return {
    id: deal.id,
    title: deal.title,
    description:
      deal.description ??
      "Enjoy a curated Polokaz member offer with premium access, flexible redemption, and elevated local value.",
    category: mapCategory(deal.category),
    dealType: deal.dealType as DealType,
    merchantName: merchant?.businessName ?? "Merchant",
    merchantSummary:
      merchant?.businessCategory
        ? `${merchant.businessCategory} partner on Polokaz with curated member-only savings.`
        : "Featured Polokaz partner offering exclusive value and premium local perks.",
    merchantLocation: merchant?.website ?? merchant?.contactEmail ?? "Merchant details coming soon.",
    discount: mapDiscount({
      discountValue: deal.discountValue,
      dealType: deal.dealType,
    }),
    expiresAt: deal.expiresAt ?? new Date(Date.now() + 14 * 86400000).toISOString(),
    imageUrl: deal.thumbnailUrl || deal.images?.[0] || "/customer/thumbnail.png",
    termsAndConditions: baseTerms(),
  };
}

export function mapWalletItemToUiDeal(item: WalletApiItem): UiDeal {
  return mapApiDealToUiDeal(item.deal);
}
