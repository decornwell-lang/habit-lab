// "Before you begin" worksheets, one per habit: keeping a diary (instructions for their
// own journal), then their life story (prompts). Shown in the app (WorksheetButton.jsx)
// and made into the downloadable PDFs by scripts/make-worksheets.mjs:
//   node scripts/make-worksheets.mjs
// Plain text only (no curly quotes or long dashes), so the PDFs print correctly.

const JOURNAL =
  "Buy a notebook or journal that you keep just for this programme. Start writing in it today, every day until your cohort begins, and keep going through the 33 days. You don't need to change anything yet: just notice, and write it down. Nobody else needs to read it.";

const STORY_INTRO =
  "Take your time with these. Write in your journal over a few days, as much or as little as feels right. There are no right answers: just be honest with yourself.";

export const WORKSHEETS = {
  smoking: {
    name: "Smoking",
    journal: JOURNAL,
    eachTime: {
      heading: "Each time you smoke, write down:",
      items: [
        "The time, and where you are.",
        "Whether you are alone, or who you are with.",
        "What you were doing just before.",
        "How you felt just before: stressed, bored, tired, anxious, restless, happy.",
        "How strong the urge was, from 0 to 5.",
        "Whether this cigarette would be easy or hard to skip.",
      ],
    },
    endOfDay: {
      heading: "At the end of each day, write a few lines:",
      items: [
        "How many cigarettes did I smoke today?",
        "Which ones could I have let go of? Which felt hardest to skip, and why?",
        "What emotions sat underneath my smoking today?",
        "How did I feel while I was smoking, and afterwards?",
        "One thing I noticed about myself today.",
      ],
    },
    story: [
      "When did you smoke your first cigarette? How old were you, where were you, and who were you with?",
      "What was happening in your life at that time?",
      "How long have you smoked? How has it changed over the years: times you smoked more, less, or stopped for a while?",
      "What do you smoke now (cigarettes, roll-ups, vapes, cigars), how much, and when?",
      "What is smoking a replacement for? What does it give you that you don't get another way: a break, comfort, company, calm, a reward, time to yourself?",
      "Which emotions most often lead you to smoke: stress, boredom, loneliness, anger, sadness, celebration?",
      "Who in your family smoked, or smokes? What did you learn about smoking growing up?",
      "What have you tried before to stop, and what did you learn from it?",
      "What does smoking cost you: your health, money, energy, relationships, how you feel about yourself?",
      "What has brought you to this group, now?",
      "Who are you becoming? Describe a day in your life as someone who no longer smokes.",
    ],
  },
  alcohol: {
    name: "Alcohol",
    journal: JOURNAL,
    eachTime: {
      heading: "Each time you have a drink, write down:",
      items: [
        "The time, and where you are.",
        "What you are drinking, and how much.",
        "Whether you are alone, or who you are with.",
        "What you were doing just before.",
        "How you felt just before: stressed, tired, lonely, anxious, celebrating.",
        "How strong the urge was, from 0 to 5, and whether this drink would be easy or hard to skip.",
      ],
    },
    endOfDay: {
      heading: "At the end of each day, write a few lines:",
      items: [
        "How many drinks did I have today?",
        "Which ones could I have let go of? Which felt hardest to skip, and why?",
        "What emotions sat underneath my drinking today?",
        "How did I feel while drinking, later that night, and the next morning?",
        "One thing I noticed about myself today.",
      ],
    },
    story: [
      "When did you have your first drink? How old were you, where were you, and who were you with?",
      "What was happening in your life at that time?",
      "How long have you been drinking regularly? How has it changed over the years: times you drank more, less, or stopped for a while?",
      "What do you drink now, how much, and when: after work, at weekends, with food, alone?",
      "What is alcohol a replacement for? What does it give you that you don't get another way: relaxation, confidence, connection, escape, sleep, a reward?",
      "Which emotions most often lead you to drink: stress, boredom, loneliness, anxiety, anger, sadness, celebration?",
      "Who in your family drank, or drinks? What did you learn about alcohol growing up?",
      "What have you tried before to stop or cut down, and what did you learn from it?",
      "What does alcohol cost you: your health, sleep, money, mornings, relationships, how you feel about yourself?",
      "What has brought you to this group, now?",
      "Who are you becoming? Describe a day in your life living alcohol-free.",
    ],
  },
  gambling: {
    name: "Gambling",
    journal: JOURNAL,
    eachTime: {
      heading: "Each time you gamble, or feel a strong urge to, write down:",
      items: [
        "The time, and where you are (an app, a website, a venue).",
        "What you bet on, and how much.",
        "Whether you are alone, or who you are with.",
        "What you were doing just before.",
        "How you felt just before: stressed, bored, lonely, hopeful, under pressure about money.",
        "How strong the urge was, from 0 to 5, and whether you acted on it.",
      ],
    },
    endOfDay: {
      heading: "At the end of each day, write a few lines:",
      items: [
        "How much time and money did I spend gambling today?",
        "Which urges did I let pass? Which felt hardest to resist, and why?",
        "What emotions sat underneath my gambling today?",
        "How did I feel after winning, and after losing?",
        "One thing I noticed about myself today.",
      ],
    },
    story: [
      "When did you first gamble? How old were you, where were you, and who were you with?",
      "What was happening in your life at that time?",
      "How long have you gambled? How has it changed over the years: times you gambled more, less, or stopped for a while?",
      "What do you gamble on now (sport, casino apps, slots, cards, lottery, trading), how often, and how much?",
      "What is gambling a replacement for? What does it give you that you don't get another way: excitement, escape, hope, belonging, a sense of control?",
      "Which emotions most often lead you to gamble: stress, boredom, loneliness, worry about money, anger, sadness?",
      "Who in your family gambled, or gambles? What did you learn about money and risk growing up?",
      "What have you tried before to stop or cut down, and what did you learn from it?",
      "What does gambling cost you: money, debt, time, sleep, relationships, trust, how you feel about yourself?",
      "What has brought you to this group, now?",
      "Who are you becoming? Describe a day in your life free of gambling.",
    ],
  },
  exercise: {
    name: "Fitness",
    journal: JOURNAL,
    eachTime: {
      heading: "Each time you move, and after long stretches of sitting, write down:",
      items: [
        "The time, and what you did (or how long you sat).",
        "How long it lasted.",
        "Whether you were alone, or who you were with.",
        "Your energy and mood before, and after.",
        "What helped you move, or what got in the way.",
      ],
    },
    endOfDay: {
      heading: "At the end of each day, write a few lines:",
      items: [
        "How much did I move today? How long did I sit for?",
        "What got in the way of moving? What made it easier?",
        "How did I feel in my body today, and about my body?",
        "What emotions came up around exercise?",
        "One thing I noticed about myself today.",
      ],
    },
    story: [
      "What are your earliest memories of moving your body: sport, play, dance, walking? How did it feel?",
      "When did being active become harder, or stop? What was happening in your life at that time?",
      "How has your relationship with exercise and your body changed over the years?",
      "What does a typical week of movement look like for you now?",
      "What does not moving give you? Rest, comfort, avoiding something, time for other things?",
      "Which emotions get in the way of moving: tiredness, low mood, self-consciousness, stress, overwhelm?",
      "What did you learn about exercise and bodies growing up, from family, school or friends?",
      "What have you tried before to get fitter, and what did you learn from it? What worked, even for a while?",
      "What does staying inactive cost you: energy, health, sleep, mood, confidence?",
      "What has brought you to this group, now?",
      "Who are you becoming? Describe a day in your life as someone who moves every day.",
    ],
  },
  default: {
    name: "Your habit",
    journal: JOURNAL,
    eachTime: {
      heading: "Each time the habit shows up, write down:",
      items: [
        "The time, and where you are.",
        "Whether you are alone, or who you are with.",
        "What you were doing just before.",
        "How you felt just before.",
        "How strong the urge was, from 0 to 5.",
      ],
    },
    endOfDay: {
      heading: "At the end of each day, write a few lines:",
      items: [
        "What did I notice about my habit today?",
        "What made it easier? What made it harder?",
        "What emotions sat underneath it today?",
        "One thing I noticed about myself today.",
      ],
    },
    story: [
      "When did this habit first start? How old were you, and what was happening in your life at that time?",
      "How has it changed over the years: times it was stronger, weaker, or stopped?",
      "What is the habit a replacement for? What does it give you that you don't get another way?",
      "Which emotions most often lead you to it?",
      "What did you learn about this growing up?",
      "What have you tried before, and what did you learn from it?",
      "What does it cost you?",
      "What has brought you to this group, now?",
      "Who are you becoming? Describe a day in your life as that person.",
    ],
  },
};

export const STORY_HEADING = "My life story";
export const STORY_TEXT = STORY_INTRO;
export const DIARY_HEADING = "Keeping a diary";

const PDF_HABITS = ["smoking", "alcohol", "gambling", "exercise"];
export const worksheetFor = (habitType) => WORKSHEETS[habitType] || WORKSHEETS.default;
export const worksheetPdf = (habitType) => `/assets/before-you-begin-${PDF_HABITS.includes(habitType) ? habitType : "default"}.pdf`;
