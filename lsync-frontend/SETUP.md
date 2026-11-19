# LSync frontend: set up in VS Code (Windows / Mac)

## 1. Install (once)
1. **Node.js 22 LTS**: https://nodejs.org (choose "LTS"). Check in a terminal: `node -v` shows v22.x.
2. **VS Code**: https://code.visualstudio.com
3. **Git** (optional now, needed when you push): https://git-scm.com

## 2. Open the project
1. Unzip `lsync-frontend.zip` somewhere simple, e.g. `Documents/lsync-frontend`.
2. VS Code: File > Open Folder > pick the `lsync-frontend` folder (the one containing `package.json`).
3. Click "Install" when VS Code offers the recommended extensions (ESLint, Tailwind CSS IntelliSense, Prettier, Error Lens). They give you error underlines, class-name autocomplete and auto-format.
4. If asked "Use workspace TypeScript version?", choose **Allow**.

## 3. Run it
Open the terminal in VS Code (Terminal > New Terminal) and run:

```bash
npm install     # downloads the libraries (1-3 minutes, first time only)
npm run dev     # starts the app
```
Open http://localhost:3000. Stop the app with `Ctrl + C`.

**Demo login:** `demo@lsync.app` / `Demo1234`. Or click Sign up to try the new-user journey (you land on "Link your learning sources", then the dashboard).

## 4. What each command does
| Command | Use |
|---|---|
| `npm run dev` | Development server, updates as you save |
| `npm run lint` | Checks code for mistakes |
| `npm run build` | Production build (run before you deploy; must pass) |
| `npm start` | Serves the production build (after `npm run build`) |

## 5. Environment file (`.env.local`)
```
NEXT_PUBLIC_USE_MOCKS=true            # true = demo data stored in your browser, no backend needed
NEXT_PUBLIC_API_URL=http://localhost:2005   # the backend address
```
Restart `npm run dev` after changing it. Never put secret keys here: anything starting with `NEXT_PUBLIC_` is visible in the browser. Backend keys (GitHub secret, Cloudinary, JWT secret, Mongo) stay in the backend only.

## 6. Connect to the real backend
1. Get the backend running (`http://localhost:2005`).
2. Set `NEXT_PUBLIC_USE_MOCKS=false` and restart.
3. Backend must allow CORS from `http://localhost:3000`.
4. Confirmed routes: GitHub integration and `GET /api/portfolio/:username`. **Not yet confirmed** (ask James): register/login/me, learning-log and profile routes and field names. Fix them in:
   - `src/lib/api/endpoints.ts` (paths)
   - `src/lib/api/services.ts` (`toLog`, `toLogPayload`, `toProfile`: field names)

## 7. Where things are
- `src/app/` pages (`(app)/` = pages behind login)
- `src/components/` shared UI, charts, sidebar
- `src/lib/api/` API client, mock backend, services
- `src/lib/stats.ts` all dashboard/skills/analytics numbers
- `src/app/globals.css` colours and fonts (design tokens)
- `public/brand/` logo images

## 7b. The dataset
`data/edtech.csv` is the dataset from the brief. To rebuild the Insights numbers:
```bash
pip install pandas scikit-learn
python scripts/build-insights.py
```
Not needed to run the app: the generated `src/lib/data/edtech-insights.json` is already included.

## 8. Troubleshooting
- **`npm` not recognised:** reinstall Node, then restart VS Code.
- **Port 3000 busy:** `npm run dev -- -p 3001`.
- **Odd errors after pulling changes:** delete the `.next` folder and `node_modules`, run `npm install` again.
- **Demo data looks stale:** Profile > Account > Reset demo data.
- **Login fails against real backend:** open browser DevTools > Network and check the request URL and the CORS error.

## 9. Git (when ready)
```bash
git init
git add .
git commit -m "LSync frontend"
```
`.env.local` is ignored by git on purpose.
