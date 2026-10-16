// The buttons at the top of Home for a member in more than one cohort, e.g.
// "Smoke-free · Alcohol-free · Fitness". Everything below follows the chosen cohort: its
// morning, intention and evening tiles, badges, streak, journey, leaderboard and WhatsApp
// group. A small number shows how many of a cohort's tiles are waiting today.
import { useEffect, useRef } from "react";
import { habitInfo } from "../../lib/cohorts.js";

export default function CohortSwitcher({ rows, selected, waiting = {}, onSelect }) {
  const names = rows.map((r) => habitInfo(r.cohort.habitType).tab);
  const list = useRef(null);
  // Keep the chosen cohort's button in view when there are more than fit across.
  useEffect(() => {
    const button = list.current?.querySelector(".selected");
    if (!button) return;
    const box = list.current;
    box.scrollTo({ left: button.offsetLeft - (box.clientWidth - button.offsetWidth) / 2, behavior: "smooth" });
  }, [selected]);
  return (
    <div className="cohort-switcher" role="tablist" aria-label="Your cohorts" ref={list}>
      {rows.map((r, i) => (
        <button type="button" role="tab" key={r.cohort.id} aria-selected={r.cohort.id === selected}
          className={r.cohort.id === selected ? "selected" : ""} onClick={() => onSelect(r.cohort.id)}
          style={{ "--cohort": habitInfo(r.cohort.habitType).accent }}>
          {/* Two cohorts on the same habit are told apart by name. */}
          {names.indexOf(names[i]) !== names.lastIndexOf(names[i]) ? r.cohort.name : names[i]}
          {r.progress.state === "upcoming" && <small> · soon</small>}
          {waiting[r.cohort.id] > 0 && <span className="switcher-count" aria-label={`${waiting[r.cohort.id]} waiting`}>{waiting[r.cohort.id]}</span>}
        </button>
      ))}
    </div>
  );
}
