// How a member appears to other members (the leaderboard): the name they choose and their
// picture (an avatar or their own photo). Surname and email are never shared unless the
// member chooses "First name and surname".
export const NAME_CHOICES = [
  { id: "first", label: "First name" },
  { id: "full", label: "First name and surname" },
  { id: "nickname", label: "A nickname" },
];

// The name others see, from the member's private profile (users/{uid}).
export function publicName(profile) {
  const first = profile?.firstName?.trim() || "Member";
  if (profile?.nameChoice === "full" && profile.surname?.trim()) return `${first} ${profile.surname.trim()}`;
  if (profile?.nameChoice === "nickname" && profile.nickname?.trim()) return profile.nickname.trim();
  return first;
}

// The fields copied to the public profile (publicProfiles/{uid}).
export const publicIdentity = (profile) => ({ name: publicName(profile), avatar: profile?.avatar || null, photo: profile?.photo || null });

// Turns an uploaded image into a small square JPEG (centre-cropped), as a data URL of a
// few kilobytes, small enough to keep with the profile.
export function squarePhoto(file, size = 160) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      canvas.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That image couldn't be opened. Try a JPEG or PNG photo."));
    };
    img.src = url;
  });
}
