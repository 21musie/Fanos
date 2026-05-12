/**
 * API origin for metadata endpoints.
 *
 * - Local dev: defaults to `/api` so Vite can proxy to Render (avoids browser CORS during development).
 * - Production on Vercel: defaults to `/api` (same-origin; vercel.json rewrites to Render).
 * - Cross-origin from another site: set `VITE_API_ORIGIN` to the **Vercel app URL including `/api`**, e.g.
 *   `https://fanos-dashboard.vercel.app/api`
 *   (If you set only the site root without `/api`, requests hit `/metadata/...` on the app and never reach the proxy.
 *   Bare `https://*.vercel.app` is normalized to add `/api` at build time.)
 *
 * - Direct to Render (only if backend CORS allows your browser origin):
 *   `https://epss-pod-verification-be.onrender.com` (no `/api` segment; paths are `/metadata/...` on that host)
 *
 * If live data works locally but not after deploy, see DEPLOYMENT.md (CORS / proxy).
 */
const fromEnv = import.meta.env.VITE_API_ORIGIN?.trim().replace(/\/$/, '')

/**
 * @param {string} raw
 * @returns {string}
 */
function normalizeApiOrigin(raw) {
  if (!raw) return '/api'

  if (!/^https?:\/\//i.test(raw)) {
    return raw.startsWith('/') ? raw : `/${raw}`
  }

  try {
    const u = new URL(raw)
    const path = (u.pathname || '/').replace(/\/$/, '') || '/'

    // Render backend: paths are served at host root (e.g. /metadata/...), not under /api
    if (u.hostname.includes('onrender.com')) {
      return path === '/' ? u.origin : `${u.origin}${path}`
    }

    // Vite / Vercel preview: bare deployment URL without /api is a common misconfiguration;
    // requests must hit /api/metadata/... not /metadata/... on the app host.
    if (path === '/' && u.hostname.endsWith('.vercel.app')) {
      return `${u.origin}/api`
    }

    return path === '/' ? u.origin : `${u.origin}${path}`
  } catch {
    return '/api'
  }
}

export const API_ORIGIN = normalizeApiOrigin(fromEnv || '')

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_ORIGIN}${p}`
}
