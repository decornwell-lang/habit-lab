// All reading and writing of Firestore data lives here, so the rest of the
// app never talks to the database directly.
//
// Collections:
//   users/{uid}                       private profile (surname, email, role)
//   users/{uid}/memberships/{cohortId} which cohorts they joined, payment
//   users/{uid}/checkins/{date}       daily check-ins
//   users/{uid}/practice/{date}       that day's meditation, morning and reflection answers
//   users/{uid}/practiceChecks/{id}   badge check-ins ("Still in your practice?")
//   publicProfiles/{uid}              first name, avatar, streak, badges (shown to others only if opted in)
//   cohorts/{cohortId}                cohort details and member list
//   settings/content                  Zoom link, session date, weekly media links
//   notices/{id}                      messages from the owner (also sent as push notifications)
import {
  doc, getDoc, getDocs, setDoc, updateDoc, addDoc, collection, collectionGroup,
  query, where, orderBy, limit, writeBatch, arrayUnion, serverTimestamp, increment,
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

// ---------- Morning intention, evening review and cravings ----------
//   users/{uid}/reflections/{id}   the member's own words. Private: the owner can read
//                                  them only if the member agreed (reflectionConsent).
//                                  ids: "2026-10-15_intention", "2026-10-15_evening", or random for cravings
//   users/{uid}/activity/{date}    counts only, no words: { intention, evening, cravings }.
//                                  The owner can always read these.
export async function getReflection(uid, id) {
  return (await getDoc(doc(db, "users", uid, "reflections", id))).data() || null;
}

export async function getActivity(uid, date) {
  return (await getDoc(doc(db, "users", uid, "activity", date))).data() || {};
}

// Saves a reflection and marks it done in that day's activity (counts only).
export async function saveReflection(uid, id, data, activity) {
  const batch = writeBatch(db);
  batch.set(doc(db, "users", uid, "reflections", id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  batch.set(doc(db, "users", uid, "activity", data.date), { date: data.date, ...activity }, { merge: true });
  await batch.commit();
}

// Saves one craving note (several a day are fine) and adds 1 to that day's craving count.
// Returns the new note's id.
export async function saveCraving(uid, data) {
  const ref = doc(collection(db, "users", uid, "reflections"));
  const batch = writeBatch(db);
  batch.set(ref, { ...data, type: "craving", at: serverTimestamp() });
  batch.set(doc(db, "users", uid, "activity", data.date), { date: data.date, cravings: increment(1) }, { merge: true });
  await batch.commit();
  return ref.id;
}

// A member's answers for one calendar day: { morning, meditation, reflection, practised }.
export async function getDay(uid, date) {
  return (await getDoc(doc(db, "users", uid, "practice", date))).data() || {};
}

// Saves one answer (key is "morning", "meditation" or "reflection"); `extra` adds fields such as practised.
export async function saveDayAnswer(uid, date, key, value, extra = {}) {
  await setDoc(doc(db, "users", uid, "practice", date), { date, [key]: value, ...extra, at: serverTimestamp() }, { merge: true });
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

// Owner only: every member's daily counts (no words): { uid, date, intention, evening, cravings }.
export async function getAllActivity() {
  const snap = await getDocs(collectionGroup(db, "activity"));
  return snap.docs.map((d) => ({ uid: d.ref.parent.parent.id, ...d.data() }));
}

// Owner only, and only for members who ticked the reflection consent (enforced by the rules).
export async function getMemberReflections(uid) {
  return list(await getDocs(collection(db, "users", uid, "reflections")));
}

export async function getUserPracticeChecks(uid) {
  return list(await getDocs(collection(db, "users", uid, "practiceChecks")));
}
