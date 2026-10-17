// "My progress" (Home, below My streak): small charts across the cohort's days, filled in
// from the member's own check-ins.
//  - Sleep (every cohort): a bar for how long they slept, its shade for how well
//    (lighter Poor, darker Good). From the morning check-in.
//  - Cravings (cohorts with cravings): the evening's craving intensity, 0 to 5.
//  - Control pause (asthma cohorts): seconds, from the morning check-in.
// Tap a day to see its numbers. A chart shows once it has at least one day.
import { useState } from "react";
import { addDays } from "../../lib/dates.js";
import { SLEEP_HOURS } from "../../content/dailyPrompts.js";

const W = 320, H = 118, LEFT = 26, RIGHT = 6, TOP = 8, BOTTOM = 20;
const QUALITY = { "😔 Poor": 0, "😐 Okay": 1, "🙂 Good": 2 };
const QUALITY_NAMES = ["Poor", "Okay", "Good"];
const SHADE = [0.35, 0.65, 1]; // Poor, Okay, Good

function Chart({ days, max, ticks, unit, bars, label, describe }) {
  const [picked, setPicked] = useState(null);
  const n = days.length;
  const plotW = W - LEFT - RIGHT, plotH = H - TOP - BOTTOM;
  const x = (i) => LEFT + (n === 1 ? plotW / 2 : (i * plotW) / (n - 1));
  const slot = plotW / Math.max(n, 1);
  const bx = (i) => LEFT + slot * i + slot / 2;
  const y = (v) => TOP + plotH - (Math.min(v, max) / max) * plotH;
  const pos = bars ? bx : x;
  const known = days.map((d, i) => ({ ...d, i })).filter((d) => d.value != null);
  // Line through the days with a value; a gap where a day is missing.
  const segments = [];
  known.forEach((d, k) => {
    if (k === 0 || d.i !== known[k - 1].i + 1) segments.push([]);
    segments.at(-1).push(`${pos(d.i).toFixed(1)},${y(d.value).toFixed(1)}`);
  });
  const barW = Math.max(3, Math.min(9, slot - 3));
  const pick = picked != null ? days[picked] : null;

  return (
    <div className="chart">
      <p className="chart-readout" aria-live="polite">{pick ? `Day ${pick.day}: ${describe(pick)}` : "Tap a day to see it."}</p>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={LEFT} x2={W - RIGHT} y1={y(t)} y2={y(t)} className="chart-grid" />
            <text x={LEFT - 6} y={y(t) + 3.5} className="chart-axis" textAnchor="end">{t}{unit}</text>
          </g>
        ))}
        {bars
          ? known.map((d) => (
              <rect key={d.i} x={bx(d.i) - barW / 2} y={y(d.value)} width={barW} height={Math.max(1, y(0) - y(d.value))} rx="2"
                className="chart-mark" style={{ opacity: d.shade ?? 1 }} />
            ))
          : segments.map((pts, k) => <polyline key={k} points={pts.join(" ")} className="chart-line" />)}
        {!bars && known.map((d) => <circle key={d.i} cx={x(d.i)} cy={y(d.value)} r={picked === d.i ? 5 : 3.5} className="chart-dot" />)}
        {picked != null && <line x1={pos(picked)} x2={pos(picked)} y1={TOP} y2={TOP + plotH} className="chart-cross" />}
        {[0, Math.floor((n - 1) / 2), n - 1].filter((v, k, a) => n > 0 && a.indexOf(v) === k).map((i) => (
          <text key={i} x={pos(i)} y={H - 5} className="chart-axis" textAnchor="middle">Day {days[i].day}</text>
        ))}
        {/* Tap targets: one per day, the full height of the chart */}
        {days.map((d, i) => (
          <rect key={`t${i}`} x={pos(i) - slot / 2} y={0} width={slot} height={H - BOTTOM + 4} fill="transparent"
            onClick={() => setPicked(picked === i ? null : i)} />
        ))}
      </svg>
    </div>
  );
}

const average = (vals) => (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null);

export default function ProgressCharts({ current, habit, practiceDays, checkins }) {
  const { cohort, progress } = current;
  if (progress.state === "upcoming") return null;
  const total = Math.min(progress.day, Number(cohort.durationDays) || 33);
  const days = Array.from({ length: total }, (_, i) => {
    const date = addDays(progress.start, i);
    const m = practiceDays[date]?.[`morning_${cohort.id}`] || {};
    const q = QUALITY[m.sleepQuality];
    return {
      day: i + 1,
      date,
      hours: SLEEP_HOURS[m.sleepHours] ?? null,
      sleepLength: m.sleepHours,
      quality: q,
      craving: Number.isFinite(checkins[date]?.craving) ? checkins[date].craving : null,
      pause: Number.isFinite(m.controlPause) ? m.controlPause : null,
    };
  });

  const sleep = days.map((d) => ({ ...d, value: d.hours, shade: d.quality != null ? SHADE[d.quality] : 0.65 }));
  const cravings = days.map((d) => ({ ...d, value: d.craving }));
  const pause = days.map((d) => ({ ...d, value: d.pause }));
  const has = (series) => series.some((d) => d.value != null);
  const avg = (series) => average(series.filter((d) => d.value != null).map((d) => d.value));

  const charts = [];
  if (has(sleep)) {
    charts.push(
      <section key="sleep" className="chart-block">
        <h3>Sleep</h3>
        <p className="muted small">Average {avg(sleep).toFixed(1)} hours a night</p>
        <Chart days={sleep} max={9} ticks={[0, 3, 6, 9]} unit="h" bars label="Hours of sleep each night, shaded by sleep quality"
          describe={(d) => (d.value == null ? "no answer" : `${d.sleepLength}${d.quality != null ? `, ${QUALITY_NAMES[d.quality]}` : ""}`)} />
        <div className="chart-legend" aria-hidden="true">
          {QUALITY_NAMES.map((name, i) => <span key={name}><i style={{ opacity: SHADE[i] }} />{name}</span>)}
        </div>
      </section>
    );
  }
  if (habit.cravings && has(cravings)) {
    charts.push(
      <section key="cravings" className="chart-block">
        <h3>Cravings</h3>
        <p className="muted small">Average intensity {avg(cravings).toFixed(1)} out of 5</p>
        <Chart days={cravings} max={5} ticks={[0, 1, 2, 3, 4, 5]} unit="" label="Craving intensity each evening, 0 to 5"
          describe={(d) => (d.value == null ? "no answer" : `intensity ${d.value} of 5`)} />
      </section>
    );
  }
  if (cohort.habitType === "asthma" && has(pause)) {
    charts.push(
      <section key="pause" className="chart-block">
        <h3>Control pause</h3>
        <p className="muted small">Average {Math.round(avg(pause))} seconds</p>
        <Chart days={pause} max={60} ticks={[0, 20, 40, 60]} unit="s" label="Control pause each morning, in seconds"
          describe={(d) => (d.value == null ? "not measured" : `${d.value} seconds`)} />
      </section>
    );
  }

  return (
    <section className="card progress-card">
      <p className="card-label">My progress</p>
      {charts.length ? charts : <p className="muted">Your charts fill in as you check in each morning and evening.</p>}
    </section>
  );
}
