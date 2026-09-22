import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import ErrorMessage from '../common/ErrorMessage.jsx'

/**
 * Requires a specific role (default NGO) - Session 14.
 *
 * - not logged in      -> redirect to /login (keeping the destination)
 * - logged in, wrong role -> rendered forbidden state (explicit, honest UX
 *   instead of silently bouncing the user elsewhere)
 *
 * UX convenience only: ROLE_NGO is enforced by the backend on every
 * /api/ngo/** endpoint (403/401 regardless of what this guard shows).
 */
export default function RoleRoute({ role = 'NGO' }) {
  const { isLoggedIn, role: userRole } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (userRole !== role) {
    return (
      <ErrorMessage
        title="Access denied"
        message={`This area is restricted to ${role} accounts. Your account role is ${userRole ?? 'unknown'}.`}
      />
    )
  }

  return <Outlet />
}
