// Avatar: shows a member's photo if they uploaded one, otherwise their chosen avatar, or
// their first initial if neither.
import { avatarById } from "../content/avatars.js";

export default function Avatar({ id, photo, name = "", size = 44 }) {
  if (photo) return <img className="avatar avatar-photo" src={photo} alt="" width={size} height={size} />;
  const avatar = avatarById(id);
  const style = { width: size, height: size, fontSize: size * 0.5, background: avatar?.bg };
  return (
    <span className={`avatar ${avatar ? "" : "avatar-initial"}`} style={style} aria-hidden="true">
      {avatar ? avatar.emoji : (name[0] || "?").toUpperCase()}
    </span>
  );
}
