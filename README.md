# David Ernest Cornwell (web app, including The Habit Lab)

Mobile-first web app for paid habit-change cohorts: weekly meditation, daily check-ins, streaks and badges, and live sessions.

Built with React + Vite, Firebase (Authentication and Firestore), Stripe (Checkout), and deployed on Vercel.

## Run it on your Mac
```bash
npm install
npm run dev
```
Then open http://localhost:5173.

## Secret keys
Copy `.env.example` to `.env.local` and fill in the Firebase (and later Stripe) values. `.env.local` is never uploaded to GitHub. On Vercel, add the same names under **Settings → Environment Variables**.

## Where things live
- `src/App.jsx`: list of pages (routes)
- `src/pages/`: one file per page
- `src/firebase.js`: Firebase connection
- `src/styles/theme.css`: colours, fonts, spacing (change the look here)

## Build progress
1. ✅ Project setup (Vite, React, Firebase placeholders, Vercel-ready)
2. ✅ Landing page, sign-up, log in, hamburger menu
3. ⬜ Dashboard shell
4. ⬜ Daily check-in, streaks, leaderboard
5. ⬜ Cohorts and Stripe checkout, pre-cohort assignment
6. ⬜ Badges and the start-again path
7. ⬜ Admin dashboard
8. ⬜ Bio and other menu pages

## Aphorisms (AI drafts, owner approval)
Members see one short line under "Hello" on Home each day. Lines drafted by AI are **never** shown until you approve them.

**Files (in `data/`)**
- `aphorisms-drafts.json`: drafts from the script (`pending`, or `rejected` after review). Never shown to members.
- `aphorisms-approved.json`: lines you approved: `text`, `source` ("Habit Lab"), `theme`, `approvedOn`, and `showOn` (the day it's shown).
- `aphorisms-library.json`: your own fixed library, used when approved lines run out. A list of lines, e.g. `["First line", "Second line"]`.
- `aphorisms-review-log.json`: every approve, edit and reject, with the date and time.

**1. Draft.** Put your Anthropic key in `.env.local` as `ANTHROPIC_API_KEY=...` (never in the code), then:
```bash
npm run draft-aphorisms -- 14 urges
```
The number (default 14) and the theme (optional, e.g. urges, lapses, identity, "the breath") are both optional. New drafts are added as `pending`; nothing already there is changed.

**2. Review.** Run `npm run dev`, open http://localhost:5173/admin and choose **Aphorisms**. For each draft: **Approve**, **Edit** (then Save edit and Approve), or **Reject**. The page shows how many approved lines are left before the fallback library is used, and warns when fewer than 7 remain. Review only works on your computer: on the live site the page just shows the counter.

**3. Publish.** Approved lines reach members only when you push the change (GitHub Desktop). Each approved line gets the next free day, so every member sees the same line on the same day.

**Daily choice** (`src/lib/aphorisms.js`): the approved line whose `showOn` is today; otherwise the library line for the day of the year (day-of-year modulo the library's length); otherwise nothing.
