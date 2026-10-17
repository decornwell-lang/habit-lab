// Creates the weekly reflection PDFs in public/assets/reflections. Run with:  node scripts/make-pdfs.mjs
// (The before-you-begin worksheets are made by scripts/make-worksheets.mjs.)
// To use your own PDFs instead, just replace the files in public/assets
// (keep the same names), or paste links in Admin → Content.
import { writeFileSync, mkdirSync } from "node:fs";

const OUT = new URL("../public/assets/", import.meta.url);

const weeks = [
  ["Foundations", "Intention, identity and triggers", [
    "What is your intention for this cohort, in one sentence?",
    "What kind of person do you want to be in relation to this habit?",
    "List your three strongest triggers. What usually happens just before each one?",
    "What small change to your surroundings could make this week easier?",
  ]],
  ["Urges", "Noticing cravings in the body, and urge surfing", [
    "Describe a craving from this week as if it were weather. How did it arrive, peak and pass?",
    "Where in your body do urges show up first?",
    "What happened when you breathed with an urge instead of acting on it?",
    "What helps you ride the wave? What makes it harder?",
  ]],
  ["Identity and lapses", "What a slip teaches, and returning to practice", [
    "If you slipped this week, what was happening just before? If not, when did you come closest?",
    "How do you usually speak to yourself after a slip? How would you speak to a friend?",
    "What does returning to practice look like for you, in practical terms?",
    "What is one thing a lapse has taught you about your triggers?",
  ]],
  ["Consolidation", "What has changed, and what is sticking", [
    "What feels different now compared with the first week?",
    "Which practices are sticking? Why do you think they are?",
    "Where do you still feel vulnerable?",
    "What support would help you keep going after the cohort ends?",
  ]],
  ["Integration", "A final reflection, overlap and integration", [
    "Looking back over the whole cohort, what are you most proud of?",
    "What did the breathing practice teach you about urges?",
    "What will you carry forward? Write three commitments for the next month.",
    "Write a short note to yourself to read on a difficult day.",
  ]],
];

// ---- A tiny PDF writer (plain text, A4, Helvetica) ----
function wrap(text, max) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if ((line + " " + word).trim().length > max) {
      lines.push(line);
      line = word;
    } else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines;
}

function makePdf({ title, subtitle, intro, questions }) {
  const esc = (s) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const items = [
    { text: title, font: "F2", size: 22, gap: 30 },
    ...(subtitle ? [{ text: subtitle, font: "F1", size: 12, gap: 24 }] : []),
    ...wrap(intro, 85).map((t, i, a) => ({ text: t, font: "F1", size: 11, gap: i === a.length - 1 ? 30 : 16 })),
  ];
  questions.forEach((q, i) => {
    wrap(`${i + 1}. ${q}`, 80).forEach((t, j, a) => items.push({ text: t, font: "F2", size: 11, gap: j === a.length - 1 ? 18 : 15 }));
    for (let k = 0; k < 5; k++) items.push({ rule: true, gap: 22 });
    items.push({ space: true, gap: 10 });
  });
  items.push({ text: "The Habit Lab  ·  David Ernest Cornwell  ·  Placeholder: replace with your own version", font: "F1", size: 8, gap: 0 });

  // Lay out pages
  const pages = [[]];
  let y = 780;
  for (const it of items) {
    if (y < 70) { pages.push([]); y = 780; }
    if (it.rule) pages.at(-1).push(`0.85 0.83 0.8 RG 60 ${y} m 535 ${y} l S`);
    else if (it.text) pages.at(-1).push(`BT /${it.font} ${it.size} Tf 60 ${y} Td (${esc(it.text)}) Tj ET`);
    y -= it.gap;
  }

  const objects = [];
  const add = (body) => objects.push(body) && objects.length;
  const catalog = add(null), pagesObj = add(null);
  const f1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const f2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const kids = pages.map((ops) => {
    const stream = "0.18 0.23 0.25 rg\n" + ops.join("\n");
    const content = add(`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);
    return add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${content} 0 R >>`);
  });
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
  objects[pagesObj - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`;

  let out = "%PDF-1.4\n";
  const offsets = objects.map((body, i) => {
    const offset = Buffer.byteLength(out, "latin1");
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xref = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

mkdirSync(new URL("reflections/", OUT), { recursive: true });
weeks.forEach(([theme, focus, questions], i) => {
  writeFileSync(
    new URL(`reflections/week-${i + 1}.pdf`, OUT),
    makePdf({
      title: `Week ${i + 1}: ${theme}`,
      subtitle: focus,
      intro: "Work through this on your own, and bring what came up to Monday's live session.",
      questions,
    })
  );
});
console.log("PDFs written to public/assets");
