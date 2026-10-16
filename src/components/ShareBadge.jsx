// ShareBadge: shares a badge on social media (see ShareCard for how sharing works).
import { badgeInfo } from "../lib/streaks.js";
import { badgeHeadline } from "../lib/shareImage.js";
import ShareCard from "./ShareCard.jsx";

// label is the challenge, e.g. "smoke-free": "I earned a 7-day smoke-free badge".
export default function ShareBadge({ badgeId, label }) {
  const badge = badgeInfo(badgeId);
  return (
    <ShareCard
      image={{ badge, label }}
      text={`${badgeHeadline(badge, label)} with The Habit Lab by David Ernest Cornwell 🏅`}
      fileName={`habit-lab-${badge.id}.png`}
    />
  );
}
