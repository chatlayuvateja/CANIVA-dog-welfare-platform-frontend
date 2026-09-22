import { NavLink } from 'react-router-dom'

/**
 * Main navigation. Auth state (login/logout) is connected in Session 14.
 */
export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-brand">
        <NavLink to="/">Animal Welfare Events</NavLink>
      </div>
      <nav className="navbar-links">
        <NavLink to="/events">Events</NavLink>
        <NavLink to="/adoption">Adoption</NavLink>
        <NavLink to="/login">Login</NavLink>
        <NavLink to="/register" className="btn-register">Register</NavLink>
      </nav>
    </header>
  )
}
