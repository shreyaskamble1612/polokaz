async function testUrl(url: string) {
  console.log("\nTesting URL:", url);
  try {
    const res = await fetch(url, { redirect: "manual" });
    console.log("Status:", res.status);
    console.log("Status Text:", res.statusText);
    console.log("Location:", res.headers.get("location"));
    const body = await res.text();
    console.log("Body length:", body.length);
    if (body.length < 500 && body.length > 0) {
      console.log("Body:", body);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

async function main() {
  const publicId = "0690pdguqvo4uq3vvygui1fxteg68vnk";
  const campaign = "92d66868-2e9e-4564-bdc7-09f88178a6fb";
  await testUrl(`https://track.trackdesk.com/click?id=${publicId}`);
  await testUrl(`https://track.trackdesk.com/g/${campaign}?publicId=${publicId}`);
}

main();
