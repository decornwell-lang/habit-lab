// POST /api/confirm-checkout  { sessionId }
// After a payment: checks with Stripe that it really went through, then adds the member
// to the cohort and records their access (api/_lib/cohortPayments.js). Stripe's webhook
// does the same independently, so a member who closes the app straight after paying is
// still added. A payment made by a signed-in member must be theirs. A payment made by
// a visitor (before creating an account) is linked to the account whose email matches
// the email given to Stripe, once only (recorded in checkoutClaims/{sessionId}).
import { handle, requireUser, stripe, db, HttpError } from "./_lib/server.js";
import { recordCohortPayment } from "./_lib/cohortPayments.js";

export default handle(async (req, res) => {
  const user = await requireUser(req);
  const { sessionId } = req.body || {};
  if (!sessionId) throw new HttpError(400, "Missing payment session.");

  const session = await stripe().checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") throw new HttpError(402, "The payment hasn't completed yet.");

  if (session.metadata?.guest === "true") {
    const paidWith = (session.customer_details?.email || "").toLowerCase();
    if (!paidWith || paidWith !== (user.email || "").toLowerCase()) {
      throw new HttpError(403, `This payment was made with ${session.customer_details?.email}. Please log in or sign up with that email.`);
    }
    const claim = db().doc(`checkoutClaims/${session.id}`);
    const claimed = await claim.get();
    if (claimed.exists && claimed.data().uid !== user.uid) throw new HttpError(403, "This payment is already linked to another account.");
    await claim.set({ uid: user.uid, cohortId: session.metadata.cohortId, at: new Date() });
  } else if (session.metadata?.uid !== user.uid) {
    throw new HttpError(403, "This payment belongs to a different account.");
  }

  await recordCohortPayment(user.uid, session); // also done by the Stripe webhook; safe to repeat

  res.json({ joined: true, cohortId: session.metadata.cohortId });
});
