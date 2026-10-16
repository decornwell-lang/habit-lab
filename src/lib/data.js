// All reading and writing of Firestore data lives here, so the rest of the
// app never talks to the database directly.
//
// Collections:
//   users/{uid}                       private profile (name, surname, email, phone, role, picture and name choice)
//   users/{uid}/memberships/{cohortId} which cohorts they joined, payment, alcohol screening result
//   users/{uid}/checkins/{date_cohortId}  daily check-ins (the evening review), one per cohort
//   users/{uid}/practice/{date}       that day's morning check-ins ("morning_<cohortId>")
//   users/{uid}/reflections/{id}      intentions and evening reviews (see below)
//   users/{uid}/activity/{date}       counts only, for the owner (see below)
//   users/{uid}/practiceChecks/{id}   badge check-ins ("Still in your practice?")
//   publicProfiles/{uid}              the name and picture they chose, and per cohort: streak, badges (shown to others only if opted in)
//   cohorts/{cohortId}                cohort details and member list
//   publicCohorts/{cohortId}          name, habit, dates and price only: readable by visitors (home page)
//   members/{uid}, cohortEntitlements/{id}, payments/{id}  access and payments, written only by the server (src/lib/access.js)
//   settings/content                  Zoom link, session date, weekly media links
//   notices/{id}                      messages from the owner (also sent as push notifications)
import {
  doc, getDoc, getDocs, setDoc, updateDoc, addDoc, collection, collectionGroup,
  query, where, orderBy, limit, writeBatch, arrayUnion, serverTimestamp, deleteField,
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

// `name` is the name the member chose to show (see src/lib/identity.js); the older
// `firstName` field is removed when it's saved, so a nickname never shows their real name.
export async function savePublicProfile(uid, data) {
  const extra = "name" in data ? { firstName: deleteField() } : {};
  await setDoc(doc(db, "publicProfiles", uid), { ...data, ...extra, updatedAt: serverTimestamp() }, { merge: true });
}

// Removes the older single streak (streak, badges… at the top level) once it's in profile.cohorts.
export async function clearOldStreak(uid) {
  await updateDoc(doc(db, "publicProfiles", uid), { streak: deleteField(), lastYesDate: deleteField(), badges: deleteField(), habitType: deleteField() });
}

export async function getLeaderboard() {
  return list(await getDocs(query(collection(db, "publicProfiles"), where("leaderboardOptIn", "==", true))));
}

// ---------- Access (written by the server after Stripe payments; see src/lib/access.js) ----------
const toDate = (v) => (v?.toDate ? v.toDate() : v ?? null);

// The member's access record, with dates as Dates: { firstJoinedAt, accessEndsAt, extended, lapsed }, or null.
export async function getMember(uid) {
  const data = (await getDoc(doc(db, "members", uid))).data();
  return data ? { ...data, firstJoinedAt: toDate(data.firstJoinedAt), accessEndsAt: toDate(data.accessEndsAt) } : null;
}

// The member's cohort entitlements, with dates as Dates.
export async function getEntitlements(uid) {
  const snap = await getDocs(query(collection(db, "cohortEntitlements"), where("uid", "==", uid)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), startsAt: toDate(d.data().startsAt), endsAt: toDate(d.data().endsAt) }));
}

// ---------- Cohorts ----------
export async function getCohorts() {
  const cohorts = list(await getDocs(collection(db, "cohorts")));
  return cohorts.sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
}

// Saving a cohort also updates its public copy (publicCohorts), which visitors who aren't
// signed in can read on the home page: only these fields, never members or the group link.
const PUBLIC_COHORT_FIELDS = ["name", "habitType", "startDate", "durationDays", "price", "status", "archived"];
const publicFields = (data) => Object.fromEntries(PUBLIC_COHORT_FIELDS.filter((k) => k in data).map((k) => [k, data[k]]));

export async function saveCohort(id, data) {
  if (id) {
    await updateDoc(doc(db, "cohorts", id), data);
    await setDoc(doc(db, "publicCohorts", id), publicFields(data), { merge: true });
    return { id };
  }
  const ref = await addDoc(collection(db, "cohorts"), { ...data, memberIds: [], createdAt: serverTimestamp() });
  await setDoc(doc(db, "publicCohorts", ref.id), publicFields(data));
  return ref;
}

// Owner only: rewrites the public copies from the cohorts (Admin → Cohorts does this on opening).
export async function syncPublicCohorts(cohorts) {
  const batch = writeBatch(db);
  cohorts.forEach((c) => batch.set(doc(db, "publicCohorts", c.id), publicFields(c)));
  await batch.commit();
}

// Cohorts open to join, readable without signing in (the home page).
export async function getPublicCohorts() {
  const cohorts = list(await getDocs(collection(db, "publicCohorts")));
  return cohorts.sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
}

export async function getPublicCohort(id) {
  const snap = await getDoc(doc(db, "publicCohorts", id));
  return snap.exists() ? { id, ...snap.data() } : null;
}

export async function getMemberships(uid) {
  const snap = await getDocs(collection(db, "users", uid, "memberships"));
  return snap.docs.map((d) => ({ cohortId: d.id, ...d.data() }));
}

// Free cohorts can be joined straight from the app. Paid cohorts go through
// Stripe (see /api/create-checkout.js), which adds the member after payment.
// extra: more fields for the membership, e.g. { screening: { advised: false } } (alcohol-free cohorts).
export async function joinCohortDirectly(uid, cohortId, method = "free", extra = {}) {
  const batch = writeBatch(db);
  batch.set(doc(db, "users", uid, "memberships", cohortId), { paid: false, method, joinedAt: serverTimestamp(), ...extra });
  batch.update(doc(db, "cohorts", cohortId), { memberIds: arrayUnion(uid) });
  await batch.commit();
}

export async function updateMembership(uid, cohortId, data) {
  await updateDoc(doc(db, "users", uid, "memberships", cohortId), data);
}

// ---------- Check-ins and practice ----------
// All of a member's check-ins, one per cohort per day: [{ id, date, cohortId, maintained, ... }].
// Ids are "2026-10-12_<cohortId>" (early ones are just the date). See checkinsFor() in cohorts.js.
export async function getCheckins(uid) {
  const snap = await getDocs(collection(db, "users", uid, "checkins"));
  return snap.docs.map((d) => ({ id: d.id, date: d.id.slice(0, 10), ...d.data() }));
}

// Saves a check-in; `id` is the existing check-in's id when correcting one.
export async function saveCheckin(uid, data, id = `${data.date}_${data.cohortId}`) {
  await setDoc(doc(db, "users", uid, "checkins", id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  return id;
}

// ---------- Morning intention and evening review (one of each per cohort per day) ----------
//   users/{uid}/reflections/{id}   the member's own words. Private: the owner can read
//                                  them only if the member agreed (reflectionConsent).
//                                  ids: "2026-10-15_intention_<cohortId>", "2026-10-15_evening_<cohortId>"
//   users/{uid}/activity/{date}    counts only, no words, per cohort:
//                                  { intention: { <cohortId>: true }, evening: { <cohortId>: "done" | "skipped" } }.
//                                  The owner can always read these.
// The day's reflections, keyed by id.
export async function getReflectionsForDay(uid, date) {
  const snap = await getDocs(query(collection(db, "users", uid, "reflections"), where("date", "==", date)));
  return Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
}

// Saves a reflection and marks it done in that day's activity (counts only).
export async function saveReflection(uid, id, data, activity) {
  const batch = writeBatch(db);
  batch.set(doc(db, "users", uid, "reflections", id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  batch.set(doc(db, "users", uid, "activity", data.date), { date: data.date, ...activity }, { merge: true });
  await batch.commit();
}

// A member's morning check-ins for one calendar day: { "morning_<cohortId>": {...} }.
export async function getDay(uid, date) {
  return (await getDoc(doc(db, "users", uid, "practice", date))).data() || {};
}

// Saves one of the day's answers (the morning check-in: key "morning_<cohortId>").
export async function saveDayAnswer(uid, date, key, value) {
  await setDoc(doc(db, "users", uid, "practice", date), { date, [key]: value, at: serverTimestamp() }, { merge: true });
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

// Owner only: every member's daily counts (no words): { uid, date, intention, evening }.
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
