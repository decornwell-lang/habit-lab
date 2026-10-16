// POST /api/checkout-status  { sessionId }
// For a visitor who has just paid (before creating an account): was it paid, for which
// cohort, and the email and name they gave Stripe, to fill in "Your details".
// Needs the payment's session id, which only the payer has.
import { handle, stripe, HttpError } from "./_lib/server.js";

export default handle(async (req, res) => {
  const { sessionId } = req.body || {};
  if (!sessionId) throw new HttpError(400, "Missing payment session.");
  const session = await stripe().checkout.sessions.retrieve(sessionId);
  const name = (session.customer_details?.name || "").trim().split(/\s+/);
  res.json({
    paid: session.payment_status === "paid",
    cohortId: session.metadata?.cohortId || null,
    email: session.customer_details?.email || "",
    firstName: name[0] || "",
    surname: name.slice(1).join(" "),
  });
});
