// POST /api/create-checkout  { cohortId, acceptedTerms }
// Starts a Stripe Checkout payment for a paid cohort and returns its URL.
// Prices are in euros and include VAT: the member pays exactly the price shown. With
// STRIPE_TAX=on (after Stripe Tax is set up in the Stripe dashboard), Stripe works out
// the VAT inside that price for the member's country and shows it on the receipt.
import { handle, requireUser, db, stripe, siteOrigin, HttpError } from "./_lib/server.js";

export default handle(async (req, res) => {
  const user = await requireUser(req);
  const { cohortId, acceptedTerms } = req.body || {};
  if (!cohortId) throw new HttpError(400, "Missing cohort.");
  if (acceptedTerms !== true) throw new HttpError(400, "Please read and tick the cancellation terms first.");

  const snap = await db().doc(`cohorts/${cohortId}`).get();
  if (!snap.exists) throw new HttpError(404, "That cohort no longer exists.");
  const cohort = snap.data();

  if ((cohort.memberIds || []).includes(user.uid)) return res.json({ joined: true });
  if (cohort.status === "finished") throw new HttpError(400, "This cohort has finished.");

  const origin = siteOrigin(req);
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    automatic_tax: { enabled: process.env.STRIPE_TAX === "on" },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(Number(cohort.price) * 100),
          tax_behavior: "inclusive", // VAT is inside the price, never added on top
          product_data: { name: cohort.name, description: `${cohort.durationDays}-day cohort starting ${cohort.startDate}` },
        },
      },
    ],
    metadata: { uid: user.uid, cohortId, acceptedTermsAt: new Date().toISOString() }, // the 14-day cancellation terms
    success_url: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard?checkout=cancelled`,
  });

  res.json({ url: session.url });
});
