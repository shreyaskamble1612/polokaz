export const membershipTierValues = ["free", "basic", "gold", "merchant"] as const;
export type MembershipTier = (typeof membershipTierValues)[number];
