/**
 * API origin for metadata endpoints.
 *
 * - Local dev: defaults to `/api` so Vite can proxy to Render (avoids browser CORS during development).
 * - Production: defaults to `/api` (works with Vercel rewrite in vercel.json).
 *   You can still override with `VITE_API_ORIGIN`.
 *
 * If live data works locally but not after deploy, see DEPLOYMENT.md (CORS / proxy).
 */
const fromEnv = import.meta.env.VITE_API_ORIGIN?.replace(/\/$/, '')

export const API_ORIGIN =
  fromEnv || '/api'

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_ORIGIN}${p}`
}
