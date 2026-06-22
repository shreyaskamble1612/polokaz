import "dotenv/config";
import Stripe from "stripe";

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const regularMonthlyPrice = process.env.STRIPE_PRICE_REGULAR_MONTHLY;

  console.log("Stripe Secret Key loaded:", secretKey ? "YES (Starts with " + secretKey.substring(0, 10) + "...)" : "NO");
  console.log("Stripe Price Regular Monthly loaded:", regularMonthlyPrice);

  if (!secretKey) {
    console.error("STRIPE_SECRET_KEY is missing from environment variables.");
    return;
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: "2024-06-20" as any,
  });

  try {
    console.log("Attempting to create a Stripe checkout session...");
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: "test-user@example.com",
      line_items: [
        {
          price: regularMonthlyPrice,
          quantity: 1,
        },
      ],
      success_url: "http://localhost:3000/plans?checkout=success",
      cancel_url: "http://localhost:3000/plans",
    });
    console.log("✅ Checkout session created successfully! URL:", session.url);
  } catch (err: any) {
    console.error("❌ Failed to create Stripe checkout session.");
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    if (err.raw) {
      console.error("Raw Error details:", JSON.stringify(err.raw, null, 2));
    }
  }
}

main();
