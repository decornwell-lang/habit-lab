// POST /api/create-checkout  { cohortId }
// Starts a Stripe Checkout payment for a paid cohort and returns its URL.
import { handle, requireUser, db, stripe, siteOrigin, HttpError } from "./_lib/server.js";

export default handle(async (req, res) => {
  const user = await requireUser(req);
  const { cohortId } = req.body || {};
  if (!cohortId) throw new HttpError(400, "Missing cohort.");

  const snap = await db().doc(`cohorts/${cohortId}`).get();
  if (!snap.exists) throw new HttpError(404, "That cohort no longer exists.");
  const cohort = snap.data();

  if ((cohort.memberIds || []).includes(user.uid)) return res.json({ joined: true });
  if (cohort.status === "finished") throw new HttpError(400, "This cohort has finished.");

  const origin = siteOrigin(req);
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: cohort.currency || "gbp",
          unit_amount: Math.round(Number(cohort.price) * 100),
          product_data: { name: cohort.name, description: `${cohort.durationDays}-day cohort starting ${cohort.startDate}` },
        },
      },
    ],
    metadata: { uid: user.uid, cohortId },
    success_url: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard?checkout=cancelled`,
  });

  res.json({ url: session.url });
});
