// POST /api/leave-cohort  { cohortId }
// A member removes one of their cohorts (My account → My cohorts → Remove). They're taken
// off its member list and leaderboard, and everything connected to that cohort is deleted:
// its check-ins, morning answers, intentions, evening reviews, daily counts and access.
// Payment records are kept (the law requires them for tax). Refunds are made in Stripe.
import { handle, requireUser, db, FieldValue, FieldPath, HttpError } from "./_lib/server.js";

export default handle(async (req, res) => {
  const user = await requireUser(req);
  const { cohortId } = req.body || {};
  if (!cohortId) throw new HttpError(400, "Missing cohort.");

  const store = db();
  const userRef = store.doc(`users/${user.uid}`);
  const membership = userRef.collection("memberships").doc(cohortId);
  if (!(await membership.get()).exists) throw new HttpError(404, "You're not in this cohort.");

  const [checkins, reflections, practice, activity, entitlements, cohort, profile] = await Promise.all([
    userRef.collection("checkins").where("cohortId", "==", cohortId).get(),
    userRef.collection("reflections").where("cohortId", "==", cohortId).get(),
    userRef.collection("practice").get(),
    userRef.collection("activity").get(),
    store.collection("cohortEntitlements").where("uid", "==", user.uid).where("cohortId", "==", cohortId).get(),
    store.doc(`cohorts/${cohortId}`).get(),
    store.doc(`publicProfiles/${user.uid}`).get(),
  ]);

  const writer = store.bulkWriter();
  [...checkins.docs, ...reflections.docs, ...entitlements.docs].forEach((d) => writer.delete(d.ref));
  // Morning answers ("morning_<cohortId>") and daily counts (intention.<cohortId>, evening.<cohortId>).
  practice.docs.filter((d) => `morning_${cohortId}` in d.data()).forEach((d) => writer.update(d.ref, new FieldPath(`morning_${cohortId}`), FieldValue.delete()));
  activity.docs
    .filter((d) => d.data().intention?.[cohortId] !== undefined || d.data().evening?.[cohortId] !== undefined)
    .forEach((d) => writer.update(d.ref, new FieldPath("intention", cohortId), FieldValue.delete(), new FieldPath("evening", cohortId), FieldValue.delete()));
  if (profile.exists) writer.update(profile.ref, new FieldPath("cohorts", cohortId), FieldValue.delete()); // off the leaderboard
  if (cohort.exists) writer.update(cohort.ref, { memberIds: FieldValue.arrayRemove(user.uid) });
  writer.delete(membership);
  await writer.close();

  res.json({ removed: true });
});
