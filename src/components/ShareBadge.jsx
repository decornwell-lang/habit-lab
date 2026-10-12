// ShareBadge: shares a badge on social media (see ShareCard for how sharing works).
import { badgeInfo } from "../lib/streaks.js";
import ShareCard from "./ShareCard.jsx";

export default function ShareBadge({ badgeId }) {
  const badge = badgeInfo(badgeId);
  return (
    <ShareCard
      image={{ icon: badge.icon, title: badge.label, subtitle: "of practice" }}
      text={`I just earned my ${badge.label} badge at The Habit Lab with David Ernest Cornwell ${badge.icon}`}
      fileName={`habit-lab-${badge.id}.png`}
    />
  );
}
