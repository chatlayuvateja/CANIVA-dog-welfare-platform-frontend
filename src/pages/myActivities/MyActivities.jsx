import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listOwnRegistrations as listMyDogRegistrations } from '../../api/dogRegistrationApi.js'
import { listOwnRegistrations as listMyVaccinations } from '../../api/vaccinationApi.js'
import { listOwnApplications } from '../../api/adoptionApi.js'
import { formatDate } from '../../utils/date.js'
import Spinner from '../../components/common/Spinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'

/**
 * "My Activities" (Session 16) - one place for everything the logged-in
 * user submitted, straight from the owner endpoints:
 *
 *   GET /api/me/dog-registrations         -> dog registrations
 *   GET /api/me/vaccination-registrations -> vaccination bookings
 *   GET /api/me/applications              -> adoption applications
 *
 * Each section loads independently with its own loading / error+retry /
 * empty state, so one failing call never blanks the page. Behind
 * ProtectedRoute (any role - the server returns only the caller's own rows).
 */
function useActivitySection(loader) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let stale = false
    setState((prev) => ({ ...prev, loading: true, error: null }))
    loader()
      .then((data) => {
        if (!stale) setState({ data: Array.isArray(data) ? data : [], loading: false, error: null })
      })
      .catch((err) => {
        if (!stale) setState({ data: null, loading: false, error: err })
      })
    return () => {
      stale = true
    }
  }, [loader, retryKey])

  const retry = useCallback(() => setRetryKey((key) => key + 1), [])
  return { ...state, retry }
}

function dateOrDash(value) {
  return value ? formatDate(value) : '—'
}

export default function MyActivities() {
  const dogSection = useActivitySection(listMyDogRegistrations)
  const vaccSection = useActivitySection(listMyVaccinations)
  const appSection = useActivitySection(listOwnApplications)

  return (
    <section className="page">
      <h1>My Activities</h1>
      <p className="lead">Everything you submitted - straight from the platform.</p>

      {/* ---- Dog registrations ------------------------------------------ */}
      <div className="activity-card">
        <h2>
          Dog registrations
          {!dogSection.loading && !dogSection.error && (
            <span className="badge badge-blue">{dogSection.data.length}</span>
          )}
        </h2>
        {dogSection.loading ? (
          <Spinner label="Loading dog registrations…" />
        ) : dogSection.error ? (
          <ErrorMessage message={dogSection.error.message} onRetry={dogSection.retry} />
        ) : dogSection.data.length === 0 ? (
          <EmptyState
            title="No dog registrations yet"
            message="Find a DOG_REGISTRATION event and register your dog."
          >
            <Link className="btn btn-secondary" to="/events">
              Browse events
            </Link>
          </EmptyState>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Dog</th>
                  <th>Status</th>
                  <th>Registration number</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {dogSection.data.map((reg) => (
                  <tr key={reg.id}>
                    <td data-label="Event">{reg.eventTitle}</td>
                    <td data-label="Dog">
                      {reg.dogName}
                      {reg.breed ? ` (${reg.breed})` : ''}
                    </td>
                    <td data-label="Status">
                      <StatusBadge status={reg.status} />
                    </td>
                    <td data-label="Registration number">
                      {reg.registrationNumber ? (
                        <span className="reg-number">{reg.registrationNumber}</span>
                      ) : (
                        <span className="muted-cell">assigned at verification</span>
                      )}
                    </td>
                    <td data-label="Submitted">{dateOrDash(reg.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---- Vaccination bookings --------------------------------------- */}
      <div className="activity-card">
        <h2>
          Vaccination bookings
          {!vaccSection.loading && !vaccSection.error && (
            <span className="badge badge-blue">{vaccSection.data.length}</span>
          )}
        </h2>
        {vaccSection.loading ? (
          <Spinner label="Loading vaccination bookings…" />
        ) : vaccSection.error ? (
          <ErrorMessage message={vaccSection.error.message} onRetry={vaccSection.retry} />
        ) : vaccSection.data.length === 0 ? (
          <EmptyState
            title="No vaccination bookings yet"
            message="Find a VACCINATION event and book your pet in."
          >
            <Link className="btn btn-secondary" to="/events">
              Browse events
            </Link>
          </EmptyState>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Pet</th>
                  <th>Slot</th>
                  <th>Status</th>
                  <th>Booked on</th>
                </tr>
              </thead>
              <tbody>
                {vaccSection.data.map((reg) => (
                  <tr key={reg.id}>
                    <td data-label="Event">{reg.eventTitle}</td>
                    <td data-label="Pet">
                      {reg.petName}
                      {reg.species ? ` (${reg.species})` : ''}
                    </td>
                    <td data-label="Slot">{reg.slotLabel ?? <span className="muted-cell">Walk-in</span>}</td>
                    <td data-label="Status">
                      <StatusBadge status={reg.status} />
                    </td>
                    <td data-label="Booked on">{dateOrDash(reg.registeredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---- Adoption applications -------------------------------------- */}
      <div className="activity-card">
        <h2>
          Adoption applications
          {!appSection.loading && !appSection.error && (
            <span className="badge badge-blue">{appSection.data.length}</span>
          )}
        </h2>
        {appSection.loading ? (
          <Spinner label="Loading applications…" />
        ) : appSection.error ? (
          <ErrorMessage message={appSection.error.message} onRetry={appSection.retry} />
        ) : appSection.data.length === 0 ? (
          <EmptyState
            title="No adoption applications yet"
            message="Animals looking for a home are listed in the adoption catalogue."
          >
            <Link className="btn btn-secondary" to="/adoption">
              Browse animals
            </Link>
          </EmptyState>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Animal</th>
                  <th>Status</th>
                  <th>Decision reason</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {appSection.data.map((application) => (
                  <tr key={application.id}>
                    <td data-label="Animal">
                      <Link to={`/adoption/animals/${application.animalId}`}>
                        {application.animalName}
                      </Link>
                    </td>
                    <td data-label="Status">
                      <StatusBadge status={application.status} />
                    </td>
                    <td data-label="Decision reason">
                      {application.decisionReason ?? <span className="muted-cell">—</span>}
                    </td>
                    <td data-label="Applied">{dateOrDash(application.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
