// Dashboard: the members' home page, with four tabs (see DashboardTabs.jsx):
//   Home · Breathe · Practices (meditation, weekly assignment, live session) · Upcoming
// The open tab is part of the address (e.g. /dashboard?tab=practices), so links
// and notifications can open a specific tab.
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  getCohorts, getMemberships, getCheckins, getPublicProfile, savePublicProfile,
  getContentSettings, getDay, getReflectionsForDay, saveCheckin, updateUserProfile, clearOldStreak,
} from "../lib/data.js";
import { apiPost } from "../lib/api.js";
import { todayKey, checkinDayKey, timeZoneName } from "../lib/dates.js";
import { memberCohorts, checkinsFor, habitInfo, habitStreakLabel } from "../lib/cohorts.js";
import { weekContent } from "../lib/content.js";
import { aphorismFor } from "../lib/aphorisms.js";
import { profileStreaks, cohortStreakEntry } from "../lib/streaks.js";

import CohortCountdown from "../components/dashboard/CohortCountdown.jsx";
import WhatsAppGroupCard from "../components/dashboard/WhatsAppGroupCard.jsx";
import TherapyTile from "../components/dashboard/TherapyTile.jsx";
import WeeklyAssignment from "../components/dashboard/WeeklyAssignment.jsx";
import LiveSession from "../components/dashboard/LiveSession.jsx";
import JoinCohort from "../components/dashboard/JoinCohort.jsx";
import Leaderboard from "../components/dashboard/Leaderboard.jsx";
import Celebration from "../components/dashboard/Celebration.jsx";
import StartAgain from "../components/dashboard/StartAgain.jsx";
import NotificationSettings from "../components/NotificationSettings.jsx";
import InstallApp from "../components/InstallApp.jsx";
import DashboardTabs, { TABS, DEFAULT_TAB } from "../components/dashboard/DashboardTabs.jsx";
import StreakCard from "../components/dashboard/StreakCard.jsx";
import CohortSwitcher from "../components/dashboard/CohortSwitcher.jsx";
import BadgesCard from "../components/dashboard/BadgesCard.jsx";
import Folds from "../components/dashboard/Folds.jsx";
import BreatheTab from "../components/dashboard/BreatheTab.jsx";
import LeaderboardInvite from "../components/dashboard/LeaderboardInvite.jsx";
import MorningCheckin from "../components/dashboard/MorningCheckin.jsx";
import { promptTime } from "../content/dailyPrompts.js";
import AppBadge from "../components/AppBadge.jsx";
import { publicIdentity } from "../lib/identity.js";
import { useDark } from "../lib/theme.js";
import Sheet from "../components/dashboard/Sheet.jsx";
import IntentionScreen from "../components/dashboard/IntentionScreen.jsx";
import EveningReview from "../components/dashboard/EveningReview.jsx";
import TodaysPractice from "../components/dashboard/TodaysPractice.jsx";
import Explainer from "../components/Explainer.jsx";
import { LockIcon, PencilIcon } from "../components/TileIcons.jsx";
import { isInstalled } from "../lib/install.js";


// The cohort last chosen on Home (for members in more than one), remembered on this device.
const COHORT_KEY = "habitlab:cohort";
function readCohortChoice() {
  try {
    return localStorage.getItem(COHORT_KEY);
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const installed = isInstalled(); // opened from the Home Screen
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [celebrate, setCelebrate] = useState(null); // { badgeId, row }: a new badge to celebrate
  const [cohortChoice, setCohortChoice] = useState(readCohortChoice); // which cohort Home shows
  const [startAgain, setStartAgain] = useState(null); // the cohort row, after "Not right now"
  const [sheet, setSheet] = useState(null); // full-screen panel: "evening"
  const [params, setParams] = useSearchParams();
  const [tabTaps, setTabTaps] = useState(0); // tapping a tab again starts it afresh (e.g. Breathe → choose a practice)
  const dark = useDark(profile); // light, dark or automatic (My account)
  const today = todayKey(); // calendar day: morning check-in, intention, evening review, cohort day
  const checkinDay = checkinDayKey(); // the check-in day (turns over at 21:00, see dates.js)

  function chooseCohort(id) {
    setCohortChoice(id);
    try {
      localStorage.setItem(COHORT_KEY, id);
    } catch {
      // Not remembered; fine.
    }
  }
  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : DEFAULT_TAB;
  function setTab(id) {
    setTabTaps((n) => n + 1);
    setParams(id === DEFAULT_TAB ? {} : { tab: id });
    window.scrollTo(0, 0);
  }

  const load = useCallback(async () => {
    try {
      const date = todayKey();
      const [cohorts, memberships, checkins, publicProfile, settings, day, reflections] = await Promise.all([
        getCohorts(),
        getMemberships(user.uid),
        getCheckins(user.uid),
        getPublicProfile(user.uid),
        getContentSettings(),
        getDay(user.uid, date),
        getReflectionsForDay(user.uid, date).catch(() => ({})),
      ]);
      setData({ cohorts, memberships, checkins, publicProfile, settings, day, reflections });
    } catch (err) {
      console.error(err);
      setError("We couldn't load your dashboard. Please refresh the page.");
    }
  }, [user.uid]);

  useEffect(() => {
    load();
  }, [load]);

  // Fresh data whenever the member comes back to the app (it often stays open in the
  // background for days): changes made in Admin, such as a cohort's WhatsApp link, show
  // straight away. Also past midnight or 21:00, so the new day / check-in appears.
  useEffect(() => {
    const dayStamp = () => `${todayKey()}|${checkinDayKey()}`;
    let loadedFor = dayStamp();
    let loadedAt = Date.now();
    const refreshIfNewDay = () => {
      if (document.visibilityState !== "visible") return;
      if (dayStamp() !== loadedFor || Date.now() - loadedAt > 60 * 1000) {
        loadedFor = dayStamp();
        loadedAt = Date.now();
        load();
      }
    };
    document.addEventListener("visibilitychange", refreshIfNewDay);
    const timer = setInterval(refreshIfNewDay, 5 * 60 * 1000);
    return () => {
      document.removeEventListener("visibilitychange", refreshIfNewDay);
      clearInterval(timer);
    };
  }, [load]);

  // Keeps the leaderboard right: if a cohort's stored streak differs from the check-ins
  // (e.g. a new day, or the older single streak still at the top of the profile), save it.
  useEffect(() => {
    if (!data) return;
    const today = todayKey();
    const checkinDay = checkinDayKey();
    const stored = data.publicProfile?.cohorts || {};
    const changed = {};
    for (const r of memberCohorts(data.cohorts, data.memberships, today)) {
      if (r.progress.state === "upcoming") continue;
      const entry = cohortStreakEntry(r.cohort, data.cohorts, data.checkins, data.publicProfile, today, checkinDay);
      const s = stored[r.cohort.id];
      if (!s || s.streak !== entry.streak || s.best !== entry.best || s.lastYesDate !== entry.lastYesDate || (s.badges || []).length !== entry.badges.length) {
        changed[r.cohort.id] = entry;
      }
    }
    const old = data.publicProfile && "streak" in data.publicProfile;
    if (!Object.keys(changed).length && !old) return;
    (async () => {
      if (Object.keys(changed).length) await savePublicProfile(user.uid, { cohorts: changed });
      if (old) await clearOldStreak(user.uid);
      setData((d) => {
        const { streak, lastYesDate, badges, habitType, ...rest } = d.publicProfile || {}; // eslint-disable-line no-unused-vars
        return { ...d, publicProfile: { ...rest, cohorts: { ...rest.cohorts, ...changed } } };
      });
    })().catch(console.error);
  }, [data, user.uid]);

  // Re-check the time every minute, so the Home tiles unlock on time while the app is open.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // A notification opens its cohort's tile, e.g. /dashboard?open=evening&cohort=abc.
  useEffect(() => {
    const target = params.get("open");
    if (params.get("cohort")) chooseCohort(params.get("cohort"));
    if (target === "evening") setSheet(target); // the morning check-in and intention open in their tiles
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Remember the member's time zone (the daily notifications go out at local times).
  useEffect(() => {
    const zone = timeZoneName();
    if (zone && profile && profile.timeZone !== zone) updateUserProfile(user.uid, { timeZone: zone }).catch(() => {});
  }, [profile?.timeZone, user.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Coming back from Stripe Checkout
  useEffect(() => {
    const status = params.get("checkout");
    if (!status) return;
    const sessionId = params.get("session_id");
    setParams({}, { replace: true });
    if (status === "cancelled") return setNotice("Payment cancelled. You haven't been charged.");
    if (status === "success" && sessionId) {
      apiPost("/api/confirm-checkout", { sessionId })
        .then(() => {
          setNotice("Payment received. Welcome to your cohort!");
          load();
        })
        .catch((err) => setError(err.message));
    }
  }, [params, setParams, load]);

  if (error && !data) return <main className="page"><p className="form-error">{error}</p></main>;
  if (!data) return <main className="page"><p className="muted">Loading your dashboard…</p></main>;

  // The member's cohorts. Home shows one at a time: its morning check-in, intention and
  // evening review (each shared in that cohort's WhatsApp group), badges, streak, journey
  // and leaderboard. With more than one, buttons at the top switch between them.
  const rows = memberCohorts(data.cohorts, data.memberships, today);
  const shown = rows.filter((r) => r.progress.state !== "finished");
  const choices = shown.length ? shown : rows.slice(0, 1); // or the latest finished cohort
  const current = choices.find((r) => r.cohort.id === cohortChoice) || choices[0] || null;
  const activeRows = rows.filter((r) => r.progress.state === "active");

  const week = current?.progress.state === "active" ? current.progress.week : Number(data.settings.currentWeek) || 1;
  const habitType = current?.cohort.habitType || "smoking";
  const content = weekContent(habitType, week, data.settings);
  const firstName = profile?.firstName || user.displayName || "friend";

  // The evening review is the day's check-in for its cohort: e.g. "Did you smoke today?
  // No" keeps the smoking streak. No answer saves nothing.
  async function saveEveningCheckin(row, evening) {
    if (!evening.answer) return;
    const habit = habitInfo(row.cohort.habitType);
    await saveCheckins([{
      row,
      date: today,
      checkin: { maintained: evening.answer === habit.keptWhen, craving: habit.cravings ? evening.intensity : null }, // craving: 0 to 5
    }]);
  }

  // A correction from the journey: mark a past day kept or not (today is only set by the evening review).
  async function correctCheckin(date, day, maintained) {
    await saveCheckins([{ row: current, date, checkin: { day, week: Math.ceil(day / 7), maintained, corrected: true } }]);
  }

  // Saves check-ins ([{ row, date, checkin }]), then updates each cohort's streak and
  // badges on the public profile (the leaderboard).
  async function saveCheckins(saves) {
    let checkins = data.checkins;
    for (const { row, date, checkin } of saves) {
      const existing = checkinsFor(checkins, row.cohort)[date];
      const full = { cohortId: row.cohort.id, day: row.progress.day, week: row.progress.week, ...checkin, date };
      const id = await saveCheckin(user.uid, full, existing?.id);
      checkins = [...checkins.filter((c) => c.id !== id), { ...existing, ...full, id }];
    }
    if (!saves.length) return;

    let celebrateNext = null;
    const streaks = {};
    for (const { row, checkin } of saves) {
      // Badges already earned for this habit, in any cohort (only new ones are celebrated).
      const before = profileStreaks(data.publicProfile).filter((s) => s.habitType === row.cohort.habitType).flatMap((s) => s.badges || []);
      const entry = cohortStreakEntry(row.cohort, data.cohorts, checkins, data.publicProfile, today, checkinDay);
      streaks[row.cohort.id] = entry;
      const newBadges = entry.badges.filter((b) => !before.includes(b));
      if (checkin.maintained && newBadges.length) celebrateNext = { badgeId: newBadges.at(-1), row };
    }

    const publicProfile = {
      ...publicIdentity(profile), // the name and picture the member chose
      leaderboardOptIn: Boolean(profile?.leaderboardOptIn),
      showHabit: profile?.showHabit !== false, // shown unless the member turned it off
      cohorts: streaks, // merged with the other cohorts already stored
    };
    await savePublicProfile(user.uid, publicProfile);
    setData((d) => ({
      ...d,
      checkins,
      publicProfile: { ...d.publicProfile, ...publicProfile, cohorts: { ...d.publicProfile?.cohorts, ...streaks } },
    }));
    if (celebrateNext) setCelebrate(celebrateNext);
  }

  // The chosen cohort's habit streak (it carries across cohorts of the same habit) and personal best.
  const { streak, best } = current ? cohortStreakEntry(current.cohort, data.cohorts, data.checkins, data.publicProfile, today, checkinDay) : { streak: 0, best: 0 };

  // Explainer videos (Admin → Content): a camera icon at the top right of Home, Practices and Upcoming.
  const explainers = data.settings.explainers || {};
  const explainerRow = (id, label) => <div className="explainer-row"><Explainer url={explainers[id]} label={label} /></div>;

  // Saves a reflection or morning answer into Home's state, so its tile updates straight away.
  const onSavedDay = (key, answer) => setData((d) => ({ ...d, day: { ...d.day, [key]: answer } }));
  const onSavedReflection = (id, entry) => setData((d) => ({ ...d, reflections: { ...d.reflections, [id]: entry } }));

  // The day's three tiles for one cohort. Each is locked (🔒) until its hour, when its
  // notification goes out, then ready to fill in (✏️) until done (✓). They lock again at midnight.
  const tile = ({ id, icon, tone, title, subtitle, isDone, doneText }) => {
    const { hour, minute } = promptTime(id);
    const locked = now.getHours() * 60 + now.getMinutes() < hour * 60 + minute;
    const opens = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    if (locked) return { id, icon: <LockIcon />, tone: "locked", title, subtitle, status: `Opens ${opens}`, locked: true };
    if (isDone) return { id, icon, tone, title, subtitle, status: doneText, done: true };
    return { id, icon: <PencilIcon />, tone: "ready", title, subtitle, status: "Ready", highlight: true };
  };
  const dayTiles = (row) => {
    const id = row.cohort.id;
    const morning = data.day[`morning_${id}`];
    const intention = data.reflections[`${today}_intention_${id}`];
    const evening = data.reflections[`${today}_evening_${id}`];
    const group = habitInfo(row.cohort.habitType).tab;
    return [
      {
        ...tile({ id: "morning", icon: "☀️", tone: "gold", title: "Morning", subtitle: "How are you feeling?", isDone: Boolean(morning), doneText: "✓ Shared" }),
        content: <><MorningCheckin uid={user.uid} today={today} cohortId={id} dayLabel={`Day ${row.progress.day} `} group={group}
          existing={morning} onSaved={onSavedDay} /></>,
      },
      {
        ...tile({ id: "intention", icon: "🎯", tone: "gold", title: "Intention", subtitle: "One minute with a question", isDone: Boolean(intention), doneText: "✓ Done" }),
        // Opens inside its tile, like the morning check-in, with its explainer video on the right.
        content: (
          <>
            {explainerRow("intention", "About the intention")}
            <IntentionScreen uid={user.uid} date={today} cohortId={id} group={group} existing={intention} firstName={firstName}
              onSaved={(entry) => onSavedReflection(`${today}_intention_${id}`, entry)} />
          </>
        ),
      },
      {
        ...tile({ id: "evening", icon: "🌙", title: "Evening review", subtitle: "A minute to reflect on today",
          isDone: Boolean(evening), doneText: evening?.skipped ? "Skipped" : "✓ Done" }),
        onOpen: () => setSheet("evening"),
      },
    ];
  };
  // Tiles waiting (ready, not done) in each active cohort: the switcher and the app icon show these.
  const waiting = Object.fromEntries(activeRows.map((r) => [r.cohort.id, dayTiles(r).filter((t) => t.highlight).length]));

  // Home tiles for the chosen cohort, top to bottom. Notifications open a tile directly,
  // e.g. /dashboard?open=morning&cohort=abc.
  const homeItems = [
    ...(current?.progress.state === "active" ? dayTiles(current) : []),
  ].filter(Boolean);
  const aphorism = aphorismFor(today); // approved or owner-written lines only (src/lib/aphorisms.js)

  return (
    // --cohort: the chosen cohort's colour, on Home only (and its full-screen panels), so
    // Home feels different in each cohort. Breathe, Practices and Upcoming keep the main colours.
    <main className={`page dashboard ${dark || tab === "breathe" ? "dark" : ""}`}
      style={current && tab === "home" ? { "--cohort": habitInfo(current.cohort.habitType).accent } : undefined}>
      {tab === DEFAULT_TAB && aphorism && <p className="aphorism">“{aphorism.text}”</p>}

      {/* The red number on the app icon: tiles ready but not done, in all cohorts */}
      <AppBadge count={Object.values(waiting).reduce((a, b) => a + b, 0)} />
      {notice && <p className="notice notice-good" role="status">{notice}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {/* Shown on any tab, straight after a check-in */}
      {celebrate && (
        <Celebration
          uid={user.uid}
          badgeId={celebrate.badgeId}
          label={habitStreakLabel(celebrate.row.cohort.habitType)}
          onDone={() => setCelebrate(null)}
          onNotRightNow={() => {
            setCelebrate(null);
            setStartAgain(celebrate.row);
          }}
        />
      )}

      {startAgain && (
        <StartAgain uid={user.uid} current={startAgain} onDone={async (restarted) => {
          setStartAgain(null);
          if (restarted) await load();
        }} />
      )}

      {/* Home: the cohort buttons (if more than one), badges, the day's tiles (locked until
          their time), my streak (with journey), then the leaderboard tile */}
      {tab === "home" && (
        <>
          {/* The Home camera icon sits on the left of the cohort buttons (and scrolls with them). */}
          {choices.length > 1 ? (
            <CohortSwitcher rows={choices} selected={current.cohort.id} waiting={waiting} onSelect={chooseCohort}
              leading={<Explainer url={explainers.home} label="About Home" />} />
          ) : (
            <div className="explainer-row left"><Explainer url={explainers.home} label="About Home" /></div>
          )}
          {/* On the Home Screen app, notifications are asked for first thing, at the top
              (browsers only allow turning them on with a tap, never automatically). */}
          {installed && <NotificationSettings uid={user.uid} compact />}
          {current?.progress.state === "upcoming" && <CohortCountdown current={current} />}
          {current && <BadgesCard streak={streak} current={current} />}
          {/* key: switching cohort starts its tiles afresh (no answers carried over) */}
          <Folds key={current?.cohort.id} items={homeItems} initialOpen={params.get("open")} />
          {current && <WhatsAppGroupCard uid={user.uid} current={current} />}
          {current ? (
            <>
              <StreakCard streak={streak} best={best} current={current} checkins={checkinsFor(data.checkins, current.cohort)} onCorrect={correctCheckin} />
              <Folds items={[{
                id: "leaderboard", icon: "🏆", tone: "gold", title: "Leaderboard", subtitle: "Your cohort's streaks",
                content: <Leaderboard uid={user.uid} cohort={current.cohort} optedIn={Boolean(profile?.leaderboardOptIn)} today={checkinDay}
                  opensOn={current.progress.state === "upcoming" ? current.progress.start : null} />,
              }]} />
              <LeaderboardInvite uid={user.uid} profile={profile} />
            </>
          ) : (
            <section className="card center">
              <h2>Join a cohort</h2>
              <button className="btn btn-primary" onClick={() => setTab("upcoming")}>See cohorts</button>
            </section>
          )}
          {!installed && <NotificationSettings uid={user.uid} compact />}
          <InstallApp />
        </>
      )}

      {/* Practices: this week's meditation, weekly assignment and live session */}
      {tab === "practices" && (
        <>
          {explainerRow("practices", "About Practices")}
          <TodaysPractice content={content} />
          <WeeklyAssignment content={content} settings={data.settings} />
          <LiveSession settings={data.settings} />
        </>
      )}

      {/* Breathe: coherent breathing or the 3-Step Breathing Space, for a craving */}
      {tab === "breathe" && <BreatheTab key={tabTaps} settings={data.settings} explainers={explainers} />}

      {/* Upcoming: cohorts that haven't started yet */}
      {tab === "upcoming" && (
        <><div className="explainer-row upcoming-top"><TherapyTile /><Explainer url={explainers.upcoming} label="About joining a cohort" /></div><JoinCohort uid={user.uid} cohorts={data.cohorts} memberships={data.memberships} onJoined={load} /></>
      )}

      {/* The chosen cohort's intention and evening review */}
      {sheet === "evening" && current && (
        <Sheet label="Evening review" onClose={() => setSheet(null)}>
          <EveningReview uid={user.uid} date={today} existing={data.reflections[`${today}_evening_${current.cohort.id}`]}
            habit={{ ...habitInfo(current.cohort.habitType), cohortId: current.cohort.id }} firstName={firstName}
            onSaved={async (entry, skipped) => {
              onSavedReflection(`${today}_evening_${current.cohort.id}`, entry);
              if (skipped) return setSheet(null);
              await saveEveningCheckin(current, entry);
            }} />
        </Sheet>
      )}

      <DashboardTabs active={tab} onChange={setTab} />
    </main>
  );
}
