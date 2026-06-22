import fs from "fs";
import path from "path";

async function main() {
  const specPath = path.resolve(__dirname, "../scratch/spec.json");
  const data = JSON.parse(fs.readFileSync(specPath, "utf-8"));
  const schemas = data.components?.schemas || {};
  console.log("Relevant schemas/fields containing 'link' or 'url':");
  Object.keys(schemas).forEach(schemaName => {
    const schema = schemas[schemaName];
    const properties = schema.properties || {};
    Object.keys(properties).forEach(propName => {
      if (propName.toLowerCase().includes("link") || propName.toLowerCase().includes("url")) {
        console.log(`  * ${schemaName}.${propName}:`, properties[propName]);
      }
    });
  });
}

main();
