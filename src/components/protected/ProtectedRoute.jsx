import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

/**
 * Requires a logged-in user (any role) - Session 14.
 *
 * Unauthenticated visitors are redirected to /login while the intended
 * destination is kept in location.state.from, so Login can send them back
 * after a successful login.
 *
 * UX convenience only: the real enforcement is server-side (401 on every
 * protected endpoint without a valid JWT).
 */
export default function ProtectedRoute() {
  const { isLoggedIn } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <Outlet />
}
