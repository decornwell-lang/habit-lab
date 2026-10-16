// POST /api/daily-prompts   (called every hour by a scheduled GitHub Action)
// Sends the daily prompts (06:00 morning, 08:00 intention, 21:00 evening review) to members
// with notifications on, at each prompt's hour in the member's own time zone. One
// notification per active cohort: a member in a smoking and an alcohol cohort gets two at
// 06:00, each opening that cohort's tile. Times and wording: src/content/dailyPrompts.js.
// Protected by the CRON_SECRET environment variable.
import { getMessaging } from "firebase-admin/messaging";
import { handle, db, HttpError } from "./_lib/server.js";
import { DAILY_PROMPTS } from "../src/content/dailyPrompts.js";
import { habitInfo } from "../src/lib/cohorts.js";

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

// Has the member already done this prompt today for this cohort? Morning:
// users/{uid}/practice/{date}.morning_{cohortId}; intention and evening review:
// users/{uid}/reflections/{date}_{id}_{cohortId}.
async function isDone(userRef, id, date, cohortId) {
  if (id === "morning") return Boolean((await userRef.collection("practice").doc(date).get()).data()?.[`morning_${cohortId}`]);
  return (await userRef.collection("reflections").doc(`${date}_${id}_${cohortId}`).get()).exists;
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
    if (!prompt) continue;

    // The member's cohorts that are running today.
    const active = [];
    for (const m of (await userDoc.ref.collection("memberships").get()).docs) {
      const cohort = cohorts[m.id];
      if (!cohort || cohort.status === "finished") continue;
      const start = m.data().personalStartDate || cohort.startDate;
      const day = daysBetween(start, local.date) + 1;
      if (day >= 1 && day <= cohort.durationDays) active.push({ id: m.id, cohort, day });
    }

    // promptsSent remembers the last date each prompt went out for each cohort
    // ("morning_<cohortId>"), so it's sent once a day.
    const toSend = [];
    for (const c of active) {
      if (user.promptsSent?.[`${prompt.id}_${c.id}`] === local.date) continue;
      // Already did (or skipped) this cohort's evening review? Then no reminder.
      if (prompt.id === "evening" && (await isDone(userDoc.ref, "evening", local.date, c.id))) continue;
      toSend.push(c);
    }
    if (!toSend.length) continue;

    // The red number on the app icon: today's prompts so far, in all active cohorts, not yet done.
    const due = DAILY_PROMPTS.filter((p) => p.hour <= local.hour);
    const checks = active.flatMap((c) => due.map((p) => isDone(userDoc.ref, p.id, local.date, c.id)));
    const waiting = (await Promise.all(checks)).filter((d) => !d).length;

    for (const c of toSend) {
      const response = await getMessaging().sendEachForMulticast({
        tokens: user.fcmTokens,
        data: {
          kind: "prompt",
          title: `${prompt.title} · ${habitInfo(c.cohort.habitType).tab}`, // e.g. "Good morning ☀️ · Smoke-free"
          body: prompt.body.replace("{day}", c.day),
          link: `/dashboard?open=${prompt.id}&cohort=${c.id}`,
          tag: `${prompt.id}-${c.id}`, // one notification per cohort, not replacing each other
          badge: String(waiting),
        },
        webpush: { headers: { Urgency: "high" } },
      });
      devices += response.successCount;
      sent++;
      await userDoc.ref.update({ [`promptsSent.${prompt.id}_${c.id}`]: local.date });
    }
  }

  res.json({ sent, devices });
});
