// ShareBadge: shares a badge on social media (see ShareCard for how sharing works).
import { badgeInfo } from "../lib/streaks.js";
import ShareCard from "./ShareCard.jsx";

// label is the challenge shown under the medal, e.g. "smoke-free".
export default function ShareBadge({ badgeId, label = "The Habit Lab" }) {
  const badge = badgeInfo(badgeId);
  return (
    <ShareCard
      image={{ badge, label }}
      text={`I just earned my ${badge.name} at The Habit Lab with David Ernest Cornwell 🏅`}
      fileName={`habit-lab-${badge.id}.png`}
    />
  );
}
