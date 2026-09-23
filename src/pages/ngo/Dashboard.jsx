import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../../api/ngoApi.js'
import Spinner from '../../components/common/Spinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'

/**
 * NGO Dashboard (Session 17).
 *
 * Every number comes from GET /api/ngo/dashboard (DashboardDto - seven live
 * counters, all filtered server-side by the caller's ngoId). The page NEVER
 * computes stats itself and shows no placeholder/mock values: a fresh NGO
 * simply sees zeros. Cards link to the matching management pages.
 */
const CARDS = [
  { key: 'totalEvents', label: 'Total events', to: '/ngo/events' },
  { key: 'publishedEvents', label: 'Published events', to: '/ngo/events' },
  { key: 'totalRegistrations', label: 'Total registrations', to: '/ngo/registrations' },
  { key: 'pendingDogRegistrations', label: 'Pending dog verifications', to: '/ngo/registrations?tab=dogs' },
  { key: 'vaccinationRegistrations', label: 'Vaccination registrations', to: '/ngo/registrations?tab=vaccinations' },
  { key: 'adoptionAnimals', label: 'Animals in adoption', to: '/ngo/animals' },
  { key: 'pendingAdoptionApplications', label: 'Pending applications', to: '/ngo/applications' },
]

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let stale = false
    setLoading(true)
    setError(null)
    getDashboard()
      .then((data) => {
        if (!stale) {
          setStats(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!stale) {
          setError(err)
          setLoading(false)
        }
      })
    return () => {
      stale = true
    }
  }, [retryKey])

  if (loading) {
    return (
      <section className="page">
        <Spinner label="Loading dashboard…" />
      </section>
    )
  }

  if (error) {
    return (
      <section className="page">
        <ErrorMessage message={error.message} onRetry={() => setRetryKey((k) => k + 1)} />
      </section>
    )
  }

  return (
    <section className="page">
      <h1>Dashboard</h1>
      <p className="lead">Live statistics for your NGO - straight from the platform.</p>

      <div className="stat-grid">
        {CARDS.map((card) => (
          <Link key={card.key} className="stat-card" to={card.to}>
            <span className="stat-value">{stats?.[card.key] ?? 0}</span>
            <span className="stat-label">{card.label}</span>
          </Link>
        ))}
      </div>

      <div className="action-row">
        <Link className="btn btn-primary" to="/ngo/events/new">
          Create event
        </Link>
        <Link className="btn btn-secondary" to="/ngo/animals">
          Manage animals
        </Link>
        <Link className="btn btn-secondary" to="/ngo/applications">
          Review applications
        </Link>
        <Link className="btn btn-secondary" to="/ngo/profile">
          Edit NGO profile
        </Link>
      </div>
    </section>
  )
}
