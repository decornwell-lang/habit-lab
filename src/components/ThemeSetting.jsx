// My account → Appearance: Light, Dark or Automatic (follows the phone). Applies at once.
import { useState } from "react";
import { updateUserProfile } from "../lib/data.js";
import { THEMES, savedTheme, rememberTheme } from "../lib/theme.js";

export default function ThemeSetting({ uid, profile }) {
  const [theme, setTheme] = useState(() => savedTheme(profile));

  function choose(id) {
    setTheme(id);
    rememberTheme(id);
    updateUserProfile(uid, { theme: id }).catch(console.error); // follows the member to other devices
  }

  return (
    <section className="card">
      <h2>Appearance</h2>
      <div className="segmented theme-choices" role="radiogroup" aria-label="Appearance">
        {THEMES.map((t) => (
          <button type="button" key={t.id} role="radio" aria-checked={theme === t.id}
            className={theme === t.id ? "selected" : ""} onClick={() => choose(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="muted small">Automatic follows your phone's light or dark setting.</p>
    </section>
  );
}
