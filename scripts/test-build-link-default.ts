import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, "../apps/api/.env");
dotenv.config({ path: envPath });

const apiKey = process.env.TRACKDESK_API_KEY;
const tenantId = process.env.TRACKDESK_TENANT_ID || "testingpolo";
const baseUrl = `https://${tenantId}.trackdesk.com`;
const campaignId = process.env.TRACKDESK_CAMPAIGN_ID;

async function main() {
  const sourceId = "82f9cf8e-982a-4530-b289-98f7d08b4f03"; // affiliate source UUID
  const landingPageId = "89fece96-11f9-4fb6-b1a1-8ea1b5cc241f";
  console.log("Building tracking link with landingPageId:", landingPageId);

  try {
    const response = await fetch(`${baseUrl}/api/node/tracking-links/v1/build`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey || "",
      },
      body: JSON.stringify({
        sourceId: sourceId,
        offerId: campaignId,
        target: {
          systemRedirect: {
            landingPageId: landingPageId
          }
        }
      }),
    });

    console.log("Status:", response.status, response.statusText);
    const body = await response.json();
    console.log("Response:", JSON.stringify(body, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
