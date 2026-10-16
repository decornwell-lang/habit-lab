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

// Shown before paying for a cohort (Upcoming → Join). Have this checked against your
// terms; members must tick the box to continue to payment.
export const JOIN_TERMS = {
  price: "VAT included",
  cancel:
    "You can cancel within 14 days of paying for a full refund. If the cohort starts within those 14 days, you're asking for it to begin straight away; if you cancel after it has started, you'll be refunded for the days still to come.",
  agree: "I've read this and want my place.",
};
