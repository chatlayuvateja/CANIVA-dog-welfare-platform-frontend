import axios from 'axios'

/**
 * Central Axios instance (Session 14) - the ONLY place that talks HTTP.
 *
 * - baseURL comes from VITE_API_BASE_URL (frontend/.env, see .env.example);
 *   falls back to the local backend.
 * - Request interceptor: attaches `Authorization: Bearer <token>` from
 *   localStorage when present.
 * - Response interceptor: normalizes EVERY failure to a plain, page-friendly
 *   object { status, message, fieldErrors } extracted from the backend's
 *   unified ApiError envelope ({ timestamp, status, error, message, path,
 *   fieldErrors? }). Pages then just render `error.message` /
 *   `error.fieldErrors`.
 * - On 401 (expired/tampered/foreign token): the session is cleared and the
 *   user is sent to /login (unless already there).
 * - On 403: nothing special happens here - callers render the forbidden
 *   state (route guards already prevent most 403s).
 *
 * Network failures (backend down) normalize to { status: undefined,
 * message: 'Network error...' }.
 *
 * Security note: storing the JWT in localStorage is the documented MVP
 * trade-off (PROJECT_CONTEXT section 15) - route guards are UX only; the
 * server enforces everything.
 */
const rawBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
// Tolerate a trailing '/api' in the env value (.env.example documents
// .../api) - every service function calls full paths like '/api/events',
// so the base must be only the origin (otherwise '/api/api/...' would be
// requested).
const baseURL = rawBaseURL.replace(/\/+$/, '').replace(/\/api$/, '')

const axiosClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const response = error.response

    // Backend ApiError envelope -> keep its message + fieldErrors
    const normalized = {
      status: response?.status,
      message: response?.data?.message || 'Network error - please try again.',
      fieldErrors: response?.data?.fieldErrors,
    }

    if (response?.status === 401) {
      const hadSession = Boolean(localStorage.getItem('token'))
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (!window.location.pathname.startsWith('/login')) {
        // Expired/tampered JWT mid-flow: remember where the user was so
        // the Login page can send them straight back after re-auth.
        if (hadSession) {
          sessionStorage.setItem(
            'redirectAfterLogin',
            window.location.pathname + window.location.search,
          )
        }
        window.location.assign('/login')
      }
    }

    return Promise.reject(normalized)
  },
)

export default axiosClient
