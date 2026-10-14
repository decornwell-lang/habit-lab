// A badge: a gold seal with the milestone inside, e.g. "7 DAYS".
// `locked` draws an outline only (a badge still to earn).
//   <Badge id="d7" size={96} />   or   <Badge badge={badgeInfo("d7")} locked />
import { badgeInfo } from "../lib/streaks.js";

// Star-edged seal outline: 24 points between radius 49 and 44.
const POINTS = Array.from({ length: 48 }, (_, i) => {
  const r = i % 2 ? 44 : 49;
  const a = (Math.PI * i) / 24 - Math.PI / 2;
  return `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`;
}).join(" ");

export default function Badge({ id, badge = badgeInfo(id), size = 64, locked = false }) {
  const digits = String(badge.num).length;
  return (
    <svg className={`badge-seal ${locked ? "locked" : ""}`} width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${badge.name}${locked ? " (not yet earned)" : ""}`}>
      <polygon points={POINTS} className="seal-edge" />
      <circle cx="50" cy="50" r="36" className="seal-face" />
      <circle cx="50" cy="50" r="31" className="seal-inner" />
      <text x="50" y={digits > 1 ? 53 : 54} className="seal-num" fontSize={digits > 1 ? 28 : 34}>{badge.num}</text>
      <text x="50" y="71" className="seal-unit">{badge.unit.toUpperCase()}</text>
    </svg>
  );
}
