# LSync: notes for the backend team

From Ruth (frontend). Live frontend: https://lsync-frontend-th4c.vercel.app  Backend: https://lsync-1-0-0-1.onrender.com

This lists what the website sends and expects, and the things that will cause error messages for users if they are not sorted. Items are in order of how much they affect users. Please never send API keys or `.env` files in chat.

## 1. Fix first (users will see these)

1. **Forgot password cannot send email.** `package.json` has no email package (no nodemailer, Resend, SendGrid or similar). Add one, send the reset link `https://<frontend>/reset-password?token=<token>`, and always answer the same message whether or not the email exists.
2. **Error handler never runs.** In `server.js` the error-handling `app.use((err, req, res, next) => ...)` is nested inside the 404 handler, so it is never registered. Move it out, after the 404 handler, so users get `{ "success": false, "message": "..." }` instead of an HTML error page.
3. **YouTube type mismatch.** The request validator spells the platform `Youtube` but the database model spells it `YouTube`, so logging a YouTube session returns 400. Use one spelling in both. (The website works around it by saving YouTube logs as type `Other`. Once fixed, tell me and I will remove the workaround.)
4. **GitHub connect must send people back to the website.** After GitHub approves, redirect the browser to `https://<frontend>/connect?github=connected` (or `?github=error&reason=...`). Please share the exact callback URL you registered in the GitHub OAuth app so it can be checked against the deployed domain.
5. **Free server sleeps.** Render's free tier sleeps after about 15 minutes and takes up to a minute to wake. Please point UptimeRobot (free) at `GET /api/health` every 5 minutes, especially around presentation day.

## 2. Profile picture and profile fields

- The website now lets users upload a profile photo. It crops it to a 256 x 256 JPEG in the browser (about 15 KB) and sends it as the `avatar` field of `PUT /api/users/profile`, as a base64 data URL string (`data:image/jpeg;base64,...`).
- Please tell me what you want instead: a data URL string, or a multipart file upload (multer and Cloudinary are already in `package.json`), or a separate `POST /api/users/avatar`. Whichever you choose, return the final picture address as `avatar` in `GET /api/users/me` and in `GET /api/portfolio/:username`.
- **Removing a photo:** the website sends `avatar: ""` when someone removes their photo. Please clear the stored avatar when you get an empty string or null, and return no `avatar` after that. (If the server keeps the old picture, it would otherwise come back.)
- Until then the photo is also kept on the user's own device, so it still shows for them.
- `PUT /api/users/profile` currently takes name, username, bio, avatar and track. The profile page also has **headline** and **interests** fields that are not saved because the backend has no fields for them. Please add `headline` (string, max 120) and `interests` (array of strings, max 12), and return them from `GET /api/users/me`.

## 3. Chrome extension routes

These were in the endpoint list, but they are not mounted in the `server.js` I received:

- `POST /api/extension/link`
- `POST /api/watch-events`
- `GET /api/watch-events?page=1&limit=20`

Please send an example JSON reply for each (a real one, with fake data). The website will then show a "Watch activity" list. Also confirm whether the website needs to give users a link code for the extension, and how that code is created.

## 4. YouTube integration

`server.js` mounts `/api/integrations/youtube`, but I have not been given its routes, so the website does not use it yet. Please send:

- the route list, for example connect, list videos or playlists, sync
- how the user is sent to Google and back (the redirect URL, same pattern as GitHub)
- an example reply for each route

The website already has the card, button and activity page pattern from GitHub, so once I have the routes this is quick to add.

## 5. Replies the website relies on

- Every error should be `{ "success": false, "message": "plain sentence a user can read" }` with a correct status (400 bad input, 401 not signed in, 404 not found, 409 already exists, 500 your fault).
- `POST /api/auth/register`: duplicate email or username should be 409 with a message that says which one.
- `POST /api/auth/login`: wrong email or password should be 401 with the same message for both (never say which was wrong). Please make email matching **case-insensitive** (store emails lowercase). Phones capitalise the first letter and this causes "wrong password" for correct passwords.
- `GET /api/integrations/github/repositories` should accept `?page=1&perPage=30` and return pagination info. The website will send these once confirmed.
- CORS currently allows every origin. For launch, restrict it to the frontend domains.
- Keep `GET /api/health` fast and with no database call, so it can be pinged.

## 6. Sign in with Google, GitHub and Microsoft (optional, after launch)

The three buttons on the login page are switched off, with a "coming soon" note. To turn one on the backend needs: an OAuth app for that provider, a route that starts the sign-in, a callback route that creates or finds the user and returns the same token as `POST /api/auth/login`, and a redirect back to `https://<frontend>/login?token=...` (or similar). Tell me which providers and the route names and I will wire the buttons. GitHub sign-in can reuse the existing OAuth app if you add the sign-in callback.

## 7. Public portfolio page

`GET /api/portfolio/:username` exists, but the website's public page (`/portfolio/<username>`) is not built because I do not know the reply shape. Please send an example reply (fake data is fine) and say which parts are public.

## 8. Quick checklist to send back to Ruth

- [ ] Email package added and reset email arrives
- [ ] Error handler moved out of the 404 handler
- [ ] YouTube spelling fixed in validator and model
- [ ] GitHub callback redirect URL shared and tested end to end
- [ ] Avatar format chosen
- [ ] headline and interests fields added
- [ ] Extension and watch-events replies shared
- [ ] YouTube routes and example replies shared
- [ ] UptimeRobot set up
