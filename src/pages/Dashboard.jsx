// Dashboard: the members' home page. Loads the member's data once, then
// shows the sections in the order set out in the brief.
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  getCohorts, getMemberships, getCheckins, getPublicProfile, savePublicProfile,
  getContentSettings, hasPractised,
} from "../lib/data.js";
import { apiPost } from "../lib/api.js";
import { todayKey, addDays } from "../lib/dates.js";
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

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [celebrate, setCelebrate] = useState(null); // badge id to celebrate
  const [startAgain, setStartAgain] = useState(false);
  const [params, setParams] = useSearchParams();
  const today = todayKey();

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
      streak,
      lastYesDate,
      badges,
    });
    setData((d) => ({ ...d, checkins, publicProfile: { ...d.publicProfile, streak, lastYesDate, badges } }));

    if (!checkin.maintained) setStartAgain(true);
    else if (newBadges.length) setCelebrate(newBadges.at(-1));
  }

  return (
    <main className="page dashboard">
      <p className="eyebrow">My dashboard</p>
      <h1>Hello, {firstName}</h1>
      {current && (
        <p className="muted">
          {current.cohort.name}
          {active && ` · Day ${current.progress.day} of ${current.cohort.durationDays}`}
        </p>
      )}

      {notice && <p className="notice notice-good" role="status">{notice}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      <Messages cohortIds={data.memberships.map((m) => m.cohortId)} />

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

      {current?.progress.state === "upcoming" && <PreCohort current={current} />}

      <TodaysPractice uid={user.uid} content={content} practised={data.practised} today={today} />

      {current && (
        <DailyCheckin
          uid={user.uid}
          current={current}
          content={content}
          existing={data.checkins[today]}
          streak={computeStreak(data.checkins, today)}
          today={today}
          onSaved={handleCheckinSaved}
        />
      )}

      <WeeklyReflection content={content} />
      <LiveSession settings={data.settings} />
      <MyPod uid={user.uid} current={current} today={today} />
      <JoinCohort uid={user.uid} cohorts={data.cohorts} memberships={data.memberships} onJoined={load} />
      <Leaderboard uid={user.uid} optedIn={Boolean(profile?.leaderboardOptIn)} today={today} />
      <NotificationSettings uid={user.uid} compact />

      <p className="form-foot">
        <Link to="/account">My account and privacy settings</Link>
      </p>
    </main>
  );
}
