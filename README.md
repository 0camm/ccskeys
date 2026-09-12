# ccskeys

One repo, two deploys:

- `backend/` — Express API + Redis session store → deploy to **Render**
- `frontend/` — static login/dashboard pages → deploy to **Cloudflare Pages**

## Render (backend)

1. New → Web Service → connect this repo.
2. **Root Directory:** `backend`
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. Environment variables (Render dashboard → Environment): copy the keys from
   `backend/.env.example` and fill in real values. `FRONTEND_ORIGINS` should be
   your Pages URL, e.g. `https://ccskeys.pages.dev` (comma-separate if you add
   a custom domain later).
6. Deploy. Note the resulting URL, e.g. `https://ccskeys-api.onrender.com`.

## Cloudflare Pages (frontend)

1. Workers & Pages → Create → Pages → connect this repo.
2. **Root directory (build settings):** `frontend`
3. **Build command:** (leave blank — it's static)
4. **Build output directory:** `/` (relative to the root directory above)
5. Before/after first deploy, edit `frontend/config.js` and set
   `window.API_BASE_URL` to your Render URL from the step above, then commit.
6. Deploy. Your site is live at `https://<project>.pages.dev`.

## Order of operations

Deploy the backend first so you have the Render URL to put in
`frontend/config.js`, then deploy the frontend. After the frontend is live,
go back to Render and make sure `FRONTEND_ORIGINS` matches the real
`pages.dev` URL (or your custom domain) exactly, including `https://`.

## Notes

- The two services are on different domains, so the session cookie is set
  `SameSite=None; Secure` and every frontend fetch uses
  `credentials: "include"`. This works everywhere but is the kind of thing
  browsers are tightening over time — if you attach a custom domain, put the
  frontend and backend on the same root domain (e.g. `app.example.com` /
  `api.example.com`) so the cookie becomes first-party.
- `backend/seed.js` populates Redis with the keys in `backend/ccs-keys.txt`.
  Run it locally (with the same env vars set) once, pointed at your Upstash
  instance: `npm run seed`.
