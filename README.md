# The Habit Lab · David Ernest Cornwell

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
2. ⬜ Landing page, sign-up, log in, hamburger menu
3. ⬜ Dashboard shell
4. ⬜ Daily check-in, streaks, leaderboard
5. ⬜ Cohorts and Stripe checkout, pre-cohort assignment
6. ⬜ Badges and the start-again path
7. ⬜ Admin dashboard
8. ⬜ Bio and other menu pages
