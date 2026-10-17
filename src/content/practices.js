// The practice library (Practices → Library): one practice for each length, 3 to 20 minutes.
// These are the starting entries; Admin → Practices edits them (title, description, audio
// link, picture, published) and saves them to the database, which then takes precedence.
// With no audio link yet, a practice shows "Coming soon" in place of the player.
export const DEFAULT_PRACTICES = [
  { id: "p3", title: "Arriving", durationMinutes: 3, description: "A short pause to arrive in your body and your breath.", audioUrl: null, thumbnailUrl: null, tab: "library", published: true },
  { id: "p5", title: "Breathing space", durationMinutes: 5, description: "Notice, gather, widen: a reset for any moment of the day.", audioUrl: null, thumbnailUrl: null, tab: "library", published: true },
  { id: "p10", title: "Riding the urge", durationMinutes: 10, description: "Meeting a craving with curiosity, letting it rise and pass.", audioUrl: null, thumbnailUrl: null, tab: "library", published: true },
  { id: "p15", title: "Body scan", durationMinutes: 15, description: "Resting attention through the body, from feet to head.", audioUrl: null, thumbnailUrl: null, tab: "library", published: true },
  { id: "p20", title: "Sitting practice", durationMinutes: 20, description: "A longer sit: breath, body, sounds and thoughts.", audioUrl: null, thumbnailUrl: null, tab: "library", published: true },
];
