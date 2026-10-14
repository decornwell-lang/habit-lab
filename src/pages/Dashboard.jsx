// Dashboard: the members' home page, with two tabs (see DashboardTabs.jsx):
//   Home (everything) · Upcoming
// The open tab is part of the address (e.g. /dashboard?tab=week), so links
// and notifications can open a specific tab.
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  getCohorts, getMemberships, getCheckins, getPublicProfile, savePublicProfile,
  getContentSettings, getDay, isPractised, updateUserProfile,
} from "../lib/data.js";
import { apiPost } from "../lib/api.js";
import { todayKey, checkinDayKey, addDays, timeZoneName } from "../lib/dates.js";
import { pickCurrentCohort, cohortProgress } from "../lib/cohorts.js";
import { weekContent } from "../lib/content.js";
import { computeStreak, badgesForStreak } from "../lib/streaks.js";

import PreCohort from "../components/dashboard/PreCohort.jsx";
import DailyCheckin from "../components/dashboard/DailyCheckin.jsx";
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
import UpcomingEvents from "../components/dashboard/UpcomingEvents.jsx";
import BreathePause from "../components/dashboard/BreathePause.jsx";
import JourneyMap from "../components/dashboard/JourneyMap.jsx";
import Folds from "../components/dashboard/Folds.jsx";
import { MorningPrompt, MeditationPrompt, ReflectionPrompt } from "../components/dashboard/DailyPrompts.jsx";
import WhatsAppIcon from "../components/WhatsAppIcon.jsx";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [celebrate, setCelebrate] = useState(null); // badge id to celebrate
  const [startAgain, setStartAgain] = useState(false);
  const [params, setParams] = useSearchParams();
  const today = todayKey(); // calendar day: practice, meditation, cohort day number
  const checkinDay = checkinDayKey(); // the check-in that's open now (opens 18:00, see dates.js)

  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : DEFAULT_TAB;
  function setTab(id) {
    setParams(id === DEFAULT_TAB ? {} : { tab: id });
    window.scrollTo(0, 0);
  }

  const load = useCallback(async () => {
    try {
      const [cohorts, memberships, checkins, publicProfile, settings, day] = await Promise.all([
        getCohorts(),
        getMemberships(user.uid),
        getCheckins(user.uid),
        getPublicProfile(user.uid),
        getContentSettings(),
        getDay(user.uid, todayKey()),
      ]);
      setData({ cohorts, memberships, checkins, publicProfile, settings, day });
    } catch (err) {
      console.error(err);
      setError("We couldn't load your dashboard. Please refresh the page.");
    }
  }, [user.uid]);

  useEffect(() => {
    load();
  }, [load]);

  // If the app stays open past midnight or 18:00, reload so the new day / check-in appears.
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

  // Remember the member's time zone (used for the 18:00 reminder).
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
  // The open check-in can be yesterday's (before 18:00), so it has its own day and week.
  const checkinProgress = current ? cohortProgress(current.cohort, current.membership, checkinDay) : null;
  const checkinContent =
    checkinProgress?.state === "active" ? weekContent(habitType, checkinProgress.week, data.settings) : content;
  const firstName = profile?.firstName || user.displayName || "friend";

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

    if (!checkin.maintained) setStartAgain(true);
    else if (newBadges.length) setCelebrate(newBadges.at(-1));
  }

  const streak = computeStreak(data.checkins, checkinDay);
  const checkedIn = Boolean(data.checkins[checkinDay]);

  // Home rows, top to bottom. Each opens to show its card.
  const dayLabel = active ? `Day ${current.progress.day} ` : "";
  // Saves a daytime answer into Home's state, so the row shows it straight away.
  const onSaved = (key, answer, practised) =>
    setData((d) => ({ ...d, day: { ...d.day, [key]: answer, ...(practised !== undefined && { practised }) } }));
  const prompt = { uid: user.uid, today, dayLabel, onSaved };
  const done = (answer) => (answer ? "✓ Shared" : "");
  const groupLink = current?.cohort.whatsappGroupLink;

  // Home rows, top to bottom: the day's prompts in order, then everything else.
  // Notifications open a row directly, e.g. /dashboard?open=morning.
  const homeItems = [
    current && groupLink && {
      id: "group",
      icon: "💬",
      title: "Cohort group",
      summary: "WhatsApp",
      content: (
        <a className="btn btn-whatsapp" href={groupLink} target="_blank" rel="noreferrer"><WhatsAppIcon /> Open the group</a>
      ),
    },
    active && {
      id: "morning",
      icon: "☀️",
      tone: "gold",
      title: "Morning",
      summary: done(data.day.morning) || "How are you?",
      done: Boolean(data.day.morning),
      content: <MorningPrompt {...prompt} existing={data.day.morning} />,
    },
    {
      id: "meditation",
      icon: "🧘",
      title: "Meditation",
      summary: done(data.day.meditation) || (isPractised(data.day) ? "✓ Done" : "15 minutes"),
      done: Boolean(data.day.meditation) || isPractised(data.day),
      content: <MeditationPrompt {...prompt} content={content} existing={data.day.meditation} />,
    },
    active && {
      id: "reflection",
      icon: "✍️",
      tone: "gold",
      title: "Reflection",
      summary: done(data.day.reflection) || "Daily question",
      done: Boolean(data.day.reflection),
      content: <ReflectionPrompt {...prompt} content={content} existing={data.day.reflection} />,
    },
    current && checkinProgress?.state === "active" && {
      id: "checkin",
      icon: "🌿",
      title: "Check-in",
      summary: checkedIn ? "✓ Done" : "Open now",
      highlight: !checkedIn,
      done: checkedIn,
      content: (
        <DailyCheckin uid={user.uid} current={current} content={checkinContent} progress={checkinProgress}
          existing={data.checkins[checkinDay]} streak={streak} day={checkinDay} onSaved={handleCheckinSaved} />
      ),
    },
    {
      id: "week",
      icon: "📅",
      tone: "gold",
      title: "This week",
      summary: shortDateTime(data.settings.nextSessionAt) || `Week ${week}`,
      content: (
        <>
          <LiveSession settings={data.settings} />
          <WeeklyReflection content={content} />
        </>
      ),
    },
    active && { id: "breathe", icon: "🌊", title: "Craving?", summary: "1 minute", content: <BreathePause /> },
    { id: "leaderboard", icon: "🏆", tone: "gold", title: "Leaderboard", summary: "Streaks", content: <Leaderboard uid={user.uid} optedIn={Boolean(profile?.leaderboardOptIn)} today={checkinDay} /> },
    current && { id: "journey", icon: "🗺️", title: "Journey", summary: active ? `Day ${current.progress.day} of ${current.cohort.durationDays}` : "", content: <JourneyMap current={current} checkins={data.checkins} /> },
  ].filter(Boolean);
  const tabTitle = TABS.find((t) => t.id === tab)?.label;

  return (
    <main className="page dashboard">
      <p className="eyebrow">Hello, {firstName}</p>
      {tab !== DEFAULT_TAB && <h1>{tabTitle}</h1>}

      {notice && <p className="notice notice-good" role="status">{notice}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}


      {/* Shown on any tab, straight after a check-in */}
      {celebrate && (
        <Celebration
          uid={user.uid}
          badgeId={celebrate}
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

      {/* Home: streak, then everything else as rows that open when tapped */}
      {tab === "home" && (
        <>
          {current ? (
            <>
              <StreakCard streak={streak} badges={data.publicProfile?.badges} current={current} weekTitle={content.title} />
              {current.progress.state === "upcoming" && <PreCohort current={current} />}
            </>
          ) : (
            <section className="card center">
              <h2>Join a cohort</h2>
              <button className="btn btn-primary" onClick={() => setTab("upcoming")}>See cohorts</button>
            </section>
          )}
          <Folds items={homeItems} initialOpen={params.get("open")} />
          <NotificationSettings uid={user.uid} compact />
          <InstallApp />
        </>
      )}

      {/* Upcoming: events and cohorts to join */}
      {tab === "upcoming" && (
        <>
          <UpcomingEvents settings={data.settings} cohorts={data.cohorts} memberships={data.memberships} onOpenTab={setTab} />
          <JoinCohort uid={user.uid} cohorts={data.cohorts} memberships={data.memberships} onJoined={load} />
        </>
      )}

      <p className="form-foot">
        <Link to="/account">My account</Link>
      </p>

      <DashboardTabs active={tab} onChange={setTab} />
    </main>
  );
}

// e.g. "Mon 19:00" for the Live session row
function shortDateTime(iso) {
  const date = new Date(iso);
  if (!iso || isNaN(date)) return "";
  return date.toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" });
}
