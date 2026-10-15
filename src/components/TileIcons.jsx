// Icons for the Home tiles: a lock (not open yet) and a pencil (ready to fill in).
// Drawn as SVG so they can take the brand colours (see .fold-icon.locked / .ready).
export function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2.5" fill="currentColor" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function PencilIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5 4 20z" fill="currentColor" />
      <path d="M13.5 7l3 3" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.4" />
    </svg>
  );
}
