// POST /api/send-message  { noticeId }
// Owner only. Sends a saved message (notices/{id}) as a push notification
// to every device of the members it is addressed to.
import { getMessaging } from "firebase-admin/messaging";
import { FieldValue } from "firebase-admin/firestore";
import { handle, requireUser, db, HttpError } from "./_lib/server.js";

// Errors that mean a device token is no longer valid and should be removed.
const DEAD_TOKEN = ["messaging/registration-token-not-registered", "messaging/invalid-registration-token", "messaging/invalid-argument"];

export default handle(async (req, res) => {
  const user = await requireUser(req);
  const store = db();
  const me = await store.doc(`users/${user.uid}`).get();
  if (me.data()?.role !== "admin") throw new HttpError(403, "Only the owner can send messages.");

  const { noticeId } = req.body || {};
  const noticeRef = store.doc(`notices/${noticeId}`);
  const notice = (await noticeRef.get()).data();
  if (!notice) throw new HttpError(404, "Message not found.");

  // Who it goes to: one cohort's members, or everyone.
  let userDocs;
  if (notice.cohortId) {
    const memberIds = (await store.doc(`cohorts/${notice.cohortId}`).get()).data()?.memberIds || [];
    userDocs = memberIds.length ? await store.getAll(...memberIds.map((id) => store.doc(`users/${id}`))) : [];
  } else {
    userDocs = (await store.collection("users").get()).docs;
  }

  const targets = []; // { uid, token }
  for (const d of userDocs) for (const token of d.data()?.fcmTokens || []) targets.push({ uid: d.id, token });

  let sent = 0;
  for (let i = 0; i < targets.length; i += 500) {
    const batch = targets.slice(i, i + 500);
    const response = await getMessaging().sendEachForMulticast({
      tokens: batch.map((t) => t.token),
      data: { noticeId, title: notice.title, body: notice.body || "", link: notice.link || "/dashboard" },
      webpush: { headers: { Urgency: "high" } },
    });
    sent += response.successCount;
    // Tidy up tokens from devices that have uninstalled or reset.
    await Promise.all(
      response.responses.map((r, j) =>
        !r.success && DEAD_TOKEN.includes(r.error?.code)
          ? store.doc(`users/${batch[j].uid}`).update({ fcmTokens: FieldValue.arrayRemove(batch[j].token) })
          : null
      )
    );
  }

  await noticeRef.update({ pushSent: sent, pushSentAt: FieldValue.serverTimestamp() });
  res.json({ sent });
});
