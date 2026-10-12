// Avatar: shows a member's chosen avatar, or their first initial if none.
import { avatarById } from "../content/avatars.js";

export default function Avatar({ id, name = "", size = 44 }) {
  const avatar = avatarById(id);
  const style = { width: size, height: size, fontSize: size * 0.5, background: avatar?.bg };
  return (
    <span className={`avatar ${avatar ? "" : "avatar-initial"}`} style={style} aria-hidden="true">
      {avatar ? avatar.emoji : (name[0] || "?").toUpperCase()}
    </span>
  );
}
