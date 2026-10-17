// POST /api/delete-account  { confirm: "DELETE" }
// A member deletes their account (My account → Delete my account). Permanently removes
// their profile, check-ins, reflections, memberships, access record and login, and takes
// them off every cohort. Payment records in `payments` are kept, because the law requires
// keeping them for tax purposes. The owner (admin) account can't be deleted this way.
import { handle, requireUser, db, adminAuth, FieldValue, HttpError } from "./_lib/server.js";

export default handle(async (req, res) => {
  const user = await requireUser(req);
  if ((req.body || {}).confirm !== "DELETE") throw new HttpError(400, "Please type DELETE to confirm.");

  const store = db();
  const userRef = store.doc(`users/${user.uid}`);
  if ((await userRef.get()).data()?.role === "admin") {
    throw new HttpError(403, "The owner account can't be deleted from the app.");
  }

  // A Study Group subscription that would renew must be cancelled first, so Stripe never
  // charges a deleted account.
  const subs = await store.collection("studyGroupSubscriptions").where("uid", "==", user.uid).get();
  if (subs.docs.some((d) => ["active", "trialing", "past_due"].includes(d.data().status) && !d.data().cancelAtPeriodEnd)) {
    throw new HttpError(409, "Please cancel your Study Group subscription first (Study Group → Manage subscription), then delete your account.");
  }

  // Off every cohort's member list.
  const memberships = await userRef.collection("memberships").get();
  for (const m of memberships.docs) {
    const cohort = store.doc(`cohorts/${m.id}`);
    if ((await cohort.get()).exists) await cohort.update({ memberIds: FieldValue.arrayRemove(user.uid) });
  }

  // Their access records, then everything under users/{uid} (check-ins, reflections, …).
  const entitlements = await store.collection("cohortEntitlements").where("uid", "==", user.uid).get();
  await Promise.all(entitlements.docs.map((d) => d.ref.delete()));
  await store.recursiveDelete(userRef);
  await Promise.all([store.doc(`publicProfiles/${user.uid}`).delete(), store.doc(`members/${user.uid}`).delete()]);

  // Finally the login itself.
  await adminAuth().deleteUser(user.uid);
  res.json({ deleted: true });
});
