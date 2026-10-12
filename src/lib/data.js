// All reading and writing of Firestore data lives here, so the rest of the
// app never talks to the database directly.
//
// Collections:
//   users/{uid}                       private profile (surname, email, role)
//   users/{uid}/memberships/{cohortId} which cohorts they joined, payment
//   users/{uid}/checkins/{date}       daily check-ins
//   users/{uid}/practice/{date}       "Mark as practised today"
//   users/{uid}/practiceChecks/{id}   badge check-ins ("Still in your practice?")
//   publicProfiles/{uid}              first name, avatar, streak, badges (shown to others only if opted in)
//   cohorts/{cohortId}                cohort details and member list
//   settings/content                  Zoom link, session date, weekly media links
//   notices/{id}                      messages from the owner (also sent as push notifications)
//   pods/{podId} (+ /members/{uid})   pods members choose to join, and their shared contact cards
import {
  doc, getDoc, getDocs, setDoc, updateDoc, addDoc, collection, collectionGroup,
  query, where, orderBy, limit, writeBatch, arrayUnion, arrayRemove, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase.js";

const list = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

// ---------- Member profile ----------
export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, "users", uid), data);
}

export async function getPublicProfile(uid) {
  const snap = await getDoc(doc(db, "publicProfiles", uid));
  return snap.exists() ? { id: uid, ...snap.data() } : null;
}

export async function savePublicProfile(uid, data) {
  await setDoc(doc(db, "publicProfiles", uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// Profiles of other members. Members who haven't opted in can't be read,
// so they come back as null.
export async function getVisibleProfiles(uids) {
  return Promise.all(
    uids.map(async (uid) => {
      try {
        return await getPublicProfile(uid);
      } catch {
        return null;
      }
    })
  );
}

export async function getLeaderboard() {
  return list(await getDocs(query(collection(db, "publicProfiles"), where("leaderboardOptIn", "==", true))));
}

// ---------- Cohorts ----------
export async function getCohorts() {
  const cohorts = list(await getDocs(collection(db, "cohorts")));
  return cohorts.sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
}

export async function saveCohort(id, data) {
  if (id) return updateDoc(doc(db, "cohorts", id), data);
  return addDoc(collection(db, "cohorts"), { ...data, memberIds: [], createdAt: serverTimestamp() });
}

export async function getMemberships(uid) {
  const snap = await getDocs(collection(db, "users", uid, "memberships"));
  return snap.docs.map((d) => ({ cohortId: d.id, ...d.data() }));
}

// Free cohorts can be joined straight from the app. Paid cohorts go through
// Stripe (see /api/create-checkout.js), which adds the member after payment.
export async function joinCohortDirectly(uid, cohortId, method = "free") {
  const batch = writeBatch(db);
  batch.set(doc(db, "users", uid, "memberships", cohortId), { paid: false, method, joinedAt: serverTimestamp() });
  batch.update(doc(db, "cohorts", cohortId), { memberIds: arrayUnion(uid) });
  await batch.commit();
}

export async function updateMembership(uid, cohortId, data) {
  await updateDoc(doc(db, "users", uid, "memberships", cohortId), data);
}

// ---------- Check-ins and practice ----------
// Returns all of a member's check-ins as { "YYYY-MM-DD": {...} }
export async function getCheckins(uid) {
  const snap = await getDocs(collection(db, "users", uid, "checkins"));
  return Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
}

export async function saveCheckin(uid, date, data) {
  await setDoc(doc(db, "users", uid, "checkins", date), { ...data, date, updatedAt: serverTimestamp() }, { merge: true });
}

export async function hasPractised(uid, date) {
  return (await getDoc(doc(db, "users", uid, "practice", date))).exists();
}

export async function markPractised(uid, date, week) {
  await setDoc(doc(db, "users", uid, "practice", date), { date, week, at: serverTimestamp() });
}

export async function savePracticeCheck(uid, data) {
  await addDoc(collection(db, "users", uid, "practiceChecks"), { ...data, createdAt: serverTimestamp() });
}

// ---------- Content settings (admin) ----------
export async function getContentSettings() {
  const snap = await getDoc(doc(db, "settings", "content"));
  return snap.exists() ? snap.data() : {};
}

export async function saveContentSettings(data) {
  await setDoc(doc(db, "settings", "content"), data, { merge: true });
}

// ---------- Messages from the owner ----------
//   notices/{id}  { title, body, link, cohortId (null = everyone), createdAt }
export async function getNotices(max = 20) {
  const snap = await getDocs(query(collection(db, "notices"), orderBy("createdAt", "desc"), limit(max)));
  return list(snap);
}

export async function addNotice(data) {
  const ref = await addDoc(collection(db, "notices"), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

// ---------- Pods ----------
// Members choose to join a pod. Each pod holds up to POD_SIZE members.
//   pods/{podId}                  { cohortId, type ("mixed" | "women" | "men"), memberIds, createdAt,
//                                   whatsappGroupLink, groupLinkSetBy }
//   pods/{podId}/members/{uid}    { firstName, avatar, phone (only if shared, else null) }
// Only members of a pod can read its member cards, so a shared phone number
// is seen by that pod and nobody else (except the owner).
export const POD_SIZE = 4;

export async function getPods(cohortId) {
  const pods = list(await getDocs(query(collection(db, "pods"), where("cohortId", "==", cohortId))));
  return pods.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
}

export async function getMyPod(cohortId, uid) {
  return (await getPods(cohortId)).find((p) => p.memberIds?.includes(uid)) || null;
}

// Pod types a member can choose when joining. Edit the wording here.
export const POD_TYPES = [
  { id: "mixed", label: "Mixed pod", hint: "No preference: anyone in your cohort" },
  { id: "women", label: "Women's pod", hint: "For anyone who identifies as a woman" },
  { id: "men", label: "Men's pod", hint: "For anyone who identifies as a man" },
];
export const podTypeLabel = (id) => (POD_TYPES.find((t) => t.id === (id || "mixed")) || POD_TYPES[0]).label;

// Puts the member in the oldest pod of the chosen type with space, or starts a new one.
export async function joinPod(cohortId, uid, card, type = "mixed") {
  const open = (await getPods(cohortId)).find(
    (p) => (p.type || "mixed") === type && (p.memberIds?.length || 0) < POD_SIZE
  );
  const batch = writeBatch(db);
  const podRef = open ? doc(db, "pods", open.id) : doc(collection(db, "pods"));
  if (open) batch.update(podRef, { memberIds: arrayUnion(uid) });
  else batch.set(podRef, { cohortId, type, memberIds: [uid], createdAt: serverTimestamp() });
  batch.set(doc(db, "pods", podRef.id, "members", uid), { firstName: card.firstName, avatar: card.avatar || null, phone: null });
  await batch.commit();
  return podRef.id;
}

export async function leavePod(podId, uid) {
  const batch = writeBatch(db);
  batch.delete(doc(db, "pods", podId, "members", uid));
  batch.update(doc(db, "pods", podId), { memberIds: arrayRemove(uid) });
  await batch.commit();
}

export async function getPodMembers(podId) {
  return list(await getDocs(collection(db, "pods", podId, "members")));
}

// Saves (or removes, with null) the pod's WhatsApp group invite link.
// Any member of the pod can set it; see src/lib/phone.js for the link check.
export async function setPodGroupLink(podId, link, uid) {
  await updateDoc(doc(db, "pods", podId), { whatsappGroupLink: link || null, groupLinkSetBy: link ? uid : null });
}

// Shares (phone) or hides (null) the member's number with their pod.
export async function setPodPhone(podId, uid, phone) {
  await updateDoc(doc(db, "pods", podId, "members", uid), { phone: phone || null });
}

export async function getAllPods() {
  return list(await getDocs(collection(db, "pods")));
}

// Owner only: move a member from one pod to another (or out of a pod when toPodId is null).
export async function adminMovePodMember({ uid, fromPodId, toPodId }) {
  const batch = writeBatch(db);
  let card = { firstName: "", avatar: null, phone: null };
  if (fromPodId) {
    const old = await getDoc(doc(db, "pods", fromPodId, "members", uid));
    if (old.exists()) card = old.data();
    batch.delete(doc(db, "pods", fromPodId, "members", uid));
    batch.update(doc(db, "pods", fromPodId), { memberIds: arrayRemove(uid) });
  }
  if (toPodId) {
    batch.update(doc(db, "pods", toPodId), { memberIds: arrayUnion(uid) });
    batch.set(doc(db, "pods", toPodId, "members", uid), card);
  }
  await batch.commit();
}

// Owner only: start a new, empty pod in a cohort.
export async function adminCreatePod(cohortId, type = "mixed") {
  const ref = await addDoc(collection(db, "pods"), { cohortId, type, memberIds: [], createdAt: serverTimestamp() });
  return ref.id;
}

// ---------- Pod change requests ----------
//   podRequests/{id}  { uid, firstName, cohortId, podId, reason, status: "open" | "done", createdAt }
export async function addPodRequest(data) {
  await addDoc(collection(db, "podRequests"), { ...data, status: "open", createdAt: serverTimestamp() });
}

export async function getMyOpenPodRequest(uid) {
  const mine = list(await getDocs(query(collection(db, "podRequests"), where("uid", "==", uid))));
  return mine.find((r) => r.status === "open") || null;
}

export async function getPodRequests() {
  return list(await getDocs(collection(db, "podRequests"))).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function resolvePodRequest(id) {
  await updateDoc(doc(db, "podRequests", id), { status: "done", resolvedAt: serverTimestamp() });
}

// ---------- Admin only ----------
export const getAllUsers = async () => list(await getDocs(collection(db, "users")));
export const getAllPublicProfiles = async () => list(await getDocs(collection(db, "publicProfiles")));

export async function getAllMemberships() {
  const snap = await getDocs(collectionGroup(db, "memberships"));
  return snap.docs.map((d) => ({ uid: d.ref.parent.parent.id, cohortId: d.id, ...d.data() }));
}

export async function getAllCheckins() {
  const snap = await getDocs(collectionGroup(db, "checkins"));
  return snap.docs.map((d) => ({ uid: d.ref.parent.parent.id, ...d.data() }));
}

export async function getUserPracticeChecks(uid) {
  return list(await getDocs(collection(db, "users", uid, "practiceChecks")));
}
