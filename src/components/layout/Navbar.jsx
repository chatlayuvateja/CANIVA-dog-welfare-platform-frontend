import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { PawMark } from '../../components/common/Logo.jsx'

/**
 * Main navigation - CANIVA editorial bar.
 *
 * Deliberately minimal (brief: "do not put 15 links in the navbar"):
 *   Animals - Stories - Events  +  [My activities]  +  [Workspace (NGO)]
 *   right side: "Help an animal" CTA + Login/Register or user + Logout.
 *
 * On mobile (<880px) the links collapse into an elegant full-width
 * sheet behind a 44px toggle; role-based visibility here is UX only,
 * the server decides access.
 */
export default function Navbar() {
  const { isLoggedIn, isNgo, user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()

  // Close the mobile sheet whenever the route changes.
  useEffect(() => {
    setOpen(false)
  }, [pathname, hash])

  // Escape closes the sheet too.
  useEffect(() => {
    if (!open) return undefined
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className={`navbar${open ? ' menu-open' : ''}`}>
      <div className="navbar-brand">
        <NavLink to="/">
          <PawMark size={21} className="brand-mark" />
          CANIVA
        </NavLink>
      </div>

      <button
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="primary-nav"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="nav-toggle-bars" />
      </button>

      <nav className="navbar-links" id="primary-nav" aria-label="Primary">
        <NavLink to="/adoption">Animals</NavLink>
        <NavLink to="/stories">Stories</NavLink>
        <NavLink to="/events">Events</NavLink>

        {isLoggedIn && <NavLink to="/my-activities">My activities</NavLink>}
        {isNgo && <NavLink to="/ngo">Workspace</NavLink>}

        <NavLink to="/#give" className="nav-cta">
          Help an animal
        </NavLink>

        {!isLoggedIn ? (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register" className="btn-register">
              Join CANIVA
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
