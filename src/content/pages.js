// Text for the public menu pages, taken from davidernestcornwell.com.
// Edit freely. Each section can have `links`: [{ label, href }].
export const pages = {
  about: {
    eyebrow: "About",
    title: "David Ernest Cornwell",
    photo: true,
    intro:
      "UKCP-registered psychotherapist working with people who are looking for depth and lasting change, with a particular focus on trauma, depression, addiction, and how stress lives in the body and nervous system.",
    sections: [
      {
        heading: "Approach",
        body:
          "David's work is a body-centred talking therapy that brings together mindfulness, somatic awareness and evidence-based methods, including Mindfulness-Based Cognitive Therapy (MBCT), Somatic Experiencing, EMDR and body-centred psychotherapy. The aim is to help the nervous system settle, to process what has been left unresolved, and to build lasting resilience.",
      },
      {
        heading: "Training",
        list: [
          "Master's-level training in Mindfulness-Based Cognitive Therapy, University of Oxford",
          "UKCP-accredited psychotherapist (Core Process Psychotherapy)",
          "Two postgraduate degrees in mindfulness-based psychotherapy",
          "Somatic Experiencing practitioner",
          "EMDR practitioner",
        ],
      },
      {
        heading: "Experience",
        list: [
          "Over twenty years working with addiction, trauma, embodiment and mindfulness",
          "Founder of Cihangir Yoga, Istanbul (2006)",
          "Co-Director, Mindfulness Centre, American Hospital Istanbul",
          "Psychotherapist in private practice, Mallorca (since 2015)",
          "Psychotherapist, The Balance Luxury Rehab, Mallorca (2023–2026)",
          "Intensive, high-frequency therapy in residential and discreet treatment settings",
        ],
      },
      {
        heading: "Who David works with",
        body:
          "Individuals seeking depth and lasting change, including people living under heavy pressure, responsibility or public visibility: entrepreneurs, artists, athletes, executives and public figures. Work is confidential and personalised.",
      },
    ],
  },

  habitLab: {
    eyebrow: "The Habit Lab",
    title: "Let go of old patterns. A new self emerges.",
    intro:
      "The Habit Lab is a supportive group where you choose one habit, behaviour or addiction and commit to changing it, one day at a time, alongside others doing the same.",
    sections: [
      {
        heading: "How it works",
        list: [
          "Choose one habit to build or one pattern to let go of.",
          "Practise every day, with a short daily check-in in the app.",
          "Each week, practise the same 15-minute mindfulness of breathing meditation as everyone else.",
          "Meet the group with David on Zoom every Monday.",
          "Share the journey with your cohort in a WhatsApp group.",
        ],
      },
      {
        heading: "Why it takes time",
        body:
          "Research from University College London found that forming a new habit takes anywhere from 18 to 254 days, with an average of about 66. Some changes, such as giving up alcohol, may need a longer commitment. A missed day doesn't undo your progress: every return is part of the practice.",
      },
      {
        heading: "What people work on",
        body:
          "Giving up tobacco or alcohol, walking in nature, exercise, breathwork or meditation, learning a language or a new sport, writing a book, managing finances: any habit that matters to you.",
      },
      {
        heading: "A note on addiction",
        body:
          "The Habit Lab is a supportive community, not a treatment programme. If you are living with addiction, specialised therapeutic support may also be needed. David offers this through his psychotherapy practice.",
      },
    ],
  },

  contact: {
    eyebrow: "Contact",
    title: "Get in touch",
    intro: "Have questions? Send David a message. All enquiries are handled confidentially.",
    sections: [
      {
        heading: "WhatsApp",
        body: "+34 603 450 095",
        links: [{ label: "Message on WhatsApp", href: "https://wa.me/34603450095" }],
      },
      {
        heading: "Instagram",
        body: "@davidernestcornwell",
        links: [{ label: "Follow on Instagram", href: "https://www.instagram.com/davidernestcornwell/" }],
      },
      {
        heading: "Website",
        links: [{ label: "davidernestcornwell.com", href: "https://www.davidernestcornwell.com" }],
      },
    ],
  },

  offerings: {
    eyebrow: "Offerings",
    title: "Offerings & Retreats",
    intro:
      "Alongside The Habit Lab, David offers psychotherapy, psychological support, and intensive and residential programmes.",
    sections: [
      {
        heading: "Psychotherapy",
        body:
          "Embodied and body-centred psychotherapy, Somatic Experiencing, EMDR and mindfulness-based methods, within a careful, ethical and relational framework. In person in Mallorca, or securely online via Zoom. Occasional in-person work overseas can be arranged case by case.",
        list: [
          "Addiction: alcohol, substances and gambling",
          "Burnout, stress-related collapse, anxiety and depression",
          "Eating disorders and body-image distress",
          "Trauma, loss and relationship difficulties",
          "Existential and spiritual questions: meaning, life transitions, authenticity",
        ],
      },
      {
        heading: "Sessions and fees",
        list: [
          "Weekly or fortnightly therapy: €350 per 60-minute session",
          "Prepaid package of 10 sessions: €300 per session",
          "Intensive, bespoke work: several sessions a week, with flexible scheduling",
          "A small number of lower-fee places for people on ordinary incomes, for medium-term weekly work",
        ],
        links: [
          { label: "Enquire on WhatsApp", href: "https://wa.me/34603450095" },
          { label: "More about psychotherapy", href: "https://www.davidernestcornwell.com/psychotherapy" },
        ],
      },
      {
        heading: "Retreats",
        body: "Retreats, including a retreat focused on addiction, will be announced here.",
      },
    ],
  },

  // DRAFT: have this checked by a Spanish legal adviser before launch. Prices come from
  // config/pricing.json; update the wording here if they change.
  terms: {
    eyebrow: "Terms",
    title: "Terms and conditions",
    intro: "The Habit Lab is run by David Ernest Cornwell, Palma, Mallorca, Spain. By joining a cohort you agree to these terms. Last updated: October 2026.",
    noJoinCard: true,
    sections: [
      {
        heading: "What The Habit Lab is",
        body:
          "A wellbeing and habit-change programme: a 28-day (four-week) group cohort with daily check-ins in the app, weekly meditation and assignments, a live Zoom session each Monday and a WhatsApp group. It is a supportive community, not medical care, psychotherapy or a treatment programme, and it does not replace advice from your doctor.",
      },
      {
        heading: "Prices and payment",
        list: [
          "One cohort: €99 for 28 days of access, from the cohort's start date.",
          "Extend to one year: €99, for access until one year after the date you first joined. Available while your access is current.",
          "Another cohort: €99 for that cohort.",
          "All prices are in euros and include VAT (IVA at 21%), shown separately on your receipt.",
          "Payments are one-off, taken securely by Stripe. There are no subscriptions and nothing renews automatically.",
        ],
      },
      {
        heading: "Cancellation and refunds",
        body:
          "You can cancel within 14 days of paying and receive a full refund. If you'd like a refund, just send David a message. After a refund, your access for that purchase ends.",
      },
      {
        heading: "Your access",
        body:
          "While your access is current you can use the daily check-ins, meditations, assignments and live sessions for the cohorts you've joined. When it ends, you can still see your own history: your badges, streaks and past check-ins. Nothing is deleted. Members whose access has ended don't appear on the leaderboard.",
      },
      {
        heading: "Your health and safety",
        list: [
          "If you drink alcohol heavily or daily, stopping suddenly can be unsafe. Please speak to a doctor before you stop, and before an alcohol-free cohort begins.",
          "If you have a medical or mental health condition, check with your doctor before making changes.",
          "In an emergency, call 112 (Europe) or 999 (UK).",
        ],
      },
      {
        heading: "The group",
        list: [
          "Be kind and respectful to other members.",
          "What others share in the group and in sessions stays in the group.",
          "David may remove anyone who puts others at risk or ignores these terms.",
        ],
      },
      {
        heading: "Your data",
        list: [
          "Your account details are private. Other members see only your first name, avatar, streak and challenge (which you can hide), and only if you choose to appear on the leaderboard.",
          "Your written reflections are private. David can read them only if you agree to it, and you can change this in My account at any time.",
          "Payments are handled by Stripe; card details never reach The Habit Lab.",
          "To see or delete your data, send David a message.",
        ],
      },
      {
        heading: "Changes and law",
        body:
          "These terms may be updated; the date above shows the latest version. They are governed by Spanish law, without affecting any rights you have as a consumer where you live.",
      },
      {
        heading: "Contact",
        body: "WhatsApp +34 603 450 095",
        links: [{ label: "Message on WhatsApp", href: "https://wa.me/34603450095" }],
      },
    ],
  },
};
