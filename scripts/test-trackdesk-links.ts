import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, "../apps/api/.env");
dotenv.config({ path: envPath });

const apiKey = process.env.TRACKDESK_API_KEY;
const tenantId = process.env.TRACKDESK_TENANT_ID || "testingpolo";
const baseUrl = `https://${tenantId}.trackdesk.com`;
const campaignId = process.env.TRACKDESK_CAMPAIGN_ID;

async function main() {
  console.log("Listing offers and tracking link configuration...");
  try {
    const res = await fetch(`${baseUrl}/api/node/offers/v1/list-with-landing-pages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey || "",
      },
      body: JSON.stringify({}),
    });

    console.log("Status:", res.status);
    const body = await res.json();
    console.log("Offers detail:", JSON.stringify(body, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
