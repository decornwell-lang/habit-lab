// POST /api/stripe-webhook  (called by Stripe, never by the app)
// Records paid cohorts (checkout.session.completed: the member is added and their access
// recorded, even if they closed the app straight after paying) and keeps the Study Group
// subscription records up to date. Every message is checked against
// STRIPE_WEBHOOK_SECRET (Stripe → Developers → Webhooks → this endpoint → Signing secret),
// and each Stripe event is handled once (stripeEvents/{eventId}); the handlers themselves
// always write Stripe's current state, so a repeat changes nothing.
// Events: checkout.session.completed, checkout.session.async_payment_succeeded,
// customer.subscription.created / updated / deleted, invoice.paid.
// A cancelled subscription keeps its record: access simply ends at currentPeriodEnd.
import { db, stripe, FieldValue } from "./_lib/server.js";
import { saveSubscription } from "./_lib/studyGroup.js";
import { recordCohortPayment, recordGuestPayment } from "./_lib/cohortPayments.js";

export const config = { api: { bodyParser: false } }; // the signature is checked on the raw body

async function rawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(500).json({ error: "STRIPE_WEBHOOK_SECRET is missing in Vercel." });

  let event;
  try {
    event = stripe().webhooks.constructEvent(await rawBody(req), req.headers["stripe-signature"], secret);
  } catch (err) {
    console.error("Stripe webhook signature check failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  const seen = db().doc(`stripeEvents/${event.id}`);
  try {
    await seen.create({ type: event.type, receivedAt: FieldValue.serverTimestamp() }); // fails if already handled
  } catch {
    return res.json({ received: true, duplicate: true });
  }

  try {
    const obj = event.data.object;
    if ((event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded")
      && obj.mode === "payment" && obj.metadata?.cohortId && obj.payment_status === "paid") {
      if (obj.metadata.uid) await recordCohortPayment(obj.metadata.uid, obj);
      else await recordGuestPayment(obj); // linked when they create their account (confirm-checkout)
    } else if (event.type.startsWith("customer.subscription.")) {
      await saveSubscription(obj);
    } else if (event.type === "invoice.paid") {
      const subId = obj.subscription || obj.parent?.subscription_details?.subscription;
      if (subId) await saveSubscription(await stripe().subscriptions.retrieve(subId));
    }
    res.json({ received: true });
  } catch (err) {
    console.error(err);
    await seen.delete().catch(() => {}); // let Stripe's retry try again
    res.status(500).json({ error: "Webhook failed" });
  }
}
