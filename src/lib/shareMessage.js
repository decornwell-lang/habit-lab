// The WhatsApp message for the intention, evening review and craving screens:
//   "[First name] – [what it is]: [what they chose to include]"
// Only what the member ticked goes in: their text (on by default) and their score
// (off by default). Times and other answers are never included.
export function shareMessage({ firstName, label, text, score, includeText, includeScore }) {
  const parts = [];
  if (includeText && text?.trim()) parts.push(text.trim());
  if (includeScore && score) parts.push(score);
  if (!parts.length) return ""; // nothing chosen: nothing to share
  return `${firstName || "Me"} – ${label}: ${parts.join(" · ")}`;
}
