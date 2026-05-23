export type DealType = "coupon" | "voucher" | "loyalty";

export type DealCategory =
  | "Food & Dining"
  | "Retail"
  | "Entertainment"
  | "Travel";

export type Deal = {
  id: string;
  title: string;
  description: string;
  category: DealCategory;
  dealType: DealType;
  merchantName: string;
  merchantSummary: string;
  merchantLocation: string;
  discount: string;
  expiresAt: string;
  imageUrl: string;
  termsAndConditions: string[];
};
