import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

/**
 * Requires a specific role (default NGO) - Session 14.
 *
 * - not logged in      -> redirect to /login (keeping the destination)
 * - logged in, wrong role -> redirect home (replace)
 *
 * The wrong-role branch used to render a dead-end "This part is for
 * rescue partners" state. Owner-reported glitch: after logging out of an
 * NGO account and signing in as an individual, the browser Back button
 * re-opened /ngo/animals and parked there. Redirecting with `replace`
 * swaps that history entry, so Back now skips it and no logged-in user
 * is ever stranded on another role's URL.
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
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
