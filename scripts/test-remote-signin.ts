async function testSignIn() {
  const url = "https://polokaz-api-staging.onrender.com/api/auth/sign-in/email";
  console.log(`Sending POST to ${url}...`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "polokaz@polokaz.com",
        password: "polokaz",
      }),
    });
    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
    const body = await res.text();
    console.log("Body:", body);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testSignIn();
