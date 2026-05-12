# Deployed app: live API not updating

## Why it works locally but fails after deploy

The dashboard calls **`https://epss-pod-verification-be.onrender.com`** from the browser. That is a **cross-origin** request: your site’s origin (e.g. `https://your-app.netlify.app`) is different from the API origin.

The browser enforces **CORS**. The API must respond with headers such as:

```http
Access-Control-Allow-Origin: https://your-app.netlify.app
```

(or `*` for simple public APIs — use with care).

**`localhost` is a different origin** than production. The backend might allow `http://localhost:5173` but not your real deploy URL, so fetches succeed in dev and fail (or stay on fallbacks) in production.

Open **DevTools → Network**: failed requests often show as **(blocked:cors)** or status **0**. Console shows **CORS policy** errors.

## Fix options

### 1) Fix on the backend (recommended)

On the Render service, configure CORS to include your deployed frontend origin(s), for example:

- `https://your-app.netlify.app`
- production custom domain if you use one

Redeploy the API after changing CORS.

### 2) Same-origin proxy (Netlify)

This repo includes `public/_redirects` so Netlify can proxy `/api/*` to Render.

1. In Netlify: **Site settings → Environment variables**  
   Add: `VITE_API_ORIGIN` = `/api`
2. Redeploy the frontend (env vars are baked in at **build** time for Vite).

Then the browser only talks to your own domain; Netlify forwards to Render server-side (no CORS in the browser).

### 3) Vercel / other hosts

This repo’s `vercel.json` rewrites `/api/*` to the Render backend.

- **Dashboard on `https://fanos-dashboard.vercel.app`**  
  Leave `VITE_API_ORIGIN` unset (or `/api`). The browser calls `/api/metadata/...` on the same host.

- **Dashboard embedded on `https://fanos.epss.gov.et/metadata/` (or any `*.epss.gov.et`)**  
  The reverse proxy often forwards **`/metadata/`** to Vercel but not **`/api/`**, so relative `/api` calls would hit the government host and fail.  
  **No env var is required:** at runtime the app calls **`https://fanos-dashboard.vercel.app/api/...`** instead (CORS is allowed on that proxy).  
  Optional: **`VITE_EPSS_API_PROXY_ORIGIN`** to use a different proxy base.  
  If you later proxy **`https://fanos.epss.gov.et/api/`** to Vercel yourself, set **`VITE_API_ORIGIN=https://fanos.epss.gov.et/api`** (absolute URL) so the app uses your domain.

- **Other embedded origins**  
  Set **`VITE_API_ORIGIN=https://fanos-dashboard.vercel.app/api`** (include **`/api`**).  
  If you set only `https://fanos-dashboard.vercel.app`, the built URLs hit `/metadata/...` on the app host instead of the API proxy.

The app also normalizes a bare `https://*.vercel.app` value (no path) to `https://*.vercel.app/api` at build time when that value is used as `VITE_API_ORIGIN`.

## Other gotchas

- **Render cold start**: first request can time out; users may briefly see loaders or fallback numbers.
- **HTTPS only**: deploy the frontend on **https**; mixed content can block `http` API calls.

## Local development

`vite.config.js` proxies `/api` → Render so `npm run dev` uses same-origin `/api/...` and avoids CORS issues during local work.
