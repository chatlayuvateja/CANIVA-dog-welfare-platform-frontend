import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getOwnEvent, updateEvent } from '../../api/eventApi.js'
import { eventTypeLabel } from '../../utils/constants.js'
import { formatDate } from '../../utils/date.js'
import Spinner from '../../components/common/Spinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import EventForm from '../../components/forms/EventForm.jsx'

/**
 * Edit Event (Session 17). PUT /api/ngo/events/{id} with the full payload;
 * `status` is never sent (transitions live on My Events).
 *
 * URL-manipulation guard: GET /api/ngo/events/{id} answers 404 for foreign
 * OR unknown ids with the same message, so editing another NGO's id shows a
 * plain "not found" state - no information leak, verified in the S17 smoke.
 * CANCELLED events are terminal: shown read-only (backend answers 409).
 */
export default function EditEvent() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let stale = false
    setLoading(true)
    setError(null)
    getOwnEvent(id)
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

  async function handleSubmit(payload) {
    try {
      const updated = await updateEvent(id, payload)
      navigate('/ngo/events', {
        state: { flash: `“${updated.title}” updated.` },
      })
    } catch (err) {
      throw err // EventForm renders 400/404/409 messages
    }
  }

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
        <p>You can only edit your own events - unknown or foreign ids look identical.</p>
        <p>
          <Link className="btn btn-primary" to="/ngo/events">
            Back to my events
          </Link>
        </p>
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

  if (!event) return null

  return (
    <section className="page page-narrow">
      <p>
        <Link to="/ngo/events">← Back to my events</Link>
      </p>
      <div className="page-head">
        <h1>Edit event</h1>
        <StatusBadge status={event.status} />
      </div>

      <div className="workflow-intro">
        <h2>
          {event.title} · {eventTypeLabel(event.eventType)}
        </h2>
        <p>
          {formatDate(event.eventDate)} · {event.location}
        </p>
        <p>
          Status changes happen from <Link to="/ngo/events">My Events</Link> (publish /
          unpublish / cancel) - never from this form.
        </p>
      </div>

      {event.status === 'CANCELLED' ? (
        <div className="notice-box">
          <p>
            <strong>This event is cancelled.</strong> Cancelled events are terminal and
            can no longer be edited or published.
          </p>
          <p>
            <Link className="btn btn-secondary" to="/ngo/events">
              Back to my events
            </Link>
          </p>
        </div>
      ) : (
        <EventForm
          initial={event}
          submitLabel="Save changes"
          submitting={submitting}
          onCancel={() => navigate('/ngo/events')}
          onSubmit={async (payload) => {
            setSubmitting(true)
            try {
              await handleSubmit(payload)
            } finally {
              setSubmitting(false)
            }
          }}
        />
      )}
    </section>
  )
}
