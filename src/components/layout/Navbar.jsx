import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

/**
 * Main navigation (Session 14 - now auth-aware).
 *
 * - guests:      public links + Login / Register
 * - PUBLIC user: public links + user name + Logout
 * - NGO user:    public links + NGO area links + user name + Logout
 *
 * Role-based visibility here is UX only; the server decides access.
 */
export default function Navbar() {
  const { isLoggedIn, isNgo, user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <NavLink to="/">Animal Welfare Events</NavLink>
      </div>
      <nav className="navbar-links">
        <NavLink to="/events">Events</NavLink>
        <NavLink to="/adoption">Adoption</NavLink>

        {isNgo && (
          <>
            <NavLink to="/ngo">Dashboard</NavLink>
            <NavLink to="/ngo/events">My Events</NavLink>
            <NavLink to="/ngo/animals">Animals</NavLink>
            <NavLink to="/ngo/applications">Applications</NavLink>
            <NavLink to="/ngo/profile">Profile</NavLink>
          </>
        )}

        {!isLoggedIn ? (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register" className="btn-register">
              Register
            </NavLink>
          </>
        ) : (
          <span className="navbar-user">
            <span className="user-name" title={user?.email}>
              {user?.fullName || user?.email}
            </span>
            <button type="button" className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </span>
        )}
      </nav>
    </header>
  )
}
