import type { Deal } from "@/components/deals/types";

export const MOCK_DEALS: Deal[] = [
  {
    id: "food-1",
    title: "Chef's Tasting Night with 20% OFF the Final Bill",
    description:
      "Unlock a polished dining experience with signature courses, crafted cocktails, and a member-only savings perk after sunset. This offer is designed for members who want an elevated evening out without sacrificing value.",
    category: "Food & Dining",
    dealType: "coupon",
    merchantName: "Velvet Table",
    merchantSummary:
      "A moody fine-dining room known for chef-led tasting menus, seasonal plates, and intimate late-night service.",
    merchantLocation: "Downtown Las Vegas",
    discount: "20% OFF",
    expiresAt: "2026-07-30",
    imageUrl: "/api/placeholder/400/200",
    termsAndConditions: [
      "Valid Sunday through Thursday after 5 PM.",
      "Not combinable with other promotions or holiday menus.",
      "Advance reservations are recommended for peak hours.",
    ],
  },
  {
    id: "food-2",
    title: "Weekend Brunch Pairing with Complimentary Dessert",
    description:
      "Reserve your late-morning table and enjoy a dessert upgrade with every premium brunch set ordered through Polokaz. Ideal for leisurely weekends and social catch-ups.",
    category: "Food & Dining",
    dealType: "voucher",
    merchantName: "Harbor & Honey",
    merchantSummary:
      "Bright waterfront brunch destination serving small-batch pastries, sparkling pours, and coastal comfort favorites.",
    merchantLocation: "Arts District",
    discount: "FREE DESSERT",
    expiresAt: "2026-08-12",
    imageUrl: "/api/placeholder/400/200",
    termsAndConditions: [
      "One dessert redemption per table, per visit.",
      "Voucher applies only to brunch menu reservations.",
      "Cannot be exchanged for cash value.",
    ],
  },
  {
    id: "food-3",
    title: "Late-Night Izakaya Savings on Shared Plates",
    description:
      "Explore chef-picked skewers, signature rolls, and house cocktails with a member-exclusive dinner reduction built for spontaneous nights out.",
    category: "Food & Dining",
    dealType: "coupon",
    merchantName: "Kuro Social",
    merchantSummary:
      "A contemporary izakaya blending Japanese small plates, neon energy, and a strong late-night crowd.",
    merchantLocation: "Spring Mountain",
    discount: "18% OFF",
    expiresAt: "2026-09-03",
    imageUrl: "/api/placeholder/400/200",
    termsAndConditions: [
      "Applies to food menu only.",
      "Excludes happy hour and omakase packages.",
      "Valid for parties of up to six guests.",
    ],
  },
  {
    id: "retail-1",
    title: "Curated Streetwear Drop with Instant Member Savings",
    description:
      "Shop the season's limited capsule collection with exclusive savings on outerwear, accessories, and elevated basics selected for city wear.",
    category: "Retail",
    dealType: "coupon",
    merchantName: "Northline Atelier",
    merchantSummary:
      "Independent concept store carrying limited streetwear releases, premium denim, and elevated daily essentials.",
    merchantLocation: "Forum Shops",
    discount: "15% OFF",
    expiresAt: "2026-09-04",
    imageUrl: "/api/placeholder/400/200",
    termsAndConditions: [
      "Excludes already discounted items and collaborations.",
      "One use per member during the campaign period.",
      "In-store redemption only.",
    ],
  },
  {
    id: "retail-2",
    title: "$40 Voucher Toward Designer Eyewear and Frames",
    description:
      "Refresh your look with premium frames and personalized fittings at one of the city's most refined optical studios.",
    category: "Retail",
    dealType: "voucher",
    merchantName: "Glass District",
    merchantSummary:
      "Luxury eyewear studio pairing independent frame houses with tailored styling and lens consultation.",
    merchantLocation: "Summerlin",
    discount: "$40 OFF",
    expiresAt: "2026-06-28",
    imageUrl: "/api/placeholder/400/200",
    termsAndConditions: [
      "Minimum purchase of $180 required.",
      "Not valid on prescription lens upgrades.",
      "Voucher must be presented before checkout begins.",
    ],
  },
  {
    id: "retail-3",
    title: "Premium Home Fragrance Set with Bonus Gift Wrap",
    description:
      "Bring home a layered scent collection with a polished savings perk on candle, diffuser, and room spray bundles.",
    category: "Retail",
    dealType: "loyalty",
    merchantName: "Maison Ember",
    merchantSummary:
      "Lifestyle boutique specializing in home fragrance, artisan tabletop pieces, and giftable design objects.",
    merchantLocation: "Downtown Summerlin",
    discount: "BONUS REWARD",
    expiresAt: "2026-11-16",
    imageUrl: "/api/placeholder/400/200",
    termsAndConditions: [
      "Loyalty reward unlocks after two qualifying purchases.",
      "Gift wrap offer is subject to stock availability.",
      "Applies only to signature scent collections.",
    ],
  },
  {
    id: "ent-1",
    title: "Private Cinema Lounge Access for Two",
    description:
      "Skip the standard screening and settle into a boutique lounge experience with recliner seating, concierge snacks, and a more intimate atmosphere.",
    category: "Entertainment",
    dealType: "voucher",
    merchantName: "Luma House",
    merchantSummary:
      "Boutique movie lounge offering premium seating, chef-led snack menus, and members-first private viewing events.",
    merchantLocation: "The Strip",
    discount: "2 FOR 1",
    expiresAt: "2026-08-05",
    imageUrl: "/api/placeholder/400/200",
    termsAndConditions: [
      "Valid on select weekday screenings only.",
      "Premium event nights are excluded.",
      "Voucher cannot be split across separate bookings.",
    ],
  },
  {
    id: "ent-2",
    title: "Concert Season Pass Loyalty Perk",
    description:
      "Earn premium queue access and bonus venue credits each time you book with your Polokaz loyalty membership throughout the live season.",
    category: "Entertainment",
    dealType: "loyalty",
    merchantName: "Echo Arena",
    merchantSummary:
      "Large-format live venue hosting headline concerts, touring acts, and premium member access experiences.",
    merchantLocation: "Paradise Corridor",
    discount: "BONUS ACCESS",
    expiresAt: "2026-12-31",
    imageUrl: "/api/placeholder/400/200",
    termsAndConditions: [
      "Credits accrue only on eligible ticket tiers.",
      "Queue priority may vary by event capacity.",
      "Member ID must match ticket purchaser name.",
    ],
  },
  {
    id: "ent-3",
    title: "Immersive Arcade Night with Credit Multiplier",
    description:
      "Level up your game night with boosted play credits, lounge entry, and a high-energy social setup for groups or date nights.",
    category: "Entertainment",
    dealType: "coupon",
    merchantName: "Neon Circuit",
    merchantSummary:
      "Modern arcade and social play venue mixing retro cabinets, immersive simulators, and cocktail-driven lounge spaces.",
    merchantLocation: "Fremont East",
    discount: "30% EXTRA CREDITS",
    expiresAt: "2026-10-02",
    imageUrl: "/api/placeholder/400/200",
    termsAndConditions: [
      "Offer applies only to credit package purchases above the base tier.",
      "Not redeemable during private buyout events.",
      "One redemption per member each weekend.",
    ],
  },
  {
    id: "travel-1",
    title: "Member Escape Rate at a Coastal Boutique Hotel",
    description:
      "Slip away for a polished weekend stay with a reduced nightly rate, late checkout, and a welcome beverage on arrival.",
    category: "Travel",
    dealType: "voucher",
    merchantName: "Azure Cove Hotel",
    merchantSummary:
      "Boutique resort retreat pairing design-forward rooms with spa access, ocean views, and flexible weekend itineraries.",
    merchantLocation: "Santa Monica Coast",
    discount: "$75 OFF",
    expiresAt: "2026-09-18",
    imageUrl: "/api/placeholder/400/200",
    termsAndConditions: [
      "Blackout dates apply around major holidays.",
      "Subject to room availability at booking time.",
      "Late checkout is not guaranteed on sold-out weekends.",
    ],
  },
  {
    id: "travel-2",
    title: "Airport Lounge Dining Credit for Premium Travelers",
    description:
      "Use your Polokaz benefit to unlock dining and beverage credit before departure in select lounge partner locations.",
    category: "Travel",
    dealType: "coupon",
    merchantName: "Skyline Passage",
    merchantSummary:
      "Travel concierge partner connecting members to airport lounge access, express entry perks, and departure-day comfort.",
    merchantLocation: "Harry Reid International",
    discount: "$20 CREDIT",
    expiresAt: "2026-08-30",
    imageUrl: "/api/placeholder/400/200",
    termsAndConditions: [
      "Credit is valid only at participating lounge dining counters.",
      "Same-day boarding pass required for redemption.",
      "Unused credit does not roll over.",
    ],
  },
  {
    id: "travel-3",
    title: "Weekend Road Trip Loyalty Upgrade",
    description:
      "Book recurring getaways and unlock tiered extras like navigation bundles, premium cleaning, and bonus miles through a loyalty-style travel perk.",
    category: "Travel",
    dealType: "loyalty",
    merchantName: "Open Highway Club",
    merchantSummary:
      "Members-first travel club focused on stylish road trip planning, rental upgrades, and curated regional itineraries.",
    merchantLocation: "West Coast Routes",
    discount: "UPGRADE PERKS",
    expiresAt: "2026-11-28",
    imageUrl: "/api/placeholder/400/200",
    termsAndConditions: [
      "Upgrade perks unlock after the second qualifying booking.",
      "Eligible only on participating itinerary partners.",
      "Mileage bonuses are capped monthly.",
    ],
  },
];
