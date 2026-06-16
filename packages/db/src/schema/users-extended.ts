export const membershipTierValues = [
  "free",
  "basic",
  "gold",
  "merchant",
  "regular",
  "premium",
  "organization",
  "small_vendor",
  "premium_vendor"
] as const;
export type MembershipTier = (typeof membershipTierValues)[number];

