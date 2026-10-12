// The avatars members can choose from. Add, remove or change any of them.
export const AVATARS = [
  { id: "leaf", emoji: "🌿", bg: "#e3ece5" },
  { id: "wave", emoji: "🌊", bg: "#e1eaee" },
  { id: "mountain", emoji: "⛰️", bg: "#ece7df" },
  { id: "moon", emoji: "🌙", bg: "#e7e5ef" },
  { id: "sun", emoji: "☀️", bg: "#f6ead6" },
  { id: "blossom", emoji: "🌸", bg: "#f5e3e0" },
  { id: "tree", emoji: "🌳", bg: "#e0eadf" },
  { id: "bird", emoji: "🕊️", bg: "#e9ecee" },
  { id: "stone", emoji: "🪨", bg: "#e8e4de" },
  { id: "wheat", emoji: "🌾", bg: "#f2ebd9" },
  { id: "lotus", emoji: "🪷", bg: "#f3e2e6" },
  { id: "star", emoji: "⭐", bg: "#f5ecd5" },
];

export const avatarById = (id) => AVATARS.find((a) => a.id === id);
