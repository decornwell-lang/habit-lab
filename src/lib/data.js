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
import {
  doc, getDoc, getDocs, setDoc, updateDoc, addDoc, collection, collectionGroup,
  query, where, orderBy, limit, writeBatch, arrayUnion, serverTimestamp,
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
