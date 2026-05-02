Stripe Webhook Handler — Changes made

Summary:
- Implemented a Stripe webhook endpoint at `POST /api/stripe/webhook` inside `apps/api/src/controllers/stripe.ts`.

Files changed:
- Updated: `apps/api/src/controllers/stripe.ts`
- Added: `shreyas.md` (this file)

What I implemented:
- Signature verification
  - Uses `STRIPE_WEBHOOK_SECRET` from environment to verify incoming webhooks with `stripe.webhooks.constructEvent()`.
  - Uses the raw request body captured by the existing global `express.json({ verify(...) })` implementation (available as `req.rawBody`).
- Idempotency & persistence
  - Checks whether an event is already processed via `isWebhookProcessed("stripe", event.id)`.
  - Persists incoming webhook events to the `webhookEvent` table using the existing `services/webhooks` helpers (`createWebhookEvent`, `logWebhookStep`, `updateWebhookEventStatus`).
- Fast response + async handling
  - Returns HTTP 200 immediately to Stripe after persisting the event record, and continues processing asynchronously so Stripe does not retry due to long processing time.
- Event handling
  - `checkout.session.completed`
    - Reads `event.data.object.metadata.userId`, `customer`, and `subscription`.
    - Uses `stripe.checkout.sessions.listLineItems(session.id)` to determine the purchased `price.id` and maps it to a tier (`basic`, `gold`, `merchant`) using the `STRIPE_PRICE_*` env vars.
    - Updates the `user` row in DB: sets `tier`, `stripeCustomerId`, and `stripeSubscriptionId`.
  - `customer.subscription.updated`
    - Determines tier from subscription items or subscription metadata and updates the user's `tier` and `stripeSubscriptionId` (lookup by `stripeCustomerId`).
  - `customer.subscription.deleted`
    - Downgrades any user whose `stripeSubscriptionId` equals the deleted subscription id to `free`, clears `stripeSubscriptionId`.
  - `invoice.payment_failed`
    - Logs the failure and marks the webhook event as processed (left as a place to implement notifications/flags later).
- Logging & error handling
  - Uses `services/webhooks` helpers to create webhook logs and to update webhook event statuses (`pending`, `processed`, `failed`, `skipped`).
  - All processing errors are recorded and the webhook event status set to `failed`.

Notes & next steps (manual):
- Add `STRIPE_WEBHOOK_SECRET` to `apps/api/.env` or your deployment environment. Example:

  STRIPE_WEBHOOK_SECRET=whsec_....

- Register the webhook endpoint in Stripe Dashboard: Developers → Webhooks → Add endpoint
  - Endpoint URL: `https://your-api.render.com/api/stripe/webhook` (or your deployed URL / local tunnel)
  - Subscribe to events:
    - `checkout.session.completed`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_failed`

- For local testing use the Stripe CLI:

  stripe listen --forward-to localhost:3001/api/stripe/webhook

Remarks about raw body handling:
- This project already captures the raw request body through the `express.json({ verify: (req, _res, buf) => { req.rawBody = buf.toString(); } })` global middleware in `apps/api/src/index.ts`.
- The webhook handler uses `req.rawBody` to verify signatures; therefore no change to middleware ordering was necessary.

If you'd like, I can:
- Add a quick unit/integration test for the webhook handler (using a mocked Stripe event).
- Add a documented `.env.example` entry and update README with webhook setup steps.
- Wire up a notification flow for `invoice.payment_failed` events.

---
Detailed change log (for reviewers)

1) `apps/api/src/controllers/stripe.ts`
- Imported `Stripe` and webhook helper functions from `../services/webhooks`.
- Added a new `POST /webhook` route that:
  - Reads `stripe-signature` header and `req.rawBody`.
  - Calls `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`.
  - Persists the webhook event via `createWebhookEvent`.
  - Immediately responds `200` to Stripe.
  - Processes the event asynchronously, updating user records and webhook event logs.

End of changes.
