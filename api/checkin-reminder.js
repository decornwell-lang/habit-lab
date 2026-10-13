// POST /api/checkin-reminder   (called every hour by a scheduled GitHub Action)
// Sends a push notification to members whose local time is now 18:xx, who are
// in an active cohort, have notifications on, and haven't checked in yet today.
// Protected by the CRON_SECRET environment variable.
import { getMessaging } from "firebase-admin/messaging";
import { handle, db, HttpError } from "./_lib/server.js";

const REMINDER_HOUR = 18; // keep in step with CHECKIN_OPENS_AT_HOUR in src/lib/dates.js
const DEFAULT_TIME_ZONE = "Europe/London"; // for members whose time zone isn't known yet

// Wording of the reminder. {day} becomes the member's cohort day.
const TITLE = "Time for your check-in 🌿";
const BODY = "How was today? Your Day {day} check-in is open.";

// Local hour and date ("YYYY-MM-DD") for a time zone.
function localNow(timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date()).map((p) => [p.type, p.value])
  );
  return { hour: Number(parts.hour), date: `${parts.year}-${parts.month}-${parts.day}` };
}

const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

export default handle(async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) throw new HttpError(401, "Not allowed.");

  const store = db();
  const cohorts = Object.fromEntries((await store.collection("cohorts").get()).docs.map((d) => [d.id, d.data()]));
  const users = (await store.collection("users").get()).docs.filter((d) => d.data().fcmTokens?.length);

  let reminded = 0;
  let devices = 0;
  for (const userDoc of users) {
    const user = userDoc.data();
    let local;
    try {
      local = localNow(user.timeZone || DEFAULT_TIME_ZONE);
    } catch {
      local = localNow(DEFAULT_TIME_ZONE);
    }
    if (local.hour !== REMINDER_HOUR || user.lastReminderDate === local.date) continue;

    // Find an active cohort for today.
    const memberships = (await userDoc.ref.collection("memberships").get()).docs;
    let cohortDay = null;
    for (const m of memberships) {
      const cohort = cohorts[m.id];
      if (!cohort || cohort.status === "finished") continue;
      const start = m.data().personalStartDate || cohort.startDate;
      const day = daysBetween(start, local.date) + 1;
      if (day >= 1 && day <= cohort.durationDays) cohortDay = day;
    }
    if (!cohortDay) continue;

    // Already checked in today? Then no reminder.
    if ((await userDoc.ref.collection("checkins").doc(local.date).get()).exists) continue;

    const response = await getMessaging().sendEachForMulticast({
      tokens: user.fcmTokens,
      data: { kind: "reminder", title: TITLE, body: BODY.replace("{day}", cohortDay), link: "/dashboard?tab=practice" },
      webpush: { headers: { Urgency: "high" } },
    });
    devices += response.successCount;
    reminded++;
    await userDoc.ref.update({ lastReminderDate: local.date });
  }

  res.json({ reminded, devices });
});
