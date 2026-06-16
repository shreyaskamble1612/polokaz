import "dotenv/config";
import {
  db,
  user,
  account,
  merchants,
  deals,
  walletItems,
  redemptions,
  referral,
  referralUse,
  referralConversions,
  pointsLedger,
  commissions,
  eq,
  inArray,
} from "@polokaz/db";
import { hashPassword } from "better-auth/crypto";
import crypto from "crypto";

const API_PORT = 3001;
const API_URL = `http://127.0.0.1:${API_PORT}`;

// Helper to wait
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to capture cookies from Set-Cookie header
function getCookieString(headers: Headers): string {
  if (typeof (headers as any).getSetCookie === "function") {
    const setCookies = (headers as any).getSetCookie();
    return setCookies.map((cookie: string) => cookie.split(";")[0]).join("; ");
  }
  const setCookie = headers.get("set-cookie");
  if (!setCookie) return "";
  return setCookie
    .split(",")
    .map((cookie: string) => cookie.trim().split(";")[0])
    .join("; ");
}

async function runTests() {
  console.log("🚀 Starting Direct E2E validation script...");

  // Setup unique emails for E2E tests
  const adminEmail = "e2e_admin@example.com";
  const merchantEmail = "e2e_merchant@example.com";
  const consumerEmail = "e2e_consumer@example.com";
  const referredConsumerEmail = "e2e_referred_consumer@example.com";
  const passwordText = "Password123!";

  console.log("\n🧹 Cleaning up old E2E test data...");
  const testEmails = [adminEmail, merchantEmail, consumerEmail, referredConsumerEmail];
  
  // Find users
  const oldUsers = await db.query.user.findMany({
    where: inArray(user.email, testEmails),
  });
  const oldUserIds = oldUsers.map((u) => u.id);

  if (oldUserIds.length > 0) {
    // Clean tables referencing user in correct dependency order
    await db.delete(referralConversions).where(
      inArray(referralConversions.referrerId, oldUserIds)
    );
    await db.delete(referralConversions).where(
      inArray(referralConversions.referredUserId, oldUserIds)
    );
    await db.delete(referralUse).where(
      inArray(referralUse.usedBy, oldUserIds)
    );
    await db.delete(referral).where(
      inArray(referral.createdBy, oldUserIds)
    );
    await db.delete(walletItems).where(
      inArray(walletItems.userId, oldUserIds)
    );
    await db.delete(redemptions).where(
      inArray(redemptions.userId, oldUserIds)
    );
    await db.delete(pointsLedger).where(
      inArray(pointsLedger.userId, oldUserIds)
    );
    await db.delete(commissions).where(
      inArray(commissions.userId, oldUserIds)
    );

    // Clean merchants and deals created by merchants
    const oldMerchants = await db.query.merchants.findMany({
      where: inArray(merchants.userId, oldUserIds),
    });
    const oldMerchantIds = oldMerchants.map((m) => m.id);

    if (oldMerchantIds.length > 0) {
      await db.delete(deals).where(inArray(deals.merchantId, oldMerchantIds));
      await db.delete(merchants).where(inArray(merchants.id, oldMerchantIds));
    }

    // Delete accounts & user rows
    await db.delete(account).where(inArray(account.userId, oldUserIds));
    await db.delete(user).where(inArray(user.id, oldUserIds));
    console.log(`Removed ${oldUserIds.length} old test users.`);
  }

  console.log("\n👥 Seeding clean E2E test users...");
  const hashedPassword = await hashPassword(passwordText);
  const now = new Date();

  // Create Admin
  const adminId = crypto.randomUUID();
  await db.insert(user).values({
    id: adminId,
    name: "E2E Admin",
    email: adminEmail,
    emailVerified: true,
    role: "admin",
    tier: "gold",
    birthdate: new Date(1990, 0, 1),
    countryName: "United States",
  });
  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: adminId,
    providerId: "credential",
    password: hashedPassword,
    userId: adminId,
  });

  // Create Merchant
  const merchantUserId = crypto.randomUUID();
  await db.insert(user).values({
    id: merchantUserId,
    name: "E2E Merchant Owner",
    email: merchantEmail,
    emailVerified: true,
    role: "merchant",
    tier: "merchant",
    birthdate: new Date(1985, 5, 15),
    countryName: "United States",
  });
  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: merchantUserId,
    providerId: "credential",
    password: hashedPassword,
    userId: merchantUserId,
  });
  const [seededMerchant] = await db.insert(merchants).values({
    userId: merchantUserId,
    businessName: "E2E Test Boutique",
    businessCategory: "Retail & Shopping",
    contactEmail: merchantEmail,
    website: "https://e2e-boutique.example.com",
    status: "active",
  }).returning();

  // Create Consumer
  const consumerId = crypto.randomUUID();
  await db.insert(user).values({
    id: consumerId,
    name: "E2E Consumer User",
    email: consumerEmail,
    emailVerified: true,
    role: "user",
    tier: "free",
    birthdate: new Date(1995, 10, 20),
    countryName: "Canada",
  });
  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: consumerId,
    providerId: "credential",
    password: hashedPassword,
    userId: consumerId,
  });

  console.log("Seeding completed successfully.");
  console.log("✅ Using currently active API server on port 3001!");

  const results: Record<string, boolean> = {};

  try {
    // ----------------------------------------------------
    // FLOW 1: AUTHENTICATION FLOW
    // ----------------------------------------------------
    console.log("\n🔑 Testing AUTHENTICATION flow...");
    const authRes = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: passwordText }),
    });
    
    if (authRes.status === 200) {
      console.log("  ✅ Admin credentials successfully verified (HTTP 200).");
      results["Authentication Sign-In"] = true;
    } else {
      console.log(`  ❌ Sign-in failed with status ${authRes.status}`);
      results["Authentication Sign-In"] = false;
    }
    const adminCookies = getCookieString(authRes.headers);

    // Verify session details
    const sessionRes = await fetch(`${API_URL}/api/auth/get-session`, {
      headers: { Cookie: adminCookies },
    });
    const sessionData = await sessionRes.json();
    if (sessionRes.status === 200 && sessionData.user?.email === adminEmail) {
      console.log("  ✅ Session verification checks out correctly.");
      results["Session Retrieval"] = true;
    } else {
      console.log("  ❌ Session details did not match.");
      results["Session Retrieval"] = false;
    }

    // ----------------------------------------------------
    // FLOW 2: REFERRAL FLOW (INVITE & VALIDATION)
    // ----------------------------------------------------
    console.log("\n🔗 Testing REFERRAL flow...");
    // Retrieve/create referral code
    const myLinkRes = await fetch(`${API_URL}/api/referral/my-link`, {
      headers: { Cookie: adminCookies },
    });
    const linkData = await myLinkRes.json();
    
    let referralCode = "";
    if (myLinkRes.status === 200 && linkData.code) {
      referralCode = linkData.code;
      console.log(`  ✅ Referral code generated: "${referralCode}"`);
      results["Referral Creation (my-link)"] = true;
    } else {
      console.log("  ❌ Failed to retrieve/create referral link.");
      results["Referral Creation (my-link)"] = false;
    }

    // Validate the referral code publicly
    const validateRes = await fetch(`${API_URL}/api/referral/validate/${referralCode}`);
    const validateData = await validateRes.json();
    if (validateRes.status === 200 && validateData.valid === true) {
      console.log("  ✅ Public referral code validation returned valid: true.");
      results["Referral Validation"] = true;
    } else {
      console.log("  ❌ Referral code validation failed.");
      results["Referral Validation"] = false;
    }

    // ----------------------------------------------------
    // FLOW 3: ADMIN FLOW
    // ----------------------------------------------------
    console.log("\n👑 Testing ADMIN flow...");
    // Admin Dashboard Metrics
    const metricsRes = await fetch(`${API_URL}/api/admin/metrics`, {
      headers: { Cookie: adminCookies },
    });
    const metricsData = await metricsRes.json();
    if (metricsRes.status === 200 && metricsData.metrics && "newSignups" in metricsData.metrics) {
      console.log("  ✅ Admin metrics fetched successfully.");
      results["Admin Metrics"] = true;
    } else {
      console.log("  ❌ Failed to fetch admin metrics.");
      results["Admin Metrics"] = false;
    }

    // Admin Users Manager List
    const adminUsersRes = await fetch(`${API_URL}/api/admin/users`, {
      headers: { Cookie: adminCookies },
    });
    const adminUsersData = await adminUsersRes.json();
    if (adminUsersRes.status === 200 && Array.isArray(adminUsersData.users)) {
      console.log(`  ✅ Admin user manager loaded list of ${adminUsersData.users.length} users.`);
      results["Admin Users List"] = true;
    } else {
      console.log("  ❌ Failed to load admin users list.");
      results["Admin Users List"] = false;
    }

    // Admin Payouts Manager List
    const adminPayoutsRes = await fetch(`${API_URL}/api/admin/payouts`, {
      headers: { Cookie: adminCookies },
    });
    const adminPayoutsData = await adminPayoutsRes.json();
    if (adminPayoutsRes.status === 200 && Array.isArray(adminPayoutsData.payouts)) {
      console.log("  ✅ Admin payout requests list loaded.");
      results["Admin Payouts List"] = true;
    } else {
      console.log("  ❌ Failed to load admin payouts list.");
      results["Admin Payouts List"] = false;
    }

    // ----------------------------------------------------
    // FLOW 4: MERCHANT FLOW
    // ----------------------------------------------------
    console.log("\n🏬 Testing MERCHANT flow...");
    // Merchant Log In
    const merchantLoginRes = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: merchantEmail, password: passwordText }),
    });
    const merchantCookies = getCookieString(merchantLoginRes.headers);
    if (merchantLoginRes.status === 200) {
      console.log("  ✅ Merchant credentials successfully verified.");
      results["Merchant Log-In"] = true;
    } else {
      console.log("  ❌ Merchant login failed.");
      results["Merchant Log-In"] = false;
    }

    // Merchant Profile Retrieval
    const merchantProfileRes = await fetch(`${API_URL}/api/merchants/me`, {
      headers: { Cookie: merchantCookies },
    });
    const merchantProfileData = await merchantProfileRes.json();
    if (merchantProfileRes.status === 200 && merchantProfileData.merchant?.businessName === "E2E Test Boutique") {
      console.log("  ✅ Merchant profile successfully retrieved.");
      results["Merchant Profile"] = true;
    } else {
      console.log("  ❌ Failed to load merchant profile.");
      results["Merchant Profile"] = false;
    }

    // Merchant Creates a Deal
    const createDealRes = await fetch(`${API_URL}/api/merchants/me/deals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: merchantCookies,
      },
      body: JSON.stringify({
        title: "Buy 1 Get 1 Free E2E Deal",
        description: "Special deal for end-to-end flow validation.",
        category: "Retail & Shopping",
        dealType: "coupon",
        discountValue: "BOGO",
        expiresAt: new Date(now.getFullYear() + 1, 0, 1).toISOString(),
      }),
    });
    const dealResult = await createDealRes.json();
    let testDealId = "";
    if (createDealRes.status === 201 && dealResult.deal?.id) {
      testDealId = dealResult.deal.id;
      console.log(`  ✅ Deal successfully created (ID: ${testDealId}) with status: ${dealResult.deal.status}`);
      results["Merchant Create Deal"] = true;
    } else {
      console.log(`  ❌ Deal creation failed. Status: ${createDealRes.status}`, dealResult);
      results["Merchant Create Deal"] = false;
    }

    // Merchant views their deals
    const merchantDealsRes = await fetch(`${API_URL}/api/merchants/me/deals`, {
      headers: { Cookie: merchantCookies },
    });
    const merchantDealsData = await merchantDealsRes.json();
    if (merchantDealsRes.status === 200 && merchantDealsData.deals.some((d: any) => d.id === testDealId)) {
      console.log("  ✅ Deal correctly listable on Merchant Deals view.");
      results["Merchant Deals List"] = true;
    } else {
      console.log("  ❌ Deal did not show up in merchant list.");
      results["Merchant Deals List"] = false;
    }

    // ----------------------------------------------------
    // INTEGRATION: ADMIN APPROVES DEAL
    // ----------------------------------------------------
    console.log("\n⚙️ Approving deal via Admin panel...");
    const approveDealRes = await fetch(`${API_URL}/api/admin/deals/${testDealId}/approve`, {
      method: "POST",
      headers: { Cookie: adminCookies },
    });
    const approvedData = await approveDealRes.json();
    if (approveDealRes.status === 200 && approvedData.deal?.status === "active") {
      console.log("  ✅ Deal successfully approved by Admin and set to active.");
      results["Admin Approve Deal"] = true;
    } else {
      console.log("  ❌ Deal approval failed.");
      results["Admin Approve Deal"] = false;
    }

    // ----------------------------------------------------
    // FLOW 5: CONSUMER FLOW (BROWSE, SAVE, REDEEM)
    // ----------------------------------------------------
    console.log("\n🛒 Testing CONSUMER flow...");
    // Consumer Log In
    const consumerLoginRes = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: consumerEmail, password: passwordText }),
    });
    const consumerCookies = getCookieString(consumerLoginRes.headers);
    if (consumerLoginRes.status === 200) {
      console.log("  ✅ Consumer successfully logged in.");
      results["Consumer Log-In"] = true;
    } else {
      console.log("  ❌ Consumer log-in failed.");
      results["Consumer Log-In"] = false;
    }

    // Consumer browses deals list
    const dealsListRes = await fetch(`${API_URL}/api/deals`, {
      headers: { Cookie: consumerCookies },
    });
    const dealsListData = await dealsListRes.json();
    if (dealsListRes.status === 200 && Array.isArray(dealsListData.deals)) {
      const hasOurDeal = dealsListData.deals.some((d: any) => d.id === testDealId);
      console.log(`  ✅ Deals list loaded. Contains our E2E approved deal: ${hasOurDeal}`);
      results["Consumer Browse Deals"] = true;
    } else {
      console.log("  ❌ Failed to browse deals.");
      results["Consumer Browse Deals"] = false;
    }

    // Consumer saves deal to wallet
    const saveWalletRes = await fetch(`${API_URL}/api/wallet/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: consumerCookies,
      },
      body: JSON.stringify({ dealId: testDealId }),
    });
    const walletSaveResult = await saveWalletRes.json();
    if (saveWalletRes.status === 201 || saveWalletRes.status === 200) {
      console.log("  ✅ Deal successfully saved to Consumer Wallet.");
      results["Consumer Save Deal"] = true;
    } else {
      console.log(`  ❌ Failed to save deal. Status: ${saveWalletRes.status}`, walletSaveResult);
      results["Consumer Save Deal"] = false;
    }

    // Consumer redeems the saved deal
    const redeemRes = await fetch(`${API_URL}/api/wallet/${testDealId}/redeem`, {
      method: "POST",
      headers: { Cookie: consumerCookies },
    });
    const redeemData = await redeemRes.json();
    if (redeemRes.status === 200 && redeemData.success === true) {
      console.log("  ✅ Deal redeemed successfully from wallet!");
      results["Consumer Redeem Deal"] = true;
    } else {
      console.log(`  ❌ Failed to redeem deal. Status: ${redeemRes.status}`, redeemData);
      results["Consumer Redeem Deal"] = false;
    }

    // Verify consumer earned points
    const pointsRes = await fetch(`${API_URL}/api/me/points`, {
      headers: { Cookie: consumerCookies },
    });
    const pointsData = await pointsRes.json();
    if (pointsRes.status === 200 && pointsData.balance > 0) {
      console.log(`  ✅ Points ledger updated successfully. Current balance: ${pointsData.balance} pts.`);
      results["Consumer Points Balance"] = true;
    } else {
      console.log("  ❌ Consumer points balance not updated.");
      results["Consumer Points Balance"] = false;
    }

    // Check consumer profile updates
    const updateProfileRes = await fetch(`${API_URL}/api/me/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: consumerCookies,
      },
      body: JSON.stringify({
        name: "E2E Consumer Updated Name",
        birthdate: new Date(1996, 11, 25).toISOString(),
        countryName: "United Kingdom",
      }),
    });
    const profileUpdatedData = await updateProfileRes.json();
    if (updateProfileRes.status === 200 && profileUpdatedData.user?.name === "E2E Consumer Updated Name") {
      console.log("  ✅ Consumer profile updated successfully.");
      results["Consumer Profile Update"] = true;
    } else {
      console.log("  ❌ Consumer profile update failed.");
      results["Consumer Profile Update"] = false;
    }

  } catch (error) {
    console.error("❌ E2E execution error:", error);
  } finally {
    // Clean up E2E records
    console.log("🧹 Cleaning up created E2E records from database...");
    const oldUsers = await db.query.user.findMany({
      where: inArray(user.email, testEmails),
    });
    const oldUserIds = oldUsers.map((u) => u.id);

    if (oldUserIds.length > 0) {
      await db.delete(referralConversions).where(
        inArray(referralConversions.referrerId, oldUserIds)
      );
      await db.delete(referralConversions).where(
        inArray(referralConversions.referredUserId, oldUserIds)
      );
      await db.delete(referralUse).where(
        inArray(referralUse.usedBy, oldUserIds)
      );
      await db.delete(referral).where(
        inArray(referral.createdBy, oldUserIds)
      );
      await db.delete(walletItems).where(
        inArray(walletItems.userId, oldUserIds)
      );
      await db.delete(redemptions).where(
        inArray(redemptions.userId, oldUserIds)
      );
      await db.delete(pointsLedger).where(
        inArray(pointsLedger.userId, oldUserIds)
      );
      await db.delete(commissions).where(
        inArray(commissions.userId, oldUserIds)
      );

      const oldMerchants = await db.query.merchants.findMany({
        where: inArray(merchants.userId, oldUserIds),
      });
      const oldMerchantIds = oldMerchants.map((m) => m.id);

      if (oldMerchantIds.length > 0) {
        await db.delete(deals).where(inArray(deals.merchantId, oldMerchantIds));
        await db.delete(merchants).where(inArray(merchants.id, oldMerchantIds));
      }

      await db.delete(account).where(inArray(account.userId, oldUserIds));
      await db.delete(user).where(inArray(user.id, oldUserIds));
    }
  }

  // Generate Report
  console.log("\n📊 ==============================================");
  console.log("📊           E2E FLOW VALIDATION REPORT           ");
  console.log("📊 ==============================================");
  let passedCount = 0;
  const totalCount = Object.keys(results).length;
  for (const [testName, passed] of Object.entries(results)) {
    if (passed) {
      console.log(` ✅  [PASS]  ${testName}`);
      passedCount++;
    } else {
      console.log(` ❌  [FAIL]  ${testName}`);
    }
  }
  console.log("📊 ==============================================");
  console.log(`📊 Result: ${passedCount}/${totalCount} tests passed.`);
  console.log("📊 ==============================================\n");

  if (passedCount === totalCount) {
    console.log("🎉 E2E Validation completed successfully!");
    process.exit(0);
  } else {
    console.log("🔴 E2E Validation failed on some checks.");
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal Error running E2E Validation tests:", err);
  process.exit(1);
});
