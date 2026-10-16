// Creates the "Before you begin" worksheets in public/assets: a life story and a daily
// diary for each habit, to print or keep in a notebook. Run:  node scripts/make-worksheets.mjs
// Edit the questions below, run it again, then push. (Plain text only: no curly quotes.)
import { writeFileSync } from "node:fs";
import { makePdf } from "./pdf-writer.mjs";

const OUT = new URL("../public/assets/", import.meta.url);
const DIARY_DAYS = 7;

const WORKSHEETS = {
  smoking: {
    name: "Smoking",
    story: [
      "When did you smoke your first cigarette? How old were you, and what was happening in your life at the time?",
      "Why did you start? Who was around you, and what did smoking give you then?",
      "How has your smoking changed over the years? Think of times you smoked more, less, or stopped for a while.",
      "What have you tried before to stop or cut down, and what did you learn from it?",
      "What does smoking give you now? And what does it cost you: your health, money, relationships, how you feel about yourself?",
      "What has brought you to this group, now?",
      "Who are you becoming? Describe yourself as someone who no longer smokes.",
    ],
    diaryIntro: "Keep this diary every day until the cohort begins, and keep going as you go through the programme. You don't need to change anything yet: just notice. Write one line for each cigarette.",
    columns: [["Time", 50], ["Where", 80], ["Alone, or with whom?", 95], ["How I felt just before", 140], ["Easy or hard to skip?", 120]],
    dayQuestions: [
      "How many cigarettes did I smoke today?",
      "Which ones could I cut out completely? Which feel very hard to let go of, and why?",
      "Did I smoke more alone or with others? Socially, after meals, with coffee, when stressed or bored?",
      "What emotions sat underneath my smoking today? How did I feel while I was smoking, and afterwards?",
    ],
  },
  alcohol: {
    name: "Alcohol",
    story: [
      "When did you have your first drink? How old were you, and what was happening in your life at the time?",
      "Why did you start drinking? Who was around you, and what did alcohol give you then?",
      "How has your drinking changed over the years? Think of times you drank more, less, or stopped for a while.",
      "What have you tried before to stop or cut down, and what did you learn from it?",
      "What does alcohol give you now? And what does it cost you: your health, sleep, money, relationships, how you feel about yourself?",
      "What has brought you to this group, now?",
      "Who are you becoming? Describe yourself living alcohol-free.",
    ],
    diaryIntro: "Keep this diary every day until the cohort begins, and keep going as you go through the programme. You don't need to change anything yet: just notice. Write one line for each drink.",
    columns: [["Time", 45], ["Drink and amount", 85], ["Where", 70], ["Alone, or with whom?", 85], ["How I felt just before", 100], ["Easy or hard to skip?", 100]],
    dayQuestions: [
      "How many drinks did I have today?",
      "Which ones could I cut out completely? Which feel very hard to let go of, and why?",
      "Did I drink more alone or with others? Socially, after work, with food, at weekends, when stressed or tired?",
      "What emotions sat underneath my drinking today? How did I feel while drinking, and afterwards?",
    ],
  },
  gambling: {
    name: "Gambling",
    story: [
      "When did you first gamble? How old were you, and what was happening in your life at the time?",
      "Why did you start? Who was around you, and what did gambling give you then: excitement, escape, hope, belonging?",
      "How has your gambling changed over the years? Think of times you gambled more, less, or stopped for a while, and what you gambled on.",
      "What have you tried before to stop or cut down, and what did you learn from it?",
      "What does gambling give you now? And what does it cost you: money, debt, time, sleep, relationships, trust, how you feel about yourself?",
      "What has brought you to this group, now?",
      "Who are you becoming? Describe yourself living free of gambling.",
    ],
    diaryIntro: "Keep this diary every day until the cohort begins, and keep going as you go through the programme. You don't need to change anything yet: just notice. Write one line for each time you gambled, and for each strong urge, even if you didn't act on it.",
    columns: [["Time", 45], ["What I bet on, and how much", 105], ["Where (app, venue)", 75], ["Alone, or with whom?", 80], ["How I felt just before", 90], ["Urge 0 to 10", 90]],
    dayQuestions: [
      "How much time and money did I spend gambling today?",
      "Which urges could I let pass? Which felt very hard to resist, and why?",
      "When did the urges come: alone, late at night, after payday, during sport, on my phone, when stressed or bored?",
      "What emotions sat underneath my gambling today? How did I feel after winning, and after losing?",
    ],
  },
  exercise: {
    name: "Fitness",
    story: [
      "What are your earliest memories of moving your body: sport, play, dance, walking? How did it feel?",
      "When did being active become harder, or stop? What was happening in your life at the time?",
      "How has your relationship with exercise and your body changed over the years?",
      "What have you tried before to get fitter, and what did you learn from it? What worked, even for a while?",
      "What gets in the way of moving now: time, energy, motivation, how you feel about your body, something else?",
      "What has brought you to this group, now?",
      "Who are you becoming? Describe yourself as someone who moves every day.",
    ],
    diaryIntro: "Keep this diary every day until the cohort begins, and keep going as you go through the programme. You don't need to change anything yet: just notice. Write one line for each time you moved, and for long stretches of sitting.",
    columns: [["Time", 50], ["What I did (or sitting)", 110], ["How long", 55], ["Alone, or with whom?", 95], ["Energy and mood before, then after", 175]],
    dayQuestions: [
      "How much did I move today? How long did I sit for?",
      "What got in the way of moving? What made it easier?",
      "When did I feel most like moving? When least? Alone or with others, morning or evening?",
      "How did I feel in my body today, and about my body? What emotions came up around exercise?",
    ],
  },
  default: {
    name: "Your habit",
    story: [
      "When did this habit first start? What was happening in your life at the time?",
      "Why did it start? What did it give you back then?",
      "How has it changed over the years? Think of times it was stronger, weaker, or stopped.",
      "What have you tried before, and what did you learn from it?",
      "What does it give you now? And what does it cost you?",
      "What has brought you to this group, now?",
      "Who are you becoming? Describe that person in a few sentences.",
    ],
    diaryIntro: "Keep this diary every day until the cohort begins, and keep going as you go through the programme. You don't need to change anything yet: just notice.",
    columns: [["Time", 50], ["What happened", 120], ["Where", 75], ["Alone, or with whom?", 95], ["How I felt", 145]],
    dayQuestions: [
      "What did I notice about my habit today?",
      "What made it easier? What made it harder?",
      "Were there patterns: times of day, places, people, moods?",
      "What emotions sat underneath it today?",
    ],
  },
};

for (const [id, w] of Object.entries(WORKSHEETS)) {
  const blocks = [
    { title: "Before you begin" },
    { subtitle: `${w.name}: my story and my diary` },
    { text: "Two parts to work on before your cohort begins: your story, and a daily diary. Print these pages, or copy the questions into a notebook that you keep for the whole programme. Write as much or as little as you like. Nothing needs to be shared." },
    { heading: "Part 1: My story" },
    ...w.story.map((question) => ({ question, lines: 5 })),
    { pageBreak: true },
    { heading: "Part 2: My diary" },
    { text: w.diaryIntro },
  ];
  for (let d = 1; d <= DIARY_DAYS; d++) {
    if (d > 1) blocks.push({ pageBreak: true });
    blocks.push({ heading: `Day ${d}      Date: ______________` });
    blocks.push({ table: { columns: w.columns, rows: 9 } });
    w.dayQuestions.forEach((question) => blocks.push({ question, lines: 2 }));
  }
  blocks.push({ text: "Need more days? Print the diary pages again, or carry on in your notebook." });
  writeFileSync(new URL(`before-you-begin-${id}.pdf`, OUT), makePdf(blocks));
}
console.log("Worksheets written to public/assets/before-you-begin-*.pdf");
