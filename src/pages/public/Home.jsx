import { Link } from 'react-router-dom'

/**
 * Home page - Session 02 placeholder.
 * Real content (featured events, etc.) is built in Session 15.
 */
export default function Home() {
  return (
    <section className="page">
      <h1>Animal Welfare Events</h1>
      <p className="lead">
        Discover dog registration camps, vaccination drives and adoption events
        organised by local NGOs.
      </p>
      <div className="home-actions">
        <Link className="btn btn-primary" to="/events">Browse Events</Link>
        <Link className="btn btn-secondary" to="/adoption">Adopt an Animal</Link>
      </div>
      <div className="category-grid">
        <div className="category-card">
          <h3>Dog Registration</h3>
          <p>Register your dog and get an official unique registration number.</p>
        </div>
        <div className="category-card">
          <h3>Vaccination</h3>
          <p>Book a slot for your pet at an upcoming vaccination camp.</p>
        </div>
        <div className="category-card">
          <h3>Adoption</h3>
          <p>Find animals looking for a loving permanent home.</p>
        </div>
      </div>
    </section>
  )
}
