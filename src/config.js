/**
 * API origin for metadata endpoints.
 *
 * - Local dev: defaults to `/api` (Vite proxy to Render).
 * - Production on Vercel: defaults to `/api` (same-origin; vercel.json rewrites).
 * - Embedded on **fanos.epss.gov.et** (or other `*.epss.gov.et`): when `VITE_API_ORIGIN` is unset,
 *   requests go to `https://fanos-dashboard.vercel.app/api` so data loads even if the gov proxy
 *   only forwards `/metadata/` and not `/api/`.
 * - Override any of the above: set `VITE_API_ORIGIN` (see .env.example).
 * - On epss.gov.et only: optional `VITE_EPSS_API_PROXY_ORIGIN` to change the default Vercel proxy base.
 *
 * Direct to Render (only if backend CORS allows your browser origin):
 * `https://epss-pod-verification-be.onrender.com`
 *
 * See DEPLOYMENT.md for CORS / proxy notes.
 */
const fromEnv = import.meta.env.VITE_API_ORIGIN?.trim().replace(/\/$/, '')

/** Optional: proxy used when the app is opened on epss.gov.et and env is unset */
const epssProxyDefault = 'https://fanos-dashboard.vercel.app/api'
const epssProxyFromEnv = import.meta.env.VITE_EPSS_API_PROXY_ORIGIN?.trim().replace(/\/$/, '')

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

    if (u.hostname.includes('onrender.com')) {
      return path === '/' ? u.origin : `${u.origin}${path}`
    }

    if (path === '/' && u.hostname.endsWith('.vercel.app')) {
      return `${u.origin}/api`
    }

    return path === '/' ? u.origin : `${u.origin}${path}`
  } catch {
    return '/api'
  }
}

function isEpssGovHost() {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  return h === 'fanos.epss.gov.et' || h.endsWith('.epss.gov.et')
}

function resolveApiOrigin() {
  // Government embed: same build often has VITE_API_ORIGIN=/api for Vercel, but /api is not
  // proxied on epss.gov.et — only use env here if it is an absolute URL (explicit override).
  if (isEpssGovHost()) {
    if (fromEnv && /^https?:\/\//i.test(fromEnv)) {
      return normalizeApiOrigin(fromEnv)
    }
    return normalizeApiOrigin(epssProxyFromEnv || epssProxyDefault)
  }

  if (fromEnv) return normalizeApiOrigin(fromEnv)
  return '/api'
}

export function getApiOrigin() {
  return resolveApiOrigin()
}

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${resolveApiOrigin()}${p}`
}
