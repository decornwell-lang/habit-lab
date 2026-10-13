// Dashboard: the members' home page, split into four tabs (see DashboardTabs.jsx):
//   Community · This week · My practice · Upcoming
// The open tab is part of the address (e.g. /dashboard?tab=week), so links
// and notifications can open a specific tab.
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  getCohorts, getMemberships, getCheckins, getPublicProfile, savePublicProfile,
  getContentSettings, hasPractised, updateUserProfile,
} from "../lib/data.js";
import { apiPost } from "../lib/api.js";
import { todayKey, addDays, timeZoneName } from "../lib/dates.js";
import { pickCurrentCohort } from "../lib/cohorts.js";
import { weekContent } from "../lib/content.js";
import { computeStreak, badgesForStreak } from "../lib/streaks.js";

import PreCohort from "../components/dashboard/PreCohort.jsx";
import TodaysPractice from "../components/dashboard/TodaysPractice.jsx";
import DailyCheckin from "../components/dashboard/DailyCheckin.jsx";
import WeeklyReflection from "../components/dashboard/WeeklyReflection.jsx";
import LiveSession from "../components/dashboard/LiveSession.jsx";
import MyPod from "../components/dashboard/MyPod.jsx";
import JoinCohort from "../components/dashboard/JoinCohort.jsx";
import Leaderboard from "../components/dashboard/Leaderboard.jsx";
import Celebration from "../components/dashboard/Celebration.jsx";
import StartAgain from "../components/dashboard/StartAgain.jsx";
import Messages from "../components/dashboard/Messages.jsx";
import NotificationSettings from "../components/NotificationSettings.jsx";
import InstallApp from "../components/InstallApp.jsx";
import DashboardTabs, { TABS, DEFAULT_TAB } from "../components/dashboard/DashboardTabs.jsx";
import StreakCard from "../components/dashboard/StreakCard.jsx";
import UpcomingEvents from "../components/dashboard/UpcomingEvents.jsx";
import BreathePause from "../components/dashboard/BreathePause.jsx";
import JourneyMap from "../components/dashboard/JourneyMap.jsx";
import AddPhoneCard from "../components/dashboard/AddPhoneCard.jsx";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [celebrate, setCelebrate] = useState(null); // badge id to celebrate
  const [startAgain, setStartAgain] = useState(false);
  const [params, setParams] = useSearchParams();
  const today = todayKey();

  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : DEFAULT_TAB;
  function setTab(id) {
    setParams(id === DEFAULT_TAB ? {} : { tab: id });
    window.scrollTo(0, 0);
  }

  const load = useCallback(async () => {
    try {
      const [cohorts, memberships, checkins, publicProfile, settings, practised] = await Promise.all([
        getCohorts(),
        getMemberships(user.uid),
        getCheckins(user.uid),
        getPublicProfile(user.uid),
        getContentSettings(),
        hasPractised(user.uid, todayKey()),
      ]);
      setData({ cohorts, memberships, checkins, publicProfile, settings, practised });
    } catch (err) {
      console.error(err);
      setError("We couldn't load your dashboard. Please refresh the page.");
    }
  }, [user.uid]);

  useEffect(() => {
    load();
  }, [load]);

  // If the app stays open past 07:00, reload so the new day's check-in appears.
  useEffect(() => {
    let loadedFor = todayKey();
    const refreshIfNewDay = () => {
      if (document.visibilityState === "visible" && todayKey() !== loadedFor) {
        loadedFor = todayKey();
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

  // Remember the member's time zone (used for 07:00 reminders in future).
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

  // Called after a check-in is saved: update streak, badges and the public profile.
  async function handleCheckinSaved(date, checkin) {
    const checkins = { ...data.checkins, [date]: checkin };
    const streak = computeStreak(checkins, today);
    const lastYesDate = streak === 0 ? null : checkins[today]?.maintained ? today : addDays(today, -1);
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

  const streak = computeStreak(data.checkins, today);
  const tabTitle = TABS.find((t) => t.id === tab)?.label;

  return (
    <main className="page dashboard">
      <p className="eyebrow">Hello, {firstName}</p>
      <h1>{tabTitle}</h1>

      {notice && <p className="notice notice-good" role="status">{notice}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      <AddPhoneCard uid={user.uid} profile={profile} />

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

      {/* 1. Community: leaderboard and notifications */}
      {tab === "community" && (
        <>
          <Messages cohortIds={data.memberships.map((m) => m.cohortId)} />
          <NotificationSettings uid={user.uid} compact />
          <InstallApp />
          <Leaderboard uid={user.uid} optedIn={Boolean(profile?.leaderboardOptIn)} today={today} />
        </>
      )}

      {/* 2. This week: meditation, reflection and the Zoom session */}
      {tab === "week" && (
        <>
          <TodaysPractice uid={user.uid} content={content} practised={data.practised} today={today} />
          <WeeklyReflection content={content} />
          <LiveSession settings={data.settings} />
        </>
      )}

      {/* 3. My practice: streak, check-in, cohort and pod */}
      {tab === "practice" && (
        <>
          {current ? (
            <>
              <StreakCard streak={streak} badges={data.publicProfile?.badges} current={current} weekTitle={content.title} />
              {current.progress.state === "upcoming" && <PreCohort current={current} />}
              {current.progress.state === "active" && <BreathePause />}
              <DailyCheckin
                uid={user.uid}
                current={current}
                content={content}
                existing={data.checkins[today]}
                streak={streak}
                today={today}
                onSaved={handleCheckinSaved}
              />
              <JourneyMap current={current} checkins={data.checkins} />
              <MyPod uid={user.uid} profile={profile} current={current} today={today} />
            </>
          ) : (
            <section className="card center">
              <p className="card-label">My practice</p>
              <h2>You haven't joined a cohort yet</h2>
              <p className="muted">Your streak, daily check-in and pod will appear here once you join.</p>
              <button className="btn btn-primary" onClick={() => setTab("upcoming")}>See upcoming cohorts</button>
            </section>
          )}
        </>
      )}

      {/* 4. Upcoming: events and cohorts to join */}
      {tab === "upcoming" && (
        <>
          <UpcomingEvents settings={data.settings} cohorts={data.cohorts} memberships={data.memberships} onOpenTab={setTab} />
          <JoinCohort uid={user.uid} cohorts={data.cohorts} memberships={data.memberships} onJoined={load} />
        </>
      )}

      <p className="form-foot">
        <Link to="/account">My account and privacy settings</Link>
      </p>

      <DashboardTabs active={tab} onChange={setTab} />
    </main>
  );
}
