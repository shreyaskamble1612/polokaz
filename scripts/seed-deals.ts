/**
 * Seed sample deals for development (when Coupontools is not configured)
 * Run: pnpm exec tsx scripts/seed-deals.ts
 */
import "dotenv/config";
import { db } from "@polokaz/db";
import { deal } from "@polokaz/db";

const SAMPLE_DEALS = [
  {
    id: "cam_sample_1",
    title: "20% Off On Overall Bill",
    description:
      "Enjoy a flat 20% discount on all food and beverage orders at select locations. No minimum bill required.",
    category: "Food & Drink",
    dealType: "percentage",
    discountValue: "20",
    merchantName: "Abc Merchant",
    status: "active",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-12-31"),
    coupontoolsCouponId: "cam_sample_1",
    featured: true,
  },
  {
    id: "cam_sample_2",
    title: "$25 Off On Clothing",
    description: "Get $25 off your next clothing purchase. Valid on orders over $100.",
    category: "Retail & Shopping",
    dealType: "fixed_amount",
    discountValue: "25",
    merchantName: "Abc Merchant",
    status: "active",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-12-31"),
    coupontoolsCouponId: "cam_sample_2",
    featured: true,
  },
  {
    id: "cam_sample_3",
    title: "15% Off Wellness Services",
    description: "Access resources for stress management, mindfulness, and achieving your personal health goals.",
    category: "Health & Wellness",
    dealType: "percentage",
    discountValue: "15",
    merchantName: "Wellness Co",
    status: "active",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-12-31"),
    coupontoolsCouponId: "cam_sample_3",
    featured: false,
  },
];

async function main() {
  console.log("Seeding sample deals...");
  for (const d of SAMPLE_DEALS) {
    await db
      .insert(deal)
      .values({
        ...d,
        images: ["https://placehold.co/214x218"],
        thumbnailUrl: "https://placehold.co/214x218",
      })
      .onConflictDoUpdate({
        target: deal.id,
        set: {
          title: d.title,
          description: d.description,
          category: d.category,
          dealType: d.dealType,
          discountValue: d.discountValue,
          merchantName: d.merchantName,
          status: d.status,
          startDate: d.startDate,
          endDate: d.endDate,
          featured: d.featured,
          updatedAt: new Date(),
        },
      });
    console.log(`  - ${d.title}`);
  }
  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
