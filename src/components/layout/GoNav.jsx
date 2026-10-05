import { NavLink } from 'react-router-dom'

/**
 * NGO workspace sub-navigation - shown only inside /ngo/** routes.
 * Keeps the top bar minimal (brief: minimal navigation) while the
 * workspace stays fully reachable: calm chips, one per concern,
 * matching the page structure one-to-one.
 */
const LINKS = [
  { to: '/ngo', label: 'Overview', end: true },
  { to: '/ngo/events', label: 'Events' },
  { to: '/ngo/animals', label: 'Animals' },
  { to: '/ngo/registrations', label: 'Registrations' },
  { to: '/ngo/applications', label: 'Applications' },
  { to: '/ngo/stories', label: 'Stories' },
  { to: '/ngo/urgent', label: 'Urgent cases' },
  { to: '/ngo/profile', label: 'Profile' },
]

export default function GoNav() {
  return (
    <nav className="go-nav" aria-label="Workspace">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) => (isActive ? 'go-link active' : 'go-link')}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}
