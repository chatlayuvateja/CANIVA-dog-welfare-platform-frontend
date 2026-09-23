import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPublishedEvent } from '../../api/eventApi.js'
import { eventTypeLabel } from '../../utils/constants.js'
import { formatDate, formatTime } from '../../utils/date.js'
import Spinner from '../../components/common/Spinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'

/**
 * Event details (Session 15) - GET /api/events/{id}.
 *
 * Only PUBLISHED events are reachable: unknown / draft / cancelled ids all
 * come back 404 from the API (never leaking existence), which this page
 * presents as a friendly "not found" with a way back. Registration forms
 * for these events arrive with the public workflows session.
 */
export default function EventDetails() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let stale = false
    setLoading(true)
    setError(null)

    getPublishedEvent(id)
      .then((data) => {
        if (!stale) {
          setEvent(data)
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
  }, [id, retryKey])

  if (loading) {
    return (
      <section className="page">
        <Spinner label="Loading event…" />
      </section>
    )
  }

  if (error && error.status === 404) {
    return (
      <section className="page not-found-state">
        <h1>Event not found</h1>
        <p>
          This event does not exist, is still a draft, or is no longer
          published.
        </p>
        <p>
          <Link className="btn btn-primary" to="/events">
            Browse all events
          </Link>
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="page">
        <ErrorMessage
          message={error.message}
          onRetry={() => setRetryKey((key) => key + 1)}
        />
      </section>
    )
  }

  if (!event) return null

  return (
    <section className="page">
      <p>
        <Link to="/events">← Back to events</Link>
      </p>

      <div className="event-card-top">
        <span className="badge badge-blue">{eventTypeLabel(event.eventType)}</span>
        {event.capacity != null && (
          <span className="event-capacity">{event.capacity} seats</span>
        )}
      </div>

      <h1>{event.title}</h1>
      {event.ngoName && <p className="event-ngo">Organised by {event.ngoName}</p>}

      <ul className="meta-list meta-list-wide">
        <li>
          <span className="meta-label">Date</span>
          <span>{formatDate(event.eventDate)}</span>
        </li>
        <li>
          <span className="meta-label">Time</span>
          <span>
            {formatTime(event.startTime)}
            {event.endTime ? ` – ${formatTime(event.endTime)}` : ''}
          </span>
        </li>
        <li>
          <span className="meta-label">Location</span>
          <span>{event.location}</span>
        </li>
        <li>
          <span className="meta-label">Time slots</span>
          <span>{event.slotsEnabled ? 'Slot booking enabled' : 'Walk-in, no slots'}</span>
        </li>
      </ul>

      <div className="action-row">
        {event.eventType === 'DOG_REGISTRATION' && (
          <Link className="btn btn-primary" to={`/events/${event.id}/register-dog`}>
            Register your dog
          </Link>
        )}
        {event.eventType === 'VACCINATION' && (
          <Link
            className="btn btn-primary"
            to={`/events/${event.id}/register-vaccination`}
          >
            Register for vaccination
          </Link>
        )}
        {event.eventType === 'ADOPTION' && (
          <Link className="btn btn-primary" to="/adoption">
            View animals for adoption
          </Link>
        )}
        <span className="muted">
          You will sign in first if needed - your form stays waiting.
        </span>
      </div>

      {event.description && (
        <div className="event-description">
          <h2>About this event</h2>
          {String(event.description)
            .split('\n')
            .map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
        </div>
      )}
    </section>
  )
}
