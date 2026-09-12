# ccskeys

One repo, two deploys:

- **Repo root** — static login/dashboard pages → deploy to **Cloudflare Pages**
  (no custom settings needed — Pages' defaults already point at the root)
- `backend/` — Express API + Redis session store → deploy to **Render**
  (set root directory to `backend`)

## Cloudflare Pages (frontend)

1. Workers & Pages → Create → Pages → connect this repo.
2. Leave **Root directory** blank/default (`/`).
3. Set **Build output directory** to `public`. This is the one setting you
   need — it's what keeps `backend/` (which contains your real license keys
   in `ccs-keys.txt`) from being uploaded and served publicly. Skipping this
   means anyone can download the key list straight from your `.pages.dev`
   URL.
4. No build command needed.
5. Deploy. Your site is live at `https://<project>.pages.dev`.
6. Edit `public/config.js` and set `window.API_BASE_URL` to your Render URL
   (next section), commit, and Pages auto-redeploys.

## Render (backend)

1. New → Web Service → connect this repo.
2. **Root Directory:** `backend`
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. Environment variables: copy the keys from `backend/.env.example` and fill
   in real values. `FRONTEND_ORIGINS` should be your Pages URL, e.g.
   `https://ccskeys.pages.dev`.
6. Deploy. Note the resulting URL, e.g. `https://ccskeys-api.onrender.com`.

## Order of operations

Deploy the backend first so you have the Render URL to put into `config.js`,
then push that change so Pages redeploys with the right API URL. Then go
back to Render and make sure `FRONTEND_ORIGINS` matches the real `pages.dev`
URL (or custom domain) exactly, including `https://`.

## Notes

- The two services are on different domains, so the session cookie is set
  `SameSite=None; Secure` and every frontend fetch uses
  `credentials: "include"`. If you later attach a custom domain, put the
  frontend and backend on the same root domain (e.g. `app.example.com` /
  `api.example.com`) so the cookie becomes first-party instead.
- `backend/seed.js` populates Redis with the keys in `backend/ccs-keys.txt`.
  Run it locally (with the same env vars set) once, pointed at your Upstash
  instance: `npm run seed`.
