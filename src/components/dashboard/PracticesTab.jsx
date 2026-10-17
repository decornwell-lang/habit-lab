// The Practices tab, top to bottom: this week's meditation video, then for each running cohort
// "This week" (the week's assignment, the Monday Zoom and the recording, in one card) and the
// 28-day grid of mindful days; the member's numbers and rest days; logging a practice done
// elsewhere; the Library (one practice per length, 3 to 20 minutes); and the week archive.
// Only for members whose cohort access is current (see cohortAccess in src/lib/access.js);
// anyone else sees a short note with a link to the cohorts.
import { useState } from "react";
import { Link } from "react-router-dom";
import { addDays, formatDate, nextWeeklySession, weekOfYear } from "../../lib/dates.js";
import { mindfulStats, canLogDate, cohortWeeks, weekOfCohort, weekStart, weekUnlocksAt, PRACTICE_LENGTHS, WEEKDAYS } from "../../lib/mindful.js";
import { logMeditation, updateUserProfile } from "../../lib/data.js";
import TodaysPractice from "./TodaysPractice.jsx";
import PdfButton from "../PdfButton.jsx";
import { videoSource } from "../../lib/video.js";

const LIVE = { weekday: 1, hour: 18, timeZone: "Europe/Madrid" }; // the usual Monday session, 18:00 Madrid
const timeIn = (date) => date.toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

// This week's resources for one cohort, with fallbacks to the shared settings until the
// owner fills in the week in Admin → Weeks.
function weekResources({ cohort, week, resources, settings, content }) {
  const r = resources.find((x) => x.cohortId === cohort.id && x.weekNumber === week) || {};
  const set = settings.assignments?.[weekOfYear()];
  return {
    assignment: r.assignmentPdfUrl || set?.pdfUrl || content.reflectionUrl,
    assignmentTitle: r.assignmentTitle || set?.title || content.title.replace(/^week\s*\d+\s*:\s*/i, ""),
    zoomLink: r.zoomLink || settings.zoomLink || "",
    // The week's own time (Admin → Weeks), or a one-off date (Admin → Content), or the usual Monday.
    zoomAt: r.zoomStartsAt ? new Date(r.zoomStartsAt)
      : settings.nextSessionAt && new Date(settings.nextSessionAt) > new Date() ? new Date(settings.nextSessionAt) : nextWeeklySession(LIVE),
    recordingUrl: r.recordingUrl || "",
    recordingDescription: r.recordingDescription || "",
  };
}

export function ThisWeekCard({ row, resources, settings, content, timeZone, today, now = new Date() }) {
  const { cohort, progress } = row;
  const weeks = cohortWeeks(Number(cohort.durationDays) || 28);
  const week = Math.max(1, Math.min(weekOfCohort(progress.start, today, cohort.durationDays), weeks));
  const unlocks = weekUnlocksAt(progress.start, week, timeZone);
  const locked = now < unlocks;
  const w = weekResources({ cohort, week, resources, settings, content });
  return (
    <section className={`card this-week${locked ? " locked" : ""}`}>
      <p className="card-label">This week · {cohort.name}</p>
      <h2>Week {week} of {weeks}</h2>
      {locked ? (
        <p className="muted">Unlocks Monday at 00:00 your time ({formatDate(weekStart(progress.start, week), { year: undefined })}).</p>
      ) : (
        <ol className="week-steps">
          <li>
            <span className="week-step-label">Assignment</span>
            <strong>{w.assignmentTitle}</strong>
            <PdfButton url={w.assignment} label="Open the assignment" className="btn btn-primary btn-small" />
          </li>
          <li>
            <span className="week-step-label">Live session</span>
            <strong>{timeIn(w.zoomAt)} <span className="muted small">(your time)</span></strong>
            {w.zoomLink ? <a className="btn btn-primary btn-small" href={w.zoomLink} target="_blank" rel="noreferrer">Join on Zoom</a> : <span className="muted small">Link coming soon.</span>}
          </li>
          <li>
            <span className="week-step-label">Recording</span>
            {w.recordingUrl ? (
              <>
                {w.recordingDescription && <span className="muted small">{w.recordingDescription}</span>}
                <a className="btn btn-ghost btn-small" href={w.recordingUrl} target="_blank" rel="noreferrer">Watch the recording</a>
              </>
            ) : <span className="muted small">Added after the session.</span>}
          </li>
        </ol>
      )}
    </section>
  );
}

// One cell per day of the cohort: filled on a mindful day, today outlined, future days muted.
function MindfulGrid({ row, sessions, today }) {
  const { cohort, progress } = row;
  const length = Number(cohort.durationDays) || 28;
  const days = Array.from({ length }, (_, i) => addDays(progress.start, i));
  const count = days.filter((d) => sessions[d]).length;
  return (
    <section className="card">
      <p className="card-label">{cohort.name}</p>
      <h2>{count} mindful {count === 1 ? "day" : "days"} in this cohort</h2>
      <div className="mindful-grid" role="img" aria-label={`${count} of ${length} days with a practice`}>
        {days.map((d, i) => (
          <span key={d} title={`Day ${i + 1}`} className={`${sessions[d] ? "done" : ""}${d === today ? " today" : ""}${d > today ? " future" : ""}`} />
        ))}
      </div>
    </section>
  );
}

function LogForm({ uid, today, onLogged, onClose }) {
  const [minutes, setMinutes] = useState(10);
  const [other, setOther] = useState("");
  const [date, setDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const value = minutes === "other" ? Number(other) : minutes;

  async function save() {
    if (!canLogDate(date, today)) return setError("You can log today or an earlier day this week.");
    if (!(value > 0 && value <= 300)) return setError("How many minutes? Between 1 and 300.");
    setBusy(true);
    try {
      const entry = await logMeditation(uid, date, { source: "manual_log", minutes: value });
      onLogged(date, entry);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Couldn't save. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="log-form">
      <p className="q-title">How long?</p>
      <div className="choices">
        {[...PRACTICE_LENGTHS, "other"].map((m) => (
          <button type="button" key={m} className={minutes === m ? "selected" : ""} aria-pressed={minutes === m} onClick={() => setMinutes(m)}>
            {m === "other" ? "Other" : `${m} min`}
          </button>
        ))}
      </div>
      {minutes === "other" && (
        <input className="q-input" type="number" inputMode="numeric" min="1" max="300" placeholder="Minutes" value={other} onChange={(e) => setOther(e.target.value)} aria-label="Minutes" />
      )}
      <p className="q-title">When?</p>
      <input className="q-input" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="log-actions">
        <button type="button" className="btn btn-primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        <button type="button" className="btn btn-text" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

// One practice in the Library. With audio: a player, which counts the practice once it has
// been played past 90%. Without audio yet: "Coming soon".
function LibraryItem({ practice, done, onPractised }) {
  const [hasCounted, setCounted] = useState(false);
  const audio = practice.audioUrl ? videoSource(practice.audioUrl) : null;
  return (
    <li className="library-item">
      <img src={practice.thumbnailUrl || "/images/david.jpg"} alt="" />
      <div>
        <strong>{practice.title}</strong>
        <span className="muted small">{practice.durationMinutes} minutes · {practice.description}</span>
        {practice.audioUrl ? (
          audio?.type === "video" || /\.(mp3|m4a|aac|wav|ogg)(\?|$)/i.test(practice.audioUrl) ? (
            <audio controls preload="none" src={practice.audioUrl}
              onTimeUpdate={(e) => {
                const a = e.currentTarget;
                if (!hasCounted && a.duration && a.currentTime / a.duration >= 0.9) {
                  setCounted(true);
                  onPractised(practice, "app");
                }
              }} />
          ) : (
            <a className="btn btn-ghost btn-small" href={practice.audioUrl} target="_blank" rel="noreferrer">Listen</a>
          )
        ) : (
          <span className="coming-soon">Coming soon</span>
        )}
        <button type="button" className="btn btn-primary btn-small" disabled={done} onClick={() => onPractised(practice, "self_reported")}>
          {done ? "✓ Practised today" : "I practised today"}
        </button>
      </div>
    </li>
  );
}

export default function PracticesTab({ uid, profile, access, isAdmin, rows, sessions, practices, resources, settings, content, today, onLogged }) {
  const [logging, setLogging] = useState(false);
  const [restDays, setRestDays] = useState(profile?.restDays || []);

  if (access.state !== "active" && !isAdmin) {
    return (
      <section className="card center">
        <h2>Practices open when your cohort begins</h2>
        <p className="muted">
          {access.state === "upcoming"
            ? `Your cohort starts on ${formatDate(access.startsAt.toISOString().slice(0, 10), { year: undefined })}. The practices, the library and the weekly sessions open then.`
            : "The practices, the library and the weekly sessions are for members of a current cohort."}
        </p>
        <Link to="/dashboard?tab=upcoming" className="btn btn-primary">See the cohorts</Link>
      </section>
    );
  }

  const stats = mindfulStats(sessions, today, restDays);
  const running = rows.filter((r) => r.progress.state === "active");
  const practisedToday = (id) => (sessions[today]?.entries || []).some((e) => e.practiceId === id);
  const timeZone = profile?.timeZone || "Europe/Madrid";

  async function practised(practice, source) {
    const entry = await logMeditation(uid, today, { source, practiceId: practice.id, minutes: practice.durationMinutes });
    onLogged(today, entry);
  }

  function toggleRest(day) {
    const next = restDays.includes(day) ? restDays.filter((d) => d !== day) : restDays.length < 2 ? [...restDays, day] : restDays;
    setRestDays(next);
    updateUserProfile(uid, { restDays: next }).catch(console.error);
  }

  return (
    <>
      <TodaysPractice content={content} />

      {running.map((row) => (
        <ThisWeekCard key={row.cohort.id} row={row} resources={resources} settings={settings} content={content} timeZone={timeZone} today={today} />
      ))}
      {running.map((row) => <MindfulGrid key={`g${row.cohort.id}`} row={row} sessions={sessions} today={today} />)}

      <section className="card">
        <p className="card-label">Your practice</p>
        <div className="mindful-stats">
          <span><strong>{stats.days}</strong><small>mindful {stats.days === 1 ? "day" : "days"}</small></span>
          <span><strong>{stats.week.done}<em> of {stats.week.of}</em></strong><small>this week</small></span>
          <span><strong>{stats.minutes}</strong><small>minutes</small></span>
        </div>
        <p className="q-title rest-title">Rest days <span className="muted small">(up to two; they never count against you)</span></p>
        <div className="rest-days">
          {WEEKDAYS.map((d) => (
            <button type="button" key={d} className={restDays.includes(d) ? "selected" : ""} aria-pressed={restDays.includes(d)} onClick={() => toggleRest(d)}
              disabled={!restDays.includes(d) && restDays.length >= 2}>
              {d.slice(0, 3)}
            </button>
          ))}
        </div>
        {logging ? (
          <LogForm uid={uid} today={today} onLogged={onLogged} onClose={() => setLogging(false)} />
        ) : (
          <button type="button" className="btn btn-ghost" onClick={() => setLogging(true)}>Log a practice I did elsewhere</button>
        )}
      </section>

      <section className="card">
        <p className="card-label">Library</p>
        <h2>Practices for any moment</h2>
        <ul className="library">
          {practices.filter((p) => p.published !== false).sort((a, b) => a.durationMinutes - b.durationMinutes).map((p) => (
            <LibraryItem key={p.id} practice={p} done={practisedToday(p.id)} onPractised={practised} />
          ))}
        </ul>
      </section>

      <p className="center"><Link to="/archive" className="text-link">All weeks: assignments and recordings →</Link></p>
    </>
  );
}
