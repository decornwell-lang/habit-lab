// POST /api/confirm-checkout  { sessionId }
// Called when a member returns from Stripe. Checks with Stripe that the
// payment really went through, then adds them to the cohort.
// (A welcome email can be sent from here later.)
import { handle, requireUser, stripe, addMemberToCohort, HttpError } from "./_lib/server.js";

export default handle(async (req, res) => {
  const user = await requireUser(req);
  const { sessionId } = req.body || {};
  if (!sessionId) throw new HttpError(400, "Missing payment session.");

  const session = await stripe().checkout.sessions.retrieve(sessionId);
  if (session.metadata?.uid !== user.uid) throw new HttpError(403, "This payment belongs to a different account.");
  if (session.payment_status !== "paid") throw new HttpError(402, "The payment hasn't completed yet.");

  await addMemberToCohort(user.uid, session.metadata.cohortId, {
    paid: true,
    method: "stripe",
    amount: (session.amount_total || 0) / 100,
    currency: session.currency,
    stripeSessionId: session.id,
    acceptedTermsAt: session.metadata.acceptedTermsAt || null,
  });

  res.json({ joined: true, cohortId: session.metadata.cohortId });
});
