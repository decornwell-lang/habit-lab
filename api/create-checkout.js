// POST /api/create-checkout  { cohortId, screening, returnPath, embedded }
// Works for signed-in members and for visitors: a visitor pays first (Stripe asks for
// their email) and creates their account afterwards; confirm-checkout then links the
// payment to the account with that email.
// embedded: true → Stripe's payment form shown inside the app (EmbeddedPayment.jsx); returns
// { clientSecret, sessionId } and doesn't leave the page. Otherwise returns Stripe's page { url }.
// returnPath: where Stripe sends them back to (only the join steps, "/join/<cohortId>";
// otherwise the dashboard).
// Starts a Stripe Checkout payment for a paid cohort and returns its URL.
// Prices are in euros and include VAT: the member pays exactly the price shown. With
// STRIPE_TAX=on (after Stripe Tax is set up in the Stripe dashboard), Stripe works out
// the VAT inside that price for the member's country and shows it on the receipt.
import { handle, optionalUser, db, stripe, siteOrigin, HttpError } from "./_lib/server.js";

export default handle(async (req, res) => {
  const user = await optionalUser(req); // null for a visitor paying before creating an account
  const { cohortId, screening, returnPath, embedded } = req.body || {};
  if (!cohortId) throw new HttpError(400, "Missing cohort.");

  const snap = await db().doc(`cohorts/${cohortId}`).get();
  if (!snap.exists) throw new HttpError(404, "That cohort no longer exists.");
  const cohort = snap.data();

  if (user && (cohort.memberIds || []).includes(user.uid)) return res.json({ joined: true });
  if (cohort.archived || !Number(cohort.price)) throw new HttpError(400, "This cohort isn't open for payment.");
  if (cohort.status === "finished") throw new HttpError(400, "This cohort has finished.");

  const origin = siteOrigin(req);
  const back = returnPath === `/join/${cohortId}` ? returnPath : "/dashboard";
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    ...(user ? { customer_email: user.email } : {}), // a visitor types their email on the payment form
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
    metadata: {
      ...(user ? { uid: user.uid } : { guest: "true" }),
      cohortId,
      ...(screening ? { screeningAdvised: String(Boolean(screening.advised)) } : {}), // alcohol-free screening: was the advice shown?
    },
    ...(embedded
      ? { ui_mode: "embedded", redirect_on_completion: "if_required", return_url: `${origin}${back}?checkout=success&session_id={CHECKOUT_SESSION_ID}` }
      : { success_url: `${origin}${back}?checkout=success&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}${back}?checkout=cancelled` }),
  });

  res.json(embedded ? { clientSecret: session.client_secret, sessionId: session.id } : { url: session.url });
});
