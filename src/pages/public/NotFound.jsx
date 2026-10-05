import { Link } from 'react-router-dom'

/**
 * 404 fallback page.
 */
export default function NotFound() {
  return (
    <section className="page not-found-state">
      <h1>This page wandered off</h1>
      <p className="lead">
        Nothing lives at this address — but there are animals waiting, stories
        to read and events to visit.
      </p>
      <div className="hero-actions">
        <Link className="btn btn-primary" to="/">
          Back to home
        </Link>
        <Link className="btn btn-secondary" to="/adoption">
          See who is waiting
        </Link>
      </div>
    </section>
  )
}
