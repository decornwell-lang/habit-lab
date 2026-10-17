// POST /api/study-group-checkout  { termsAccepted, immediateAccess }
// Starts the Study Group subscription (config/pricing.json → products.studyGroup) on
// Stripe's checkout page, for a signed-in member. Stripe collects the card and renews it
// each year. Prices include VAT; with STRIPE_TAX=on, Stripe shows the VAT on the invoice.
// The member must have ticked the renewal terms; their choices are saved first
// (studyGroupConsents/{checkoutSessionId}) and carried on the subscription, so the webhook
// stores which terms version they accepted, and when.
import { createRequire } from "node:module";
import { handle, requireUser, db, stripe, siteOrigin, HttpError, FieldValue } from "./_lib/server.js";

const { studyGroup } = createRequire(import.meta.url)("../config/pricing.json").products;

export default handle(async (req, res) => {
  const user = await requireUser(req);
  const { termsAccepted, immediateAccess } = req.body || {};
  if (termsAccepted !== true) throw new HttpError(400, "Please tick that you understand the subscription renews each year.");
  if (!studyGroup.stripePriceId) throw new HttpError(500, "The Study Group price isn't set up yet.");

  const existing = await db().collection("studyGroupSubscriptions").where("uid", "==", user.uid).get();
  const now = new Date();
  if (existing.docs.some((d) => ["active", "trialing"].includes(d.data().status) && d.data().currentPeriodEnd?.toDate() > now)) {
    throw new HttpError(409, "You're already a Study Group member.");
  }

  const acceptedAt = now.toISOString();
  const consent = { uid: user.uid, termsVersion: studyGroup.termsVersion, termsAcceptedAt: acceptedAt, immediateAccess: immediateAccess === true };
  const customerId = (await db().doc(`stripeCustomers/${user.uid}`).get()).data()?.stripeCustomerId;
  const origin = siteOrigin(req);

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: studyGroup.stripePriceId, quantity: 1 }],
    ...(customerId ? { customer: customerId } : { customer_email: user.email }),
    automatic_tax: { enabled: process.env.STRIPE_TAX === "on" },
    ...(process.env.STRIPE_TAX === "on" && customerId ? { customer_update: { address: "auto" } } : {}),
    subscription_data: {
      metadata: { uid: user.uid, termsVersion: consent.termsVersion, termsAcceptedAt: acceptedAt, immediateAccess: String(consent.immediateAccess) },
    },
    metadata: { uid: user.uid, product: "studyGroup" },
    success_url: `${origin}/study-group?subscribed=1`,
    cancel_url: `${origin}/study-group?cancelled=1`,
  });

  await db().doc(`studyGroupConsents/${session.id}`).set({ ...consent, checkoutSessionId: session.id, createdAt: FieldValue.serverTimestamp() });
  res.json({ url: session.url });
});
