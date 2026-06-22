import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, "../apps/api/.env");
dotenv.config({ path: envPath });

const apiKey = process.env.TRACKDESK_API_KEY;
const tenantId = process.env.TRACKDESK_TENANT_ID || "testingpolo";
const baseUrl = `https://${tenantId}.trackdesk.com`;

async function main() {
  const publicId = "0690pdguqvo4uq3vvygui1fxteg68vnk";
  console.log("Querying affiliate with publicId:", publicId);

  try {
    const res = await fetch(`${baseUrl}/api/node/affiliates/v1`, {
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

    console.log("Status:", res.status, res.statusText);
    const body = await res.text();
    console.log("Response:", body);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
