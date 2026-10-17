// Creates the "Before you begin" worksheets in public/assets, one per habit: page 1,
// keeping a diary (what to write in their own journal); page 2, their life story (prompts).
// The wording is in src/content/worksheets.js (also shown in the app). Run:
//   node scripts/make-worksheets.mjs
// then push.
import { writeFileSync } from "node:fs";
import { makePdf } from "./pdf-writer.mjs";
import { WORKSHEETS, DIARY_HEADING, STORY_HEADING, STORY_TEXT } from "../src/content/worksheets.js";

const OUT = new URL("../public/assets/", import.meta.url);

for (const [id, w] of Object.entries(WORKSHEETS)) {
  const blocks = [
    { title: "Before you begin" },
    { subtitle: `${w.name}: my diary and my life story` },
    { heading: DIARY_HEADING },
    { text: w.journal },
    { heading: w.eachTime.heading },
    ...w.eachTime.items.map((bullet) => ({ bullet })),
    { text: " " },
    { heading: w.endOfDay.heading },
    ...w.endOfDay.items.map((bullet) => ({ bullet })),
    { pageBreak: true },
    { heading: STORY_HEADING },
    { text: STORY_TEXT },
    ...w.story.map((question) => ({ question, lines: 0 })),
  ];
  writeFileSync(new URL(`before-you-begin-${id}.pdf`, OUT), makePdf(blocks));
}
console.log("Worksheets written to public/assets/before-you-begin-*.pdf");
