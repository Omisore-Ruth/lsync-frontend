# LSync frontend

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · React Hook Form + Zod · Montserrat (self-hosted)

## Run it

Full VS Code walkthrough: see **SETUP.md**.

```bash
npm install
npm run dev        # http://localhost:3000
```

`.env.local` ships with `NEXT_PUBLIC_USE_MOCKS=true` (demo mode: an in-browser fake backend, nothing saved to a server). Demo login: `demo@lsync.app` / `Demo1234`. Set it to `false` to use the real API at `NEXT_PUBLIC_API_URL`.

Other scripts: `npm run build`, `npm start`, `npm run lint`.

## What is built

| Route | Status |
|---|---|
| Preloader, `/login`, `/register` | Done |
| `/integrations` (Sources) | Done. Post-signup landing (`?welcome=1`). GitHub connect; manual add for YouTube, Coursera, Udemy, edX, blogs |
| `/integrations/github` | Done. Repo list, sync commits, private-repo warning |
| `/dashboard` | Done. Stats, growth chart, activity by source, recent activity, skills, empty state |
| `/learning-logs` | Done. Add (validated), list, delete |
| `/activity` | Done. Merged timeline, source filter, pagination |
| `/skills` | Done. Levels from hours logged (Beginner <20 h, Intermediate 20-60 h, Advanced 60 h+) |
| `/analytics` | Done. Range toggle, hours chart, calendar, insights, weekly goal (saved on this device) |
| `/insights` | Done. Benchmark from the EdTech dataset: driver explorer, habit checker (sliders), rules LSync takes from it. Dashboard also has a "Learning health" card |
| `/profile` | Done. Profile, portfolio visibility, account. Photo upload and delete account disabled until backend supports them |
| Public portfolio, forgot password | Not built (no design / endpoint) |

## How the EdTech dataset is used

`data/edtech.csv` (5,000 students, labelled active / at-risk / dropped) is summarised by `scripts/build-insights.py` into `src/lib/data/edtech-insights.json`. The website only ships those summaries and a small 3-input model (~80% cross-validated accuracy). Re-run with `python scripts/build-insights.py` (needs pandas and scikit-learn).

Findings the product rules rest on: logins per week, course completion and forum posts predict dropout; days since last activity only matters after ~14 days (so no 3-day nudge); exam season adds ~14 points of risk; age and number of courses do not matter. `dropout_score` is the label in numeric form, so it is deliberately not used as a feature.

Be upfront in the presentation: it is a benchmark from other students (10 MENA cities, 2024), not LSync users, and it looks synthetic because the groups separate so cleanly. `healthOf()` in `src/lib/insights.ts` uses learning days per week as a stand-in for logins per week.

## Where users land

- After **sign-up**: `/integrations?welcome=1` ("Link your learning sources"), because an empty dashboard is a poor first impression. "Skip for now" goes to the dashboard.
- After **sign-in**: `/dashboard`.

All numbers on dashboard, skills and analytics are calculated in `src/lib/stats.ts` from learning logs (plus synced GitHub commits for the timeline). Nothing is invented: items that need data the backend doesn't have (courses completed, time-of-day insights, reading stats, recommendations) are left out.

## Where things live

- `src/lib/api/endpoints.ts`: every backend route in one file. **Auth, learning-log and profile routes are guesses** (GitHub and portfolio routes are confirmed).
- `src/lib/api/services.ts`: maps backend responses to the shapes the UI uses (`toLog`, `toLogPayload`, `toProfile`: fix field names here).
- `src/lib/api/mock.ts`: the demo-mode fake backend.
- `src/lib/stats.ts`: all calculated numbers.
- `src/lib/api/client.ts`: fetch wrapper (Bearer token, readable error messages, 401 handling).
- `src/lib/auth/`: `AuthProvider` (session, login, register, logout) and `token.ts` (where the JWT is stored).
- `src/lib/copy.ts`: copy that differs from the Figma, with the reason.
- `public/brand/`: transparent logo pieces cut from the PNG.

## To do before this talks to the real backend

1. **Confirm the auth routes and field names.** The backend sent signup/login/get-user links but the screenshot was cropped. Fix `endpoints.register`, `endpoints.login`, `endpoints.me`, and if field names differ, the request bodies in `AuthProvider.tsx` (marked `UNCONFIRMED`) and the response mappers `extractToken` / `extractUser`.
2. **CORS.** The backend must allow the frontend origin (`http://localhost:3000` in development, the deployed URL in production), or the browser will block every request.
3. **Token storage.** Currently `localStorage` / `sessionStorage` via `token.ts`. An httpOnly cookie set by the API is safer. Agree this with the backend; only `token.ts` and `client.ts` change.

## Deliberate differences from the Figma

- Primary button is `#7A3DB8`, darker than the Figma's pale `#AB72D4`, so white text passes WCAG AA contrast.
- Sign-in tagline says "see your progress" instead of "verify your progress". The backend handoff says GitHub-matched activity must not be called verified. Change it in `src/lib/copy.ts` once the team agrees wording.
- Sign-up artwork: the text sits on the plain lilac area so it no longer overlaps the shapes.
- Google / GitHub / Microsoft sign-in buttons are shown but disabled. The backend only covers email + password login and GitHub *connect*.
- "Forgot password?", Terms and Privacy Policy are plain text for now (no pages or endpoint yet).
- Colours were sampled from screenshots because the Figma file has no saved variables. Ask Dan to publish styles/variables, then update the tokens.

## Open questions (waiting on the team)

- Dashboard stats: streak, courses completed, growth chart, activity by source need endpoints.
- Skills levels, analytics insights (needs time of day per session), reading statistics, weekly goal.
- Per-source portfolio visibility, delete account, profile edit.
- Learning logs need a certificate/proof link and an in-progress/completed status for the manual Udemy / Coursera / edX flow.
- Missing screens in the Figma: learning log form, GitHub repository/commit/sync screen, public portfolio, forgot password, mobile and empty/error states.
- Logo as SVG (and an icon-only mark) to replace the PNG pieces.

## Security notes

- Never put secrets in `NEXT_PUBLIC_*` variables: they are shipped to every browser.
- The backend must not expose private-repository commits on the public portfolio (flagged as unfinished in the handoff). A frontend filter cannot fix that.
