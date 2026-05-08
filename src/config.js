/**
 * API origin for metadata endpoints.
 *
 * - Local dev: defaults to `/api` so Vite can proxy to Render (avoids browser CORS during development).
 * - Production: defaults to the Render URL unless you set `VITE_API_ORIGIN` (e.g. `/api` + host proxy).
 *
 * If live data works locally but not after deploy, see DEPLOYMENT.md (CORS / proxy).
 */
const fromEnv = import.meta.env.VITE_API_ORIGIN?.replace(/\/$/, '')

export const API_ORIGIN =
  fromEnv ||
  (import.meta.env.DEV ? '/api' : 'https://epss-pod-verification-be.onrender.com')

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_ORIGIN}${p}`
}
