import { Link } from 'react-router-dom'
import { PawMark } from '../common/Logo.jsx'

/**
 * Site footer - warm beige band, wordmark, the platform's promise and
 * a handful of real links. No invented addresses or contact details.
 */
export default function SiteFooter() {
  return (
    <footer className="footer site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-wordmark">
            <PawMark size={20} className="brand-mark" />
            CANIVA
          </span>
          <p className="footer-tagline">
            Every abandoned animal deserves to be seen.
          </p>
        </div>

        <nav className="footer-links" aria-label="Footer">
          <Link to="/adoption">Animals waiting</Link>
          <Link to="/stories">Rescue stories</Link>
          <Link to="/events">Events</Link>
          <Link to="/adoption">Adopt</Link>
          <Link to="/login">Login</Link>
        </nav>

        <p className="footer-note">
          CANIVA is a digital shelter - a place for rescued animals to be
          noticed, remembered and adopted.
        </p>
      </div>
    </footer>
  )
}
