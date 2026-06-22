import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, "../apps/api/.env");
dotenv.config({ path: envPath });

const apiKey = process.env.TRACKDESK_API_KEY;
const tenantId = process.env.TRACKDESK_TENANT_ID || "testingpolo";
const baseUrl = `https://${tenantId}.trackdesk.com`;
const campaignId = process.env.TRACKDESK_CAMPAIGN_ID;

async function main() {
  const publicId = "0690pdguqvo4uq3vvygui1fxteg68vnk";
  const destinationUrl = "http://localhost:3000/sign-up/onboarding?referralId=test-ref-id";
  console.log("Building tracking link for affiliate:", publicId);
  console.log("Tenant:", tenantId);
  console.log("Campaign ID:", campaignId);

  try {
    // 1. Fetch affiliate to get sourceId (UUID)
    const listRes = await fetch(`${baseUrl}/api/node/affiliates/v1`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey || "",
      },
      body: JSON.stringify({
        filters: {
          publicIds: [publicId]
        }
      })
    });

    if (!listRes.ok) {
      console.log("Fetch affiliate failed status:", listRes.status);
      return;
    }

    const listData = await listRes.json();
    const affiliate = listData?.affiliates?.[0];
    if (!affiliate) {
      console.log("Affiliate not found.");
      return;
    }
    const sourceId = affiliate.sourceId;
    console.log("Found sourceId:", sourceId);

    // 2. Fetch offers
    const offerRes = await fetch(`${baseUrl}/api/node/offers/v1/list-with-landing-pages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey || "",
      },
      body: JSON.stringify({}),
    });

    if (!offerRes.ok) {
      console.log("Fetch offers failed status:", offerRes.status);
      return;
    }

    const offerData = await offerRes.json();
    const offer = offerData?.offers?.find((o: any) => o.id === campaignId);
    if (!offer) {
      console.log("Offer not found for campaign ID:", campaignId);
      console.log("Available offers:", offerData?.offers?.map((o: any) => o.id));
      return;
    }

    const landingPageId = offer.landingPages?.[0]?.id;
    console.log("Landing Page ID:", landingPageId);

    if (!landingPageId) {
      console.log("No landing pages found.");
      return;
    }

    // 3. Build link
    const buildRes = await fetch(`${baseUrl}/api/node/tracking-links/v1/build`, {
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
            landingPageId: landingPageId,
            deepLinkUrl: destinationUrl
          }
        }
      }),
    });

    console.log("Build Status:", buildRes.status, buildRes.statusText);
    const buildData = await buildRes.json();
    console.log("Build Response:", JSON.stringify(buildData, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
