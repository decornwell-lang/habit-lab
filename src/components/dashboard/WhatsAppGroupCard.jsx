// Home: the cohort's WhatsApp group, as its own clear card. Before the cohort starts the
// button is greyed out ("Opens on 16 November"); from the start date it opens the group,
// with the suggestion to form small pods. The link is set in Admin → Cohorts.
// Once they tap "Join the WhatsApp group", the card goes away (saved on their membership
// as whatsappJoined).
import { useState } from "react";
import { formatDate } from "../../lib/dates.js";
import { updateMembership } from "../../lib/data.js";
import { GROUP_PODS } from "../../content/site.js";
import WhatsAppIcon from "../WhatsAppIcon.jsx";

export default function WhatsAppGroupCard({ uid, current }) {
  const { cohort, progress, membership } = current;
  const [joined, setJoined] = useState(false);
  if (progress.state === "finished" || joined || membership?.whatsappJoined) return null;
  const upcoming = progress.state === "upcoming";
  const link = cohort.whatsappGroupLink;
  const day = formatDate(progress.start, { weekday: undefined, year: undefined });

  return (
    <section className="card whatsapp-card">
      <div className="whatsapp-head">
        <span className="whatsapp-logo" aria-hidden="true"><WhatsAppIcon /></span>
        <div>
          <h2>Your cohort's WhatsApp group</h2>
          <p className="muted small">
            {upcoming ? `Opens on ${day}, the day your cohort begins.` : "Share your days and support each other."}
          </p>
        </div>
      </div>
      {upcoming || !link ? (
        <button type="button" className="btn btn-whatsapp" disabled>
          <WhatsAppIcon /> {upcoming ? `Opens on ${day}` : "The link will be here soon"}
        </button>
      ) : (
        <>
          <a className="btn btn-whatsapp" href={link} target="_blank" rel="noreferrer"
            onClick={() => {
              updateMembership(uid, cohort.id, { whatsappJoined: true }).catch(console.error);
              setTimeout(() => setJoined(true), 500); // after WhatsApp has opened
            }}><WhatsAppIcon /> Join the WhatsApp group</a>
          <p className="muted small group-pods">{GROUP_PODS}</p>
        </>
      )}
    </section>
  );
}
