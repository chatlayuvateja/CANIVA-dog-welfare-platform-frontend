import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import * as authApi from '../api/authApi.js'

/**
 * Authentication state (Session 14).
 *
 * Holds the current `user` (UserDto { id, fullName, email, phone, role }) and
 * exposes login / register / logout helpers that persist the session:
 *
 *   localStorage 'token' -> JWT accessToken (read + sent by axiosClient)
 *   localStorage 'user'  -> cached user JSON (instant state after reload)
 *
 * Storage trade-off (documented in PROJECT_CONTEXT section 15): localStorage
 * is XSS-readable; accepted for MVP simplicity vs. refresh-token cookies.
 * Route guards built on this context are UX only - the SERVER enforces
 * authentication and authorization on every request.
 *
 * The backend contract is never faked: helpers call the real
 * POST /api/auth/register and /api/auth/login and return the raw
 * AuthResponse; errors are rejected as { status, message, fieldErrors }.
 */
const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    localStorage.getItem('token') ? readStoredUser() : null,
  )

  const persist = useCallback((authResponse) => {
    localStorage.setItem('token', authResponse.accessToken)
    localStorage.setItem('user', JSON.stringify(authResponse.user))
    setUser(authResponse.user)
    return authResponse
  }, [])

  const login = useCallback(
    async (email, password) => persist(await authApi.login({ email, password })),
    [persist],
  )

  const register = useCallback(
    async (payload) => persist(await authApi.register(payload)),
    [persist],
  )

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: Boolean(user),
      isNgo: user?.role === 'NGO',
      role: user?.role ?? null,
      login,
      register,
      logout,
    }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return context
}
