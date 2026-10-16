// "How others see you": a picture (avatar or own photo) and the name shown on the
// leaderboard. Used in My account and when joining the leaderboard. Controlled: `value`
// is { avatar, photo, nameChoice, nickname }; onChange gets the updated value.
import { useState } from "react";
import { AVATARS } from "../content/avatars.js";
import { NAME_CHOICES, squarePhoto, publicName } from "../lib/identity.js";
import Avatar from "./Avatar.jsx";

export default function AppearanceFields({ value, onChange, firstName, surname }) {
  const [error, setError] = useState("");
  const set = (patch) => onChange({ ...value, ...patch });

  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    try {
      set({ photo: await squarePhoto(file) });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="appearance">
      <h3>Your picture</h3>
      <div className="appearance-photo">
        <Avatar id={value.avatar} photo={value.photo} name={firstName} size={64} />
        <div>
          <label className="btn btn-ghost btn-small upload-btn">
            {value.photo ? "Change photo" : "Upload a photo"}
            <input type="file" accept="image/*" onChange={upload} hidden />
          </label>
          {value.photo && <button type="button" className="link-btn" onClick={() => set({ photo: null })}>Remove photo</button>}
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      {!value.photo && (
        <div className="avatar-grid" role="radiogroup" aria-label="Or choose an avatar">
          {AVATARS.map((a) => (
            <button type="button" key={a.id} role="radio" aria-checked={value.avatar === a.id} aria-label={a.id}
              className={value.avatar === a.id ? "selected" : ""} onClick={() => set({ avatar: a.id })}>
              <Avatar id={a.id} size={48} />
            </button>
          ))}
        </div>
      )}

      <h3>Your name on the leaderboard</h3>
      {NAME_CHOICES.map((c) => (
        <label key={c.id} className="checkbox">
          <input type="radio" name="nameChoice" checked={(value.nameChoice || "first") === c.id} onChange={() => set({ nameChoice: c.id })} />
          <span>{c.label}</span>
        </label>
      ))}
      {value.nameChoice === "nickname" && (
        <div className="field">
          <label htmlFor="nickname">Nickname</label>
          <input id="nickname" maxLength={24} value={value.nickname || ""} onChange={(e) => set({ nickname: e.target.value })} />
        </div>
      )}
      <p className="muted small">Others will see: <strong>{publicName({ firstName, surname, ...value })}</strong></p>
    </div>
  );
}
