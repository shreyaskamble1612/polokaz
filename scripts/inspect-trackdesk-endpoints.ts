import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, "../apps/api/.env");
dotenv.config({ path: envPath });

const apiKey = process.env.TRACKDESK_API_KEY;
const tenantId = process.env.TRACKDESK_TENANT_ID || "testingpolo";
const baseUrl = `https://${tenantId}.trackdesk.com`;

async function main() {
  console.log("Listing affiliate tracking configurations/links...");

  try {
    // Try listing tracking-links
    const listRes = await fetch(`${baseUrl}/api/node/tracking-links/v1`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey || "",
      },
      body: JSON.stringify({
        pagination: { limit: 10 }
      })
    });

    console.log("List Link Status:", listRes.status, listRes.statusText);
    const listBody = await listRes.text();
    console.log("List Link Response:", listBody);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
