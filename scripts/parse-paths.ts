import fs from "fs";
import path from "path";

async function main() {
  const specPath = path.resolve(__dirname, "../scratch/spec.json");
  const data = JSON.parse(fs.readFileSync(specPath, "utf-8"));
  const paths = Object.keys(data.paths || {});
  console.log("All paths in OpenAPI spec:");
  paths.forEach(p => {
    if (p.includes("offer") || p.includes("link") || p.includes("campaign")) {
      console.log("  *", p);
    }
  });
}

main();
