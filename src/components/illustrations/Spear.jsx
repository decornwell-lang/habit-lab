// The morning intention illustration: a simple spear, pointing up, in the brand colours.
// Replace this file to change the picture.
export default function Spear({ height = 150 }) {
  return (
    <svg className="spear" viewBox="0 0 40 200" height={height} aria-hidden="true">
      <path d="M20 4 L31 46 L20 38 L9 46 Z" fill="var(--gold)" />
      <path d="M20 38 L20 46" stroke="var(--gold)" strokeWidth="2" />
      <rect x="15" y="46" width="10" height="7" rx="2" fill="var(--aqua)" />
      <line x1="20" y1="53" x2="20" y2="196" stroke="var(--aqua)" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="16" y1="150" x2="24" y2="150" stroke="var(--aqua)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="16" y1="160" x2="24" y2="160" stroke="var(--aqua)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
