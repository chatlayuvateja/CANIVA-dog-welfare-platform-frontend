import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPublishedEvents } from '../../api/eventApi.js'
import Spinner from '../../components/common/Spinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import EventCard from './EventCard.jsx'

const FEATURED_COUNT = 4

/**
 * Home page (Session 15) - hero, category overview and the latest PUBLISHED
 * events loaded from the REAL backend (GET /api/events?page=0&size=4).
 * Loading / error (with retry) / empty states; zero mock data.
 */
export default function Home() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listPublishedEvents({ page: 0, size: FEATURED_COUNT })
      setEvents(data.content ?? [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, retryKey])

  return (
    <section className="page">
      <div className="hero">
        <h1>Animal Welfare Events</h1>
        <p className="lead">
          Discover dog registration camps, vaccination drives and adoption events
          organised by local NGOs.
        </p>
        <div className="home-actions">
          <Link className="btn btn-primary" to="/events">
            Browse Events
          </Link>
          <Link className="btn btn-secondary" to="/adoption">
            Adopt an Animal
          </Link>
        </div>
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

      <div className="page-section-head">
        <h2>Latest published events</h2>
        <Link to="/events">View all events →</Link>
      </div>

      {loading ? (
        <Spinner label="Loading events…" />
      ) : error ? (
        <ErrorMessage
          message={error.message}
          onRetry={() => setRetryKey((key) => key + 1)}
        />
      ) : events.length === 0 ? (
        <EmptyState
          title="No events published yet"
          message="New camps and drives will appear here as soon as NGOs publish them."
        />
      ) : (
        <div className="event-grid">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  )
}
