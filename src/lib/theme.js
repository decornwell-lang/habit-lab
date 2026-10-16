// Light, dark or automatic (follows the phone): chosen in My account, saved with the
// member's profile (users/{uid}.theme) and on this device. Dark is the default.
// Applies to the app's tabs (Home, Practices, Upcoming); Breathe and the full-screen
// panels are always dark.
import { useEffect, useState } from "react";

export const THEMES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "auto", label: "Automatic" },
];
const KEY = "habitlab:theme";

export function savedTheme(profile) {
  if (profile?.theme) return profile.theme;
  try {
    return localStorage.getItem(KEY) || "dark";
  } catch {
    return "dark";
  }
}

export function rememberTheme(theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Not remembered on this device; the profile still has it.
  }
}

// true when the app should be dark right now.
export function useDark(profile) {
  const choice = savedTheme(profile);
  const query = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  const [phoneDark, setPhoneDark] = useState(() => Boolean(query?.matches));
  useEffect(() => {
    if (!query) return;
    const onChange = (e) => setPhoneDark(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [query]);
  return choice === "dark" || (choice === "auto" && phoneDark);
}
