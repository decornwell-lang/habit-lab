// Dashboard: the members' home page, with four tabs (see DashboardTabs.jsx):
//   Home · Practices (meditation, weekly assignment, live session) · Breathe · Upcoming
// The open tab is part of the address (e.g. /dashboard?tab=practices), so links
// and notifications can open a specific tab.
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  getCohorts, getMemberships, getCheckins, getPublicProfile, savePublicProfile,
  getContentSettings, getDay, getReflection, saveCheckin, updateUserProfile,
} from "../lib/data.js";
import { apiPost } from "../lib/api.js";
import { todayKey, checkinDayKey, addDays, timeZoneName } from "../lib/dates.js";
import { pickCurrentCohort, habitStreakLabel } from "../lib/cohorts.js";
import { weekContent } from "../lib/content.js";
import { aphorismFor } from "../lib/aphorisms.js";
import { computeStreak, badgesForStreak } from "../lib/streaks.js";

import PreCohort from "../components/dashboard/PreCohort.jsx";
import WeeklyReflection from "../components/dashboard/WeeklyReflection.jsx";
import LiveSession from "../components/dashboard/LiveSession.jsx";
import JoinCohort from "../components/dashboard/JoinCohort.jsx";
import Leaderboard from "../components/dashboard/Leaderboard.jsx";
import Celebration from "../components/dashboard/Celebration.jsx";
import StartAgain from "../components/dashboard/StartAgain.jsx";
import NotificationSettings from "../components/NotificationSettings.jsx";
import InstallApp from "../components/InstallApp.jsx";
import DashboardTabs, { TABS, DEFAULT_TAB } from "../components/dashboard/DashboardTabs.jsx";
import StreakCard from "../components/dashboard/StreakCard.jsx";
import BadgesCard from "../components/dashboard/BadgesCard.jsx";
import Folds from "../components/dashboard/Folds.jsx";
import BreatheTab from "../components/dashboard/BreatheTab.jsx";
import LeaderboardInvite from "../components/dashboard/LeaderboardInvite.jsx";
import { MorningPrompt } from "../components/dashboard/DailyPrompts.jsx";
import { promptTime } from "../content/dailyPrompts.js";
import Sheet from "../components/dashboard/Sheet.jsx";
import IntentionScreen from "../components/dashboard/IntentionScreen.jsx";
import EveningReview from "../components/dashboard/EveningReview.jsx";
import CravingFlow from "../components/dashboard/CravingFlow.jsx";
import TodaysPractice from "../components/dashboard/TodaysPractice.jsx";
import WhatsAppIcon from "../components/WhatsAppIcon.jsx";
import { LockIcon, PencilIcon } from "../components/TileIcons.jsx";

// Tabs shown on the dark blue background, like the Breathe screen.
const DARK_TABS = ["home", "practices", "breathe", "upcoming"];

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [celebrate, setCelebrate] = useState(null); // badge id to celebrate
  const [startAgain, setStartAgain] = useState(false);
  const [sheet, setSheet] = useState(null); // full-screen panel: "intention", "evening" or "craving"
  const [params, setParams] = useSearchParams();
  const [tabTaps, setTabTaps] = useState(0); // tapping a tab again starts it afresh (e.g. Breathe → choose a practice)
  const today = todayKey(); // calendar day: practice, meditation, cohort day number
  const checkinDay = checkinDayKey(); // the check-in day (turns over at 21:00, see dates.js)

  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : DEFAULT_TAB;
  function setTab(id, extra = {}) {
    setTabTaps((n) => n + 1);
    setParams(id === DEFAULT_TAB ? {} : { tab: id, ...extra });
    window.scrollTo(0, 0);
  }

  const load = useCallback(async () => {
    try {
      const date = todayKey();
      const [cohorts, memberships, checkins, publicProfile, settings, day, intention, evening] = await Promise.all([
        getCohorts(),
        getMemberships(user.uid),
        getCheckins(user.uid),
        getPublicProfile(user.uid),
        getContentSettings(),
        getDay(user.uid, date),
        getReflection(user.uid, `${date}_intention`).catch(() => null),
        getReflection(user.uid, `${date}_evening`).catch(() => null),
      ]);
      setData({ cohorts, memberships, checkins, publicProfile, settings, day, intention, evening });
    } catch (err) {
      console.error(err);
      setError("We couldn't load your dashboard. Please refresh the page.");
    }
  }, [user.uid]);

  useEffect(() => {
    load();
  }, [load]);

  // If the app stays open past midnight or 21:00, reload so the new day / check-in appears.
  useEffect(() => {
    const dayStamp = () => `${todayKey()}|${checkinDayKey()}`;
    let loadedFor = dayStamp();
    const refreshIfNewDay = () => {
      if (document.visibilityState === "visible" && dayStamp() !== loadedFor) {
        loadedFor = dayStamp();
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

  // Re-check the time every minute, so the Home tiles unlock on time while the app is open.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const target = params.get("open");
    if (target === "intention" || target === "evening") setSheet(target);
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

  const current = pickCurrentCohort(data.cohorts, data.memberships, today);
  const active = current?.progress.state === "active";
  // "This week": the member's cohort week, or the week the admin has set.
  const week = active ? current.progress.week : Number(data.settings.currentWeek) || 1;
  const habitType = current?.cohort.habitType || "smoking";
  const content = weekContent(habitType, week, data.settings);
  const firstName = profile?.firstName || user.displayName || "friend";

  // The evening review is the day's check-in: "Did you smoke today? No" keeps the streak.
  // If the smoking question was left blank, there's no check-in for the day.
  async function saveEveningCheckin(evening) {
    if (evening.smoked !== true && evening.smoked !== false) return;
    const checkin = {
      cohortId: current.cohort.id,
      day: current.progress.day,
      week: current.progress.week,
      maintained: evening.smoked === false,
      craving: evening.intensity, // 0 to 5
    };
    await saveCheckin(user.uid, today, checkin);
    await handleCheckinSaved(today, checkin);
  }

  // Called after a check-in is saved: update streak, badges and the public profile.
  async function handleCheckinSaved(date, checkin) {
    const checkins = { ...data.checkins, [date]: checkin };
    const streak = computeStreak(checkins, checkinDay);
    const lastYesDate = streak === 0 ? null : checkins[checkinDay]?.maintained ? checkinDay : addDays(checkinDay, -1);
    const earned = new Set(data.publicProfile?.badges || []);
    const newBadges = badgesForStreak(streak).filter((b) => !earned.has(b));
    const badges = [...earned, ...newBadges];

    await savePublicProfile(user.uid, {
      firstName,
      avatar: profile?.avatar || null,
      leaderboardOptIn: Boolean(profile?.leaderboardOptIn),
      showHabit: profile?.showHabit !== false, // shown unless the member turned it off
      habitType: current?.cohort.habitType || null, // which streak this is, e.g. "alcohol"
      streak,
      lastYesDate,
      badges,
    });
    setData((d) => ({ ...d, checkins, publicProfile: { ...d.publicProfile, streak, lastYesDate, badges } }));

    if (checkin.maintained && newBadges.length) setCelebrate(newBadges.at(-1));
  }

  const streak = computeStreak(data.checkins, checkinDay);

  const dayLabel = active ? `Day ${current.progress.day} ` : "";
  // Saves a daytime answer into Home's state, so the row shows it straight away.
  const onSaved = (key, answer, practised) =>
    setData((d) => ({ ...d, day: { ...d.day, [key]: answer, ...(practised !== undefined && { practised }) } }));
  const prompt = { uid: user.uid, today, dayLabel, onSaved };
  const groupLink = current?.cohort.whatsappGroupLink;

  // The day's three tiles. Each is locked (🔒) until its hour, when its notification
  // goes out, then ready to fill in (✏️) until done (✓). They lock again at midnight.
  const tile = ({ id, icon, tone, title, subtitle, isDone, doneText }) => {
    const { hour, minute } = promptTime(id);
    const locked = now.getHours() * 60 + now.getMinutes() < hour * 60 + minute;
    const opens = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    if (locked) return { id, icon: <LockIcon />, tone: "locked", title, subtitle, status: `Opens ${opens}`, locked: true };
    if (isDone) return { id, icon, tone, title, subtitle, status: doneText, done: true };
    return { id, icon: <PencilIcon />, tone: "ready", title, subtitle, status: "Ready", highlight: true };
  };

  // Home tiles, top to bottom. Notifications open a tile directly, e.g. /dashboard?open=morning.
  const homeItems = [
    active && {
      ...tile({ id: "morning", icon: "☀️", tone: "gold", title: "Morning", subtitle: "How are you feeling?", isDone: Boolean(data.day.morning), doneText: "✓ Shared" }),
      content: <MorningPrompt {...prompt} existing={data.day.morning} />,
    },
    active && {
      ...tile({ id: "intention", icon: "🎯", tone: "gold", title: "Intention", subtitle: "One minute with a question", isDone: Boolean(data.intention), doneText: "✓ Done" }),
      onOpen: () => setSheet("intention"),
    },
    active && {
      ...tile({ id: "evening", icon: "🌙", title: "Evening review", subtitle: "A minute to reflect on today",
        isDone: Boolean(data.evening), doneText: data.evening?.skipped ? "Skipped" : "✓ Done" }),
      onOpen: () => setSheet("evening"),
    },
    current && {
      id: "craving",
      icon: "🌊",
      tone: "calm",
      title: "I'm craving right now",
      subtitle: "Notice it, then breathe with it",
      onOpen: () => setSheet("craving"),
    },
    current && groupLink && {
      id: "group",
      icon: "💬",
      title: "Cohort group",
      subtitle: "WhatsApp",
      content: (
        <a className="btn btn-whatsapp" href={groupLink} target="_blank" rel="noreferrer"><WhatsAppIcon /> Open the group</a>
      ),
    },
  ].filter(Boolean);
  const aphorism = aphorismFor(today); // approved or owner-written lines only (src/lib/aphorisms.js)

  return (
    <main className={`page dashboard ${DARK_TABS.includes(tab) ? "dark" : ""}`}>
      {tab === DEFAULT_TAB && aphorism && <p className="aphorism">“{aphorism.text}”</p>}

      {notice && <p className="notice notice-good" role="status">{notice}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {/* Shown on any tab, straight after a check-in */}
      {celebrate && (
        <Celebration
          uid={user.uid}
          badgeId={celebrate}
          label={habitStreakLabel(habitType)}
          onDone={() => setCelebrate(null)}
          onNotRightNow={() => {
            setCelebrate(null);
            setStartAgain(true);
          }}
        />
      )}

      {startAgain && (
        <StartAgain uid={user.uid} current={current} onDone={async (restarted) => {
          setStartAgain(false);
          if (restarted) await load();
        }} />
      )}

      {/* Home: badges, the day's tiles (locked until their time), my streak (with journey), then the leaderboard tile */}
      {tab === "home" && (
        <>
          {current && <BadgesCard streak={streak} current={current} />}
          <Folds items={homeItems} initialOpen={params.get("open")} />
          {current ? (
            <>
              <StreakCard streak={streak} current={current} checkins={data.checkins} />
              <Folds items={[{
                id: "leaderboard", icon: "🏆", tone: "gold", title: "Leaderboard", subtitle: "Your cohort's streaks",
                content: <Leaderboard uid={user.uid} optedIn={Boolean(profile?.leaderboardOptIn)} today={checkinDay} />,
              }]} />
              <LeaderboardInvite uid={user.uid} profile={profile} />
              {current.progress.state === "upcoming" && <PreCohort current={current} />}
            </>
          ) : (
            <section className="card center">
              <h2>Join a cohort</h2>
              <button className="btn btn-primary" onClick={() => setTab("upcoming")}>See cohorts</button>
            </section>
          )}
          <NotificationSettings uid={user.uid} compact />
          <InstallApp />
        </>
      )}

      {/* Practices: this week's meditation, weekly assignment and live session */}
      {tab === "practices" && (
        <>
          <TodaysPractice content={content} />
          <WeeklyReflection content={content} />
          <LiveSession settings={data.settings} />
        </>
      )}

      {/* Breathe: coherent breathing or the 3-Step Breathing Space, for a craving */}
      {tab === "breathe" && <BreatheTab key={tabTaps} settings={data.settings} initialPractice={params.get("practice")} />}

      {/* Upcoming: cohorts that haven't started yet */}
      {tab === "upcoming" && (
        <JoinCohort uid={user.uid} cohorts={data.cohorts} memberships={data.memberships} onJoined={load} />
      )}

      {sheet === "intention" && (
        <Sheet label="Your intention for today" onClose={() => setSheet(null)}>
          <IntentionScreen uid={user.uid} date={today} existing={data.intention} firstName={firstName}
            onSaved={(intention) => setData((d) => ({ ...d, intention }))} />
        </Sheet>
      )}
      {sheet === "craving" && (
        <Sheet label="I'm craving right now" onClose={() => setSheet(null)}>
          <CravingFlow uid={user.uid} date={today} firstName={firstName}
            onBreathe={(practice) => { setSheet(null); setTab("breathe", { practice }); }} />
        </Sheet>
      )}
      {sheet === "evening" && (
        <Sheet label="Evening review" onClose={() => setSheet(null)}>
          <EveningReview uid={user.uid} date={today} existing={data.evening} firstName={firstName}
            onSaved={async (evening, skipped) => {
              setData((d) => ({ ...d, evening }));
              if (skipped) return setSheet(null);
              await saveEveningCheckin(evening);
            }} />
        </Sheet>
      )}

      <DashboardTabs active={tab} onChange={setTab} />
    </main>
  );
}
