import "dotenv/config";
import { db, user, account, eq } from "@polokaz/db";
import { hashPassword } from "better-auth/crypto";

const API_URL = "http://localhost:3001";

// Helper to wait
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("🚀 Starting tier behavior testing...");

  const adminEmail = "admin-test-tier@example.com";
  const testUserEmail = "user-test-tier@example.com";
  const passwordText = "TestPassword123!";

  // 1. Clean up old test data if any
  const oldUsers = await db.select().from(user).where(eq(user.email, adminEmail));
  const oldTestUsers = await db.select().from(user).where(eq(user.email, testUserEmail));
  
  for (const u of [...oldUsers, ...oldTestUsers]) {
    await db.delete(account).where(eq(account.userId, u.id));
    await db.delete(user).where(eq(user.id, u.id));
  }

  // 2. Create Admin and Test User
  const adminId = crypto.randomUUID();
  const testUserId = crypto.randomUUID();
  const hashedPassword = await hashPassword(passwordText);

  await db.insert(user).values({
    id: adminId,
    name: "Test Admin",
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

  await db.insert(user).values({
    id: testUserId,
    name: "Test User",
    email: testUserEmail,
    emailVerified: true,
    role: "member",
    tier: "free",
    birthdate: new Date(1995, 0, 1),
    countryName: "United States",
  });
  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: testUserId,
    providerId: "credential",
    password: hashedPassword,
    userId: testUserId,
  });

  console.log("Seeded test users.");

  // 3. Log in as admin to get session cookies
  console.log("Logging in as admin...");
  const authRes = await fetch(`${API_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password: passwordText }),
  });

  if (authRes.status !== 200) {
    console.error("❌ Admin login failed with status:", authRes.status);
    throw new Error("Admin login failed");
  }

  // Capture cookies from Set-Cookie header
  let adminCookies = "";
  if (typeof (authRes.headers as any).getSetCookie === "function") {
    const setCookies = (authRes.headers as any).getSetCookie();
    adminCookies = setCookies.map((cookie: string) => cookie.split(";")[0]).join("; ");
  } else {
    const setCookie = authRes.headers.get("set-cookie");
    if (setCookie) {
      adminCookies = setCookie.split(",").map((c: string) => c.trim().split(";")[0]).join("; ");
    }
  }

  console.log("Successfully logged in as admin. Cookies captured.");

  // TEST 1: Block manual update if user has an active Stripe subscription
  console.log("\n--- TEST 1: Block tier change with active Stripe subscription ---");
  await db.update(user).set({
    tier: "basic",
    stripeSubscriptionId: "sub_test_active_123"
  }).where(eq(user.id, testUserId));

  // Make the tier change request from admin
  const res1 = await fetch(`${API_URL}/api/admin/member/${testUserId}/tier`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookies,
    },
    body: JSON.stringify({ new_tier: "gold" }),
  });

  const body1 = await res1.json();
  console.log("Status:", res1.status);
  console.log("Response Body:", body1);

  if (res1.status === 400 && body1.error === "FORBIDDEN_TIER_CHANGE") {
    console.log("✅ TEST 1 PASSED: Successfully blocked manual tier change for user with active Stripe subscription!");
  } else {
    console.error("❌ TEST 1 FAILED: Expected 400 with FORBIDDEN_TIER_CHANGE, got:", res1.status, body1);
  }

  // TEST 2: Allow manual update if user does NOT have active Stripe subscription
  console.log("\n--- TEST 2: Allow tier change without active Stripe subscription ---");
  await db.update(user).set({
    tier: "free",
    stripeSubscriptionId: null
  }).where(eq(user.id, testUserId));

  const res2 = await fetch(`${API_URL}/api/admin/member/${testUserId}/tier`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookies,
    },
    body: JSON.stringify({ new_tier: "basic" }),
  });

  const body2 = await res2.json();
  console.log("Status:", res2.status);
  console.log("Response Body:", body2);

  if (res2.status === 200 && body2.user?.tier === "basic") {
    console.log("✅ TEST 2 PASSED: Successfully updated tier for user without active Stripe subscription!");
  } else {
    console.error("❌ TEST 2 FAILED: Expected 200 with updated user basic tier, got:", res2.status, body2);
  }

  // TEST 3: User role is updated when tier changes
  console.log("\n--- TEST 3: User role updates when merchant tier is selected manually ---");
  const res3 = await fetch(`${API_URL}/api/admin/member/${testUserId}/tier`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookies,
    },
    body: JSON.stringify({ new_tier: "merchant" }),
  });

  const body3 = await res3.json();
  console.log("Status:", res3.status);
  console.log("Response Body:", body3);

  const [checkUser] = await db.select().from(user).where(eq(user.id, testUserId));

  if (res3.status === 200 && checkUser?.tier === "merchant" && checkUser?.role === "merchant") {
    console.log("✅ TEST 3 PASSED: Successfully updated user role to merchant on merchant tier update!");
  } else {
    console.error("❌ TEST 3 FAILED: Expected tier & role to be merchant, got:", checkUser?.tier, checkUser?.role);
  }

  // 4. Cleanup
  console.log("\n🧹 Cleaning up test users...");
  await db.delete(account).where(eq(account.userId, adminId));
  await db.delete(user).where(eq(user.id, adminId));
  await db.delete(account).where(eq(account.userId, testUserId));
  await db.delete(user).where(eq(user.id, testUserId));
  console.log("Test finished.");
}

main().catch((e) => {
  console.error("Fatal test error:", e);
});
