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

Add an equivalent rewrite/proxy rule for your host, or use a small serverless function as a proxy, and set `VITE_API_ORIGIN` to that path.

## Other gotchas

- **Render cold start**: first request can time out; users may briefly see loaders or fallback numbers.
- **HTTPS only**: deploy the frontend on **https**; mixed content can block `http` API calls.

## Local development

`vite.config.js` proxies `/api` → Render so `npm run dev` uses same-origin `/api/...` and avoids CORS issues during local work.
