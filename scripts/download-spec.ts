import fs from "fs";
import path from "path";

async function main() {
  const url = "https://developers.trackdesk.com/api.instance.json";
  console.log("Fetching spec from:", url);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Failed to fetch spec:", res.status, res.statusText);
      return;
    }
    const data = await res.json();
    const scratchDir = path.resolve(__dirname, "../scratch");
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }
    fs.writeFileSync(path.join(scratchDir, "spec.json"), JSON.stringify(data, null, 2));
    console.log("Specification downloaded successfully to scratch/spec.json");
  } catch (err) {
    console.error("Error downloading spec:", err);
  }
}

main();
