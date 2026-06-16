import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, "../apps/api/.env");
dotenv.config({ path: envPath });

const apiKey = process.env.TRACKDESK_API_KEY;
const tenantId = process.env.TRACKDESK_TENANT_ID || "testingpolo";
const baseUrl = `https://${tenantId}.trackdesk.com`;

console.log("Using Tenant Domain:", baseUrl);

async function main() {
  console.log("\n--- Testing Full Corrected Trackdesk Flow (Register -> Retrieve -> Deactivate) ---");

  const dummyEmail = `dummy-affiliate-${Math.floor(Math.random() * 100000)}@example.com`;
  const dummyPublicId = `dummyaffiliate${Math.floor(Math.random() * 100000)}`;
  
  // 1. Register Affiliate
  console.log(`\n1. Registering affiliate with email: ${dummyEmail}, publicId: ${dummyPublicId}...`);
  try {
    const res = await fetch(`${baseUrl}/api/node/affiliates/v1/register-with-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey || "",
      },
      body: JSON.stringify({
        email: dummyEmail,
        name: "Test Flow Affiliate",
        status: "ACCOUNT_STATUS_ENABLED",
        publicId: {
          value: dummyPublicId
        },
        shouldSendWelcomeEmail: false,
      })
    });

    console.log("Register Status:", res.status, res.statusText);
    const body = await res.text();
    console.log("Register Response:", body);
    if (res.status !== 200) {
      console.log("❌ Registration failed, aborting.");
      process.exit(1);
    }
  } catch (err) {
    console.error("Register Fetch Error:", err);
    process.exit(1);
  }

  // 2. Query/Retrieve Affiliate by Email
  console.log(`\n2. Querying affiliate by email ${dummyEmail}...`);
  let accountId = "";
  let sourceId = "";
  let publicId = "";
  try {
    const res = await fetch(`${baseUrl}/api/node/affiliates/v1`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey || "",
      },
      body: JSON.stringify({
        filters: {
          emails: [dummyEmail]
        }
      })
    });

    console.log("Query Status:", res.status, res.statusText);
    const body = await res.text();
    console.log("Query Response:", body);
    if (res.status === 200) {
      const data = JSON.parse(body);
      if (data.affiliates && data.affiliates.length > 0) {
        accountId = data.affiliates[0].accountId;
        sourceId = data.affiliates[0].sourceId;
        publicId = data.affiliates[0].publicId;
        console.log(`✅ SUCCESS: Found affiliate. accountId = ${accountId}, sourceId = ${sourceId}, publicId = ${publicId}`);
      } else {
        console.log("❌ FAILED: Affiliate not found in list query.");
      }
    }
  } catch (err) {
    console.error("Query Fetch Error:", err);
  }

  // 3. Test deactivating using sourceId
  if (sourceId) {
    console.log(`\n3a. Testing Deactivating affiliate using sourceId (${sourceId})...`);
    try {
      const res = await fetch(`${baseUrl}/api/node/affiliates/v1/${sourceId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey || "",
        },
        body: JSON.stringify({
          status: "ACCOUNT_STATUS_DISABLED"
        })
      });

      console.log("Status:", res.status, res.statusText);
      const body = await res.text();
      console.log("Response:", body);
    } catch (err) {
      console.error("Deactivate Error:", err);
    }
  }

  // 4. Test deactivating using publicId
  if (publicId) {
    console.log(`\n3b. Testing Deactivating affiliate using publicId (${publicId})...`);
    try {
      const res = await fetch(`${baseUrl}/api/node/affiliates/v1/${publicId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey || "",
        },
        body: JSON.stringify({
          status: "ACCOUNT_STATUS_DISABLED"
        })
      });

      console.log("Status:", res.status, res.statusText);
      const body = await res.text();
      console.log("Response:", body);
    } catch (err) {
      console.error("Deactivate Error:", err);
    }
  }

  process.exit(0);
}

main();
