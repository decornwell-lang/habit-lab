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
Copy `.env.example` to `.env.local` and fill in the Firebase and Stripe values. `.env.local` is never uploaded to GitHub. On Vercel, add the same names under **Settings → Environment Variables**.

## Where things live
- `src/App.jsx`: list of pages (routes)
- `src/pages/`: one file per page (Dashboard, Account, Admin, Login, Landing…)
- `src/components/dashboard/`: the member dashboard. Tabs: **Home** (badge box and the day's prompts), **Practices** (meditation, weekly assignment, live session), **Breathe** (3-minute breathing), **Upcoming** (cohorts to join)
- `src/components/admin/`: the Admin tabs
- `src/lib/`: helpers (Firestore data, dates, streaks and badges, push notifications…)
- `src/content/`: wording you can edit: site text, info pages, weekly themes, daily notifications (`dailyPrompts.js`), intention / evening review wording (`intention.js`), country codes
- `api/`: server functions on Vercel (Stripe checkout, sending messages, the hourly daily prompts, leaving a cohort, deleting an account)
- `config/pricing.json`: prices (€, VAT included) and access periods
- `firestore.rules`: database security rules (paste into Firebase console → Firestore → Rules)
- `src/styles/theme.css`: colours, fonts, spacing (change the look here)

## Daily notifications
Members get three notifications a day **for each cohort they're in**, each at their own local time (their phone's time zone is saved when they open the app; Europe/Madrid is used until then):
- **06:00** How do you feel today? (Morning tile)
- **08:00** Your intention for today (Intention tile: a minute with "What is my intention, in one sentence?")
- **21:00** Evening review, the day's final check-in (e.g. "Did you smoke today? No" keeps the smoking streak).

A member can be in several cohorts at once (e.g. alcohol for years, plus a fitness cohort). Each cohort has its own morning check-in, intention and evening review (shared in that cohort's WhatsApp group), notifications, streak, badges, journey and leaderboard; buttons at the top of Home switch between them. Someone in two cohorts gets two notifications at 06:00, one for each. The habits, their evening questions and streak wording are in `src/lib/cohorts.js` (`HABIT_TYPES`).

This week's meditation (Practices tab) doesn't send a notification. Times and wording: `src/content/dailyPrompts.js`.

How they're sent: `.github/workflows/daily-prompts.yml` runs every hour and calls `api/daily-prompts.js`. This uses GitHub's free scheduler, so the Firebase Blaze plan is **not** needed. Needs `CRON_SECRET` in both Vercel and GitHub (Settings → Secrets and variables → Actions). Members without notifications switched on still see every prompt as a tile on Home.

## Payments
Each cohort is €99, VAT (IVA 21%) included; prices are in `config/pricing.json`. Joining a paid cohort opens Stripe Checkout (test mode until launch). Stripe Tax works out the VAT inside the price when `STRIPE_TAX=on` is set in Vercel. Joining an alcohol-free cohort first shows a short screening (`src/content/screening.js`). Terms and conditions: Menu → Terms and conditions (text in `src/content/pages.js`; have it checked before launch). Members can remove a cohort, or delete their membership, in My account.

## Reflections and privacy
Morning intentions and evening reviews are stored per member in `users/{uid}/reflections`, with counts only in `users/{uid}/activity`. David can read a member's words only if they ticked "I agree that my reflections can be seen by David…" (sign-up or My account); otherwise he sees counts only. This is enforced by `firestore.rules`, which must be published in the Firebase console.

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

## Security
- **Database rules** (`firestore.rules`): members read and write only their own data; payments and access are written only by the server; reflections need the member's consent before David can read them.
- **Security headers** (`vercel.json`): the site can't be shown inside other sites; HTTPS only.
- **Firebase web key** is limited to the site's own addresses (Google Cloud → APIs & Services → Credentials → Browser key → Website restrictions). Email enumeration protection is on (Firebase → Authentication → Settings → User actions).
- **Adding a custom domain?** Add it in two places, or sign-in stops working there: Firebase → Authentication → Settings → Authorized domains, and the Browser key's Website restrictions (e.g. `https://yourdomain.com/*`).
- Turn on two-factor authentication for the accounts behind the app: email, Google, Vercel, GitHub and Stripe.
