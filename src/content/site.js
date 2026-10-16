// Site text and images. Edit the wording here without touching the page code.
// To swap the photo: put your image in /public/images/ and change `photo` below
// (for example "/images/david.jpg").

export const site = {
  // The app is David Ernest Cornwell; The Habit Lab is one of its products.
  brandName: "David Ernest Cornwell",
  brandRole: "UKCP-registered psychotherapist",
  productName: "The Habit Lab",
  productTagline: "Let go of old patterns. A new self emerges.",
  logo: "/images/logo-dec.png",

  photo: "/images/david.jpg",
  photoAlt: "Portrait of David Ernest Cornwell",

  // Landing page
  intro:
    "Body-centred psychotherapy and mindfulness for lasting change.",
  productIntro:
    "Change one habit, together. Weekly meditation, daily check-ins, live sessions.",
  signUpTitle: "Join The Habit Lab",
  signUpSubtitle: "",
};

// Consent shown on sign-up and in My account (off by default). Without it, David sees
// only how many reflections a member has done, never their words.
export const REFLECTION_CONSENT = "I agree that my reflections can be seen by David for support purposes.";

// Shown before paying for a cohort (Upcoming → Join). Cancellation and refunds are
// covered in the Terms and conditions page (/terms, text in content/pages.js).
export const JOIN_TERMS = {
  price: "VAT included",
};

// Screens that can have an explainer video (Admin → Content → Explainer videos). The video
// icon only appears on a screen once its link is set.
export const EXPLAINERS = [
  { id: "home", label: "Home" },
  { id: "morning", label: "Morning check-in" },
  { id: "intention", label: "Intention" },
  { id: "evening", label: "Evening review" },
  { id: "breathe", label: "Breathe (choosing a practice)" },
  { id: "coherent", label: "Coherent breathing" },
  { id: "breathingSpace", label: "3-Step Breathing Space" },
  { id: "practices", label: "Practices" },
  { id: "upcoming", label: "Upcoming" },
];
