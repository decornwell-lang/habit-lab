// POST /api/study-group-portal
// Opens Stripe's Customer Portal for the member: change card, see invoices, or cancel the
// Study Group (access then continues until the end of the paid year). No cancellation flow
// of our own: Stripe handles it, and the webhook updates our record.
import { handle, requireUser, db, stripe, siteOrigin, HttpError } from "./_lib/server.js";

export default handle(async (req, res) => {
  const user = await requireUser(req);
  const customerId = (await db().doc(`stripeCustomers/${user.uid}`).get()).data()?.stripeCustomerId;
  if (!customerId) throw new HttpError(404, "There's no Study Group subscription on this account yet.");
  const session = await stripe().billingPortal.sessions.create({ customer: customerId, return_url: `${siteOrigin(req)}/study-group` });
  res.json({ url: session.url });
});
