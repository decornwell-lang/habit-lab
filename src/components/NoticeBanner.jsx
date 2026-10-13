// NoticeBanner: shows David's latest message as a banner at the top of every
// page, once. It disappears after a few seconds (or when tapped), and the
// member's profile remembers it was seen, so it never shows again on any device.
// Messages are written in Admin → Messages.
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { getNotices, getMemberships, updateUserProfile } from "../lib/data.js";

const SHOW_FOR_SECONDS = 10;
const IGNORE_OLDER_THAN_DAYS = 14;

export default function NoticeBanner() {
  const { user, profile } = useAuth();
  const [notice, setNotice] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef(null);

  function show(n) {
    setLeaving(false);
    setNotice(n);
    clearTimeout(timer.current);
    timer.current = setTimeout(dismiss, SHOW_FOR_SECONDS * 1000);
  }

  function dismiss() {
    setLeaving(true);
    setTimeout(() => setNotice(null), 300); // let the slide-out finish
  }

  // On log-in: find the newest message for this member that they haven't seen.
  useEffect(() => {
    if (!user || !profile) return;
    let cancelled = false;
    (async () => {
      try {
        const [notices, memberships] = await Promise.all([getNotices(10), getMemberships(user.uid)]);
        const mine = new Set(memberships.map((m) => m.cohortId));
        const cutoff = Date.now() - IGNORE_OLDER_THAN_DAYS * 86400000;
        const latest = notices.find((n) => (!n.cohortId || mine.has(n.cohortId)) && (n.createdAt?.toMillis?.() || 0) > cutoff);
        if (!cancelled && latest && latest.id !== profile.lastSeenNoticeId) {
          show(latest);
          updateUserProfile(user.uid, { lastSeenNoticeId: latest.id }).catch(() => {});
        }
      } catch {
        // No messages to show.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, Boolean(profile)]); // eslint-disable-line react-hooks/exhaustive-deps

  // A message that arrives while the app is open (see src/lib/push.js).
  useEffect(() => {
    const onLive = (e) => show(e.detail);
    window.addEventListener("habitlab:notice", onLive);
    return () => {
      window.removeEventListener("habitlab:notice", onLive);
      clearTimeout(timer.current);
    };
  }, []);

  if (!notice) return null;

  return (
    <div className={`notice-banner ${leaving ? "leaving" : ""}`} role="status" aria-live="polite" onClick={dismiss}>
      <div className="notice-banner-inner">
        <span className="notice-banner-from">Message from David</span>
        <strong>{notice.title}</strong>
        {notice.body && <span className="notice-banner-body">{notice.body}</span>}
      </div>
      <button className="notice-banner-close" aria-label="Close message" onClick={dismiss}>×</button>
    </div>
  );
}
