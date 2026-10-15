// POST /api/daily-prompts   (called every hour by a scheduled GitHub Action)
// Sends the daily prompts (07:00 morning, 09:00 intention, 21:00 evening review) to members
// in an active cohort with notifications on, at each prompt's hour in the member's
// own time zone. Times and wording: src/content/dailyPrompts.js.
// Protected by the CRON_SECRET environment variable.
import { getMessaging } from "firebase-admin/messaging";
import { handle, db, HttpError } from "./_lib/server.js";
import { DAILY_PROMPTS } from "../src/content/dailyPrompts.js";

const DEFAULT_TIME_ZONE = "Europe/Madrid"; // only until the member first opens the app (then their phone's time zone is saved)

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

  let sent = 0;
  let devices = 0;
  for (const userDoc of users) {
    const user = userDoc.data();
    let local;
    try {
      local = localNow(user.timeZone || DEFAULT_TIME_ZONE);
    } catch {
      local = localNow(DEFAULT_TIME_ZONE);
    }
    const prompt = DAILY_PROMPTS.find((p) => p.hour === local.hour);
    // promptsSent remembers the last date each prompt went out, so it's sent once a day.
    if (!prompt || user.promptsSent?.[prompt.id] === local.date) continue;

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

    // Already did today's evening review (final check-in)? Then no reminder.
    if (prompt.id === "evening" && (await userDoc.ref.collection("checkins").doc(local.date).get()).exists) continue;

    const response = await getMessaging().sendEachForMulticast({
      tokens: user.fcmTokens,
      data: {
        kind: "prompt",
        title: prompt.title,
        body: prompt.body.replace("{day}", cohortDay),
        link: `/dashboard?open=${prompt.id}`,
      },
      webpush: { headers: { Urgency: "high" } },
    });
    devices += response.successCount;
    sent++;
    await userDoc.ref.update({ [`promptsSent.${prompt.id}`]: local.date });
  }

  res.json({ sent, devices });
});
