import { Link } from 'react-router-dom'

/**
 * 404 fallback page.
 */
export default function NotFound() {
  return (
    <section className="page">
      <h1>Page not found</h1>
      <p className="lead">The page you are looking for does not exist.</p>
      <Link className="btn btn-primary" to="/">Back to home</Link>
    </section>
  )
}
