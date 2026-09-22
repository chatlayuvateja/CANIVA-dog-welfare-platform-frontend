import axiosClient from './axiosClient.js'

/**
 * Authentication service (Session 14) - maps 1:1 to the backend auth
 * endpoints (all public except `me`):
 *   POST /api/auth/register -> 201 AuthResponse { accessToken, tokenType, user }
 *   POST /api/auth/login    -> 200 AuthResponse
 *   GET  /api/auth/me       -> 200 UserDto (Bearer required)
 *
 * Errors are rejected as { status, message, fieldErrors } (axiosClient
 * interceptor) - e.g. register: 400 validation / 409 duplicate email,
 * login: 401 invalid credentials.
 * Returns the RAW AuthResponse (caller stores the token, see AuthContext).
 */

export async function register(payload) {
  const res = await axiosClient.post('/api/auth/register', payload)
  return res.data
}

export async function login(payload) {
  const res = await axiosClient.post('/api/auth/login', payload)
  return res.data
}

export async function me() {
  const res = await axiosClient.get('/api/auth/me')
  return res.data
}
