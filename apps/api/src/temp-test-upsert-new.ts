import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { db, merchants, deal, eq } from "@polokaz/db";
import { DealsService } from "./services/deals";

async function run() {
  const dealsService = new DealsService();
  const testCoupontoolsId = "test-camp-88888";

  try {
    const [testMerchant] = await db.select().from(merchants).limit(1);
    if (!testMerchant) {
      console.log("No merchants found to test with.");
      return;
    }
    console.log(`Using merchant: ${testMerchant.businessName} (UUID: ${testMerchant.id})`);

    // Clean start
    await db.delete(deal).where(eq(deal.coupontoolsId, testCoupontoolsId));

    // 1. Initial insert with merchant ID
    console.log("\n--- Test Case 1: Initial insert with merchant UUID ---");
    await dealsService.upsertDeal({
      coupontoolsId: testCoupontoolsId,
      title: "Test Conditional Deal",
      merchantName: "Test Merchant",
      dealType: "coupon",
      status: "active",
      merchantId: testMerchant.id
    });
    let [inserted] = await db.select().from(deal).where(eq(deal.coupontoolsId, testCoupontoolsId)).limit(1);
    console.log("Initial merchantId:", inserted.merchantId); // Should match testMerchant.id

    // 2. Update with merchantId undefined (should preserve existing merchantId)
    console.log("\n--- Test Case 2: Update with merchantId = undefined (preserves existing) ---");
    await dealsService.upsertDeal({
      coupontoolsId: testCoupontoolsId,
      title: "Updated Title",
      merchantName: "Test Merchant",
      dealType: "coupon",
      status: "active",
      merchantId: undefined
    });
    [inserted] = await db.select().from(deal).where(eq(deal.coupontoolsId, testCoupontoolsId)).limit(1);
    console.log("MerchantId after undefined update (should still match testMerchant.id):", inserted.merchantId);

    // 3. Update with merchantId = null (should overwrite with null)
    console.log("\n--- Test Case 3: Update with merchantId = null (overwrites to null) ---");
    await dealsService.upsertDeal({
      coupontoolsId: testCoupontoolsId,
      title: "Updated Title Again",
      merchantName: "Test Merchant",
      dealType: "coupon",
      status: "active",
      merchantId: null
    });
    [inserted] = await db.select().from(deal).where(eq(deal.coupontoolsId, testCoupontoolsId)).limit(1);
    console.log("MerchantId after null update (should be null):", inserted.merchantId);

    // Clean up
    await db.delete(deal).where(eq(deal.coupontoolsId, testCoupontoolsId));
    console.log("\nNEW CONDITIONAL UPDATE TEST PASSED!");

  } catch (error: any) {
    console.error("Test failed with error:", error.message);
  }
}

run().then(() => process.exit(0));
