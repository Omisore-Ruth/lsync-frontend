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
| `/forgot-password`, `/reset-password` | Done on the frontend. The backend has no reset routes yet, so the live server answers with "isn't switched on" |
| Public portfolio | Not built (no design) |

## How the EdTech dataset is used

`data/edtech.csv` (5,000 students, labelled active / at-risk / dropped) is summarised by `scripts/build-insights.py` into `src/lib/data/edtech-insights.json`. The website only ships those summaries and a small 3-input model (~80% cross-validated accuracy). Re-run with `python scripts/build-insights.py` (needs pandas and scikit-learn).

Findings the product rules rest on: logins per week, course completion and forum posts predict dropout; days since last activity only matters after ~14 days (so no 3-day nudge); exam season adds ~14 points of risk; age and number of courses do not matter. `dropout_score` is the label in numeric form, so it is deliberately not used as a feature.

Be upfront in the presentation: it is a benchmark from other students (10 MENA cities, 2024), not LSync users, and it looks synthetic because the groups separate so cleanly. `healthOf()` in `src/lib/insights.ts` uses learning days per week as a stand-in for logins per week.

## Where users land

- After **sign-up**: `/integrations?welcome=1` ("Link your learning sources"), because an empty dashboard is a poor first impression. "Skip for now" goes to the dashboard.
- After **sign-in**: `/dashboard`.

All numbers on dashboard, skills and analytics are calculated in `src/lib/stats.ts` from learning logs (plus synced GitHub commits for the timeline). Nothing is invented: items that need data the backend doesn't have (courses completed, time-of-day insights, reading stats, recommendations) are left out.

## Where things live

- `src/lib/api/endpoints.ts`: every backend route in one file. All routes were read from the backend repo on 19 Nov 2026, except `forgotPassword` / `resetPassword`, which the backend does not have yet.
- `src/lib/api/services.ts`: maps backend responses to the shapes the UI uses. Creating a log first looks up or creates the skill, platform and track ids, because the backend stores them as ids.
- `src/lib/api/mock.ts`: the demo-mode fake backend.
- `src/lib/stats.ts`: all calculated numbers.
- `src/lib/api/client.ts`: fetch wrapper (Bearer token, readable error messages, 401 handling).
- `src/lib/auth/`: `AuthProvider` (session, login, register, logout) and `token.ts` (where the JWT is stored).
- `src/lib/copy.ts`: copy that differs from the Figma, with the reason.
- `public/brand/`: transparent logo pieces cut from the PNG.

## Real backend contract (read from the backend repo, 19 Nov 2026)

- Register: `POST /api/auth/register` with `name`, `username` (5+ characters, letters, numbers, underscores), `email`, `password` (8+). Returns `{ token, user }`.
- Login: `POST /api/auth/login` with `email` and `password` only (a username is rejected).
- Me: `GET /api/users/me` returns `{ data: user }` (no email, because the model hides it).
- Logs: `POST/GET /api/logs/log`, `DELETE /api/logs/log/:id`. No edit route.
- Profile: `PUT /api/users/profile` (name, bio, avatar, track), `PUT /api/users/privacy` (isPublic). No headline or interests field.
- Validation errors come back as `{ errors: ["...", "..."] }`; other errors use `message` or `msg`. `client.ts` handles all three.

## Still to do

1. **Backend fixes** (a bug list was sent to the backend team): password change and delete crash, dotted-Gmail login mismatch, YouTube platform spelling, error handler placement, email hidden and not unique, password reset routes, log edit route.
2. **CORS.** The backend currently allows every origin, which works. Tighten it to `http://localhost:3000` and the deployed URL before launch.
3. **Token storage.** Currently `localStorage` / `sessionStorage` via `token.ts`. An httpOnly cookie set by the API is safer. Agree this with the backend; only `token.ts` and `client.ts` change.

## Deliberate differences from the Figma

- Primary button is `#7A3DB8`, darker than the Figma's pale `#AB72D4`, so white text passes WCAG AA contrast.
- Sign-in tagline says "see your progress" instead of "verify your progress". The backend handoff says GitHub-matched activity must not be called verified. Change it in `src/lib/copy.ts` once the team agrees wording.
- Sign-up artwork: the text sits on the plain lilac area so it no longer overlaps the shapes.
- Google / GitHub / Microsoft sign-in buttons are shown but disabled. The backend only covers email + password login and GitHub *connect*.
- Terms and Privacy Policy are plain text for now (no pages yet).
- Colours were sampled from screenshots because the Figma file has no saved variables. Ask Dan to publish styles/variables, then update the tokens.

## Open questions (waiting on the team)

- Dashboard stats: streak, courses completed, growth chart, activity by source need endpoints.
- Skills levels, analytics insights (needs time of day per session), reading statistics, weekly goal.
- Per-source portfolio visibility, delete account, profile edit.
- Learning logs need a certificate/proof link and an in-progress/completed status for the manual Udemy / Coursera / edX flow.
- Missing screens in the Figma: learning log form, GitHub repository/commit/sync screen, public portfolio, forgot and reset password, mobile and empty/error states (the forgot and reset password pages were designed in code to match the sign-in card).
- Logo as SVG (and an icon-only mark) to replace the PNG pieces.

## Security notes

- Never put secrets in `NEXT_PUBLIC_*` variables: they are shipped to every browser.
- The backend must not expose private-repository commits on the public portfolio (flagged as unfinished in the handoff). A frontend filter cannot fix that.


## Navigation (matches Dan's Figma)
Dashboard, Activity, Skills, Analytics, Profile. Nothing else is listed.
- **Sources**: sign-up lands on `/connect` ("Link your learning sources", with Skip). The same cards stay on the Dashboard (blank-state hero for new users, "Your sources" card afterwards). `/integrations` redirects to `/connect`; `/integrations/github` is the repo picker.
- **Learning logs**: the add form and delete button live on Activity. `/learning-logs` redirects to `/activity` (keeps `?add=1&platform=`).
- **Insights**: reached from the glowing "Peer insights" orb on the Dashboard (`/insights`, unlisted). Includes a city explorer built from the CSV (`scripts/build-insights.py`).

## Account features (wired to the backend team's endpoint list, 20 Nov 2026)
- **Forgot / reset password**: `POST /api/auth/forgot-password {email}` and `POST /api/auth/reset-password {token, newPassword}`.
- **Change password**: `PUT /api/users/password {currentPassword, newPassword, confirmPassword}` (Profile > Account).
- **Delete account**: `DELETE /api/users/delete {password, confirmDelete: "DELETE"}` (Profile > Account).
- **Connect / Disconnect a platform profile**: `POST /api/users/accounts {platformId, platformUsername, profileUrl?}` and `DELETE /api/users/accounts/:id`. Linked accounts come back inside `GET /api/users/me` (`linkedAccounts`). This stores a username and link; it does not import hours.
- **Server wake-up**: the login and sign-up pages ping `GET /api/health` so the free Render server starts while the person types.
- Demo mode is the default. Set `NEXT_PUBLIC_USE_MOCKS=false` (exactly) to use the real server.

## Public site: landing page, blog and Lily

- `/` is now the public landing page (it used to redirect). Signed-in visitors see a "Go to dashboard" button in its header. The page lives in `src/app/(site)/`.
- `/blog` and `/blog/<slug>` show the articles in `src/lib/blog.ts`. Post 1 is the marketing team's text, word for word. Posts 2 and 3 are drafts and should be approved by the marketers. To add an article, add another object to `POSTS`.
- The landing page uses **Motion** (the library formerly called Framer Motion; `npm install motion`). Helpers are in `src/components/site/motion.tsx`; the hero story is `src/components/site/Hero.tsx`. Movement is reduced automatically for visitors who ask their device for less motion.
- **Lily** is the voice guide (`src/components/lily/LilyAgent.tsx`). She appears on the landing page, blog, sign in and sign up, not inside the signed-in app.
  - The welcome appears in writing straight away. Browsers never allow sound before the first click or key press, so she speaks on that first click or key press.
  - Pause, mute, and a microphone button are always in her header.
  - "Hey Lily" uses the browser's speech recognition (Chrome and Edge, partly Safari). The visitor must switch the microphone on. She stops listening while she speaks.
  - What she knows is scripted in `src/lib/lily/knowledge.ts`, so she cannot invent features or prices. Each topic has clear words (worth 3 points) and vague words (1 point), so "do I have to pay before using the platform?" is answered as a pricing question. "Tell me more" continues her last answer. To teach her something new, add an item to `INTENTS`.
  - Voice: she prefers a Canadian English voice if the device has one. For one consistent Canadian voice, record the lines in `docs/LILY-VOICE-SCRIPT.md` and list the clips in `public/lily/manifest.json`.
