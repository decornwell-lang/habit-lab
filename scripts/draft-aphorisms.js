// Drafts short aphorisms with Claude and adds them to data/aphorisms-drafts.json
// as "pending". Nothing here is shown to members: every line must be approved
// by the owner in Admin → Aphorisms first (see README → Aphorisms).
//
//   npm run draft-aphorisms               14 drafts, no theme
//   npm run draft-aphorisms -- 10 urges   10 drafts on "urges"
//
// Needs ANTHROPIC_API_KEY in the environment (or in .env.local). Never put the key in this file.
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";

const DRAFTS_FILE = path.resolve("data/aphorisms-drafts.json");
const MODEL = "claude-opus-5-5";

const INSTRUCTION =
  "Write short aphorisms, maximum 25 words each, to support someone changing an addictive or habitual pattern. " +
  "Use a secular, mindfulness-based tone, in plain English. Do not attribute any line to a real person or text. " +
  "Do not quote anyone. Do not give medical advice, promise outcomes, or suggest that anyone can stop a substance " +
  "without support. Return a JSON array of strings only.";

const count = Number.parseInt(process.argv[2] ?? "14", 10);
const theme = (process.argv[3] ?? "").trim();
if (!Number.isInteger(count) || count < 1 || count > 50) {
  console.error("The number of drafts must be between 1 and 50.");
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY isn't set. Add it to .env.local (see README → Aphorisms).");
  process.exit(1);
}

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

const request = `${count} aphorisms${theme ? ` on the theme: ${theme}` : ""}.`;
const response = await client.beta.messages.create({
  model: MODEL,
  max_tokens: 16000,
  output_config: { effort: "medium" },
  // If Claude's safety checks decline, the API retries on a suitable model in the same call.
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
  system: INSTRUCTION,
  messages: [{ role: "user", content: request }],
});

if (response.stop_reason === "refusal") {
  console.error("The request was declined:", response.stop_details?.explanation ?? "no reason given");
  process.exit(1);
}

const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
const lines = parseLines(text);
if (!lines.length) {
  console.error("Couldn't read any aphorisms from the reply:\n" + text);
  process.exit(1);
}

// Append only: existing drafts (pending, rejected or anything else) are never changed.
const existing = fs.existsSync(DRAFTS_FILE) ? JSON.parse(fs.readFileSync(DRAFTS_FILE, "utf8")) : [];
const created = new Date().toISOString();
const added = lines.map((line) => ({ id: randomUUID(), text: line, theme: theme || "general", status: "pending", created }));
fs.mkdirSync(path.dirname(DRAFTS_FILE), { recursive: true });
fs.writeFileSync(DRAFTS_FILE, JSON.stringify([...existing, ...added], null, 2) + "\n");

console.log(`Added ${added.length} pending drafts${theme ? ` (theme: ${theme})` : ""} to data/aphorisms-drafts.json:\n`);
for (const a of added) console.log(`  • ${a.text}`);
console.log("\nReview them in Admin → Aphorisms (run `npm run dev`, then open http://localhost:5173/admin).");

// The reply should be a JSON array of strings; tolerate text around it.
function parseLines(reply) {
  const match = reply.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed)
      ? parsed.filter((s) => typeof s === "string").map((s) => s.trim()).filter((s) => s && s.split(/\s+/).length <= 25)
      : [];
  } catch {
    return [];
  }
}
