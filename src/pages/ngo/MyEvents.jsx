import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  cancelEvent,
  listOwnEvents,
  publishEvent,
  unpublishEvent,
} from '../../api/eventApi.js'
import { eventTypeLabel } from '../../utils/constants.js'
import { formatDate } from '../../utils/date.js'
import Spinner from '../../components/common/Spinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Modal from '../../components/common/Modal.jsx'

const FILTERS = ['ALL', 'DRAFT', 'PUBLISHED', 'CANCELLED']

const CONFIRM_COPY = {
  publish: {
    title: 'Publish this event?',
    body: 'It becomes visible in the public event list immediately.',
    cta: 'Publish',
  },
  unpublish: {
    title: 'Unpublish this event?',
    body: 'It disappears from public discovery until you publish it again.',
    cta: 'Unpublish',
  },
  cancel: {
    title: 'Cancel this event?',
    body: 'Cancelling is permanent - the event can never be published or edited again.',
    cta: 'Cancel event',
  },
}

/**
 * My Events (Session 17) - the NGO's own event list from
 * GET /api/ngo/events (plain array, own rows only; foreign/unknown ids are
 * 404 server-side, so URL manipulation never reaches another NGO's data).
 *
 * Status changes only via the three state-machine actions
 * (publish / unpublish / cancel), each behind a confirmation dialog; the
 * `status` field is never sent. Client-side status filter chips +
 * success/error banners; loading/empty/error+retry everywhere.
 */
export default function MyEvents() {
  const navigate = useNavigate()
  const location = useLocation()

  const [events, setEvents] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  const [filter, setFilter] = useState('ALL')
  const [confirm, setConfirm] = useState(null) // { action, event }
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState(null) // { type, text }

  useEffect(() => {
    let stale = false
    setLoading(true)
    setError(null)
    listOwnEvents()
      .then((data) => {
        if (!stale) {
          setEvents(Array.isArray(data) ? data : [])
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

  useEffect(() => {
    if (location.state?.flash) {
      setBanner({ type: 'success', text: location.state.flash })
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location, navigate])

  async function runConfirm() {
    if (!confirm) return
    const { action, event } = confirm
    setBusy(true)
    setConfirm(null)
    setBanner(null)
    try {
      const updated =
        action === 'publish'
          ? await publishEvent(event.id)
          : action === 'unpublish'
            ? await unpublishEvent(event.id)
            : await cancelEvent(event.id)
      setBanner({ type: 'success', text: `“${event.title}” is now ${updated.status}.` })
      setRetryKey((k) => k + 1)
    } catch (err) {
      setBanner({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const reload = useCallback(() => setRetryKey((k) => k + 1), [])

  if (loading) {
    return (
      <section className="page">
        <Spinner label="Loading your events…" />
      </section>
    )
  }

  if (error) {
    return (
      <section className="page">
        <ErrorMessage message={error.message} onRetry={reload} />
      </section>
    )
  }

  if (events.length === 0) {
    return (
      <section className="page">
        <h1>My Events</h1>
        <EmptyState
          title="No events yet"
          message="Create your first event - it starts as a draft until you publish it."
        >
          <Link className="btn btn-primary" to="/ngo/events/new">
            Create event
          </Link>
        </EmptyState>
      </section>
    )
  }

  const visible =
    filter === 'ALL' ? events : events.filter((event) => event.status === filter)

  const copy = confirm ? CONFIRM_COPY[confirm.action] : null

  return (
    <section className="page">
      <div className="page-head">
        <h1>My Events</h1>
        <Link className="btn btn-primary" to="/ngo/events/new">
          Create event
        </Link>
      </div>

      {banner && (
        <div className={banner.type === 'error' ? 'error-banner' : 'flash'}>
          {banner.text}
          <button
            type="button"
            className="banner-close"
            onClick={() => setBanner(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <div className="toolbar" role="group" aria-label="Filter by status">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            className={filter === value ? 'chip active' : 'chip'}
            onClick={() => setFilter(value)}
          >
            {value === 'ALL' ? 'All' : value.charAt(0) + value.slice(1).toLowerCase()}
            {value !== 'ALL'
              ? ` (${events.filter((event) => event.status === value).length})`
              : ` (${events.length})`}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="muted-block">No {filter.toLowerCase()} events.</p>
      ) : (
        <div className="table-wrap">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date &amp; time</th>
                <th>Status</th>
                <th>Capacity</th>
                <th>Slots</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((event) => (
                <tr key={event.id}>
                  <td data-label="Event">
                    <strong>{event.title}</strong>
                    <br />
                    <span className="muted-cell">{eventTypeLabel(event.eventType)}</span>
                  </td>
                  <td data-label="Date &amp; time">
                    {formatDate(event.eventDate)}
                    <br />
                    <span className="muted-cell">
                      {String(event.startTime).slice(0, 5)}–
                      {String(event.endTime).slice(0, 5)}
                    </span>
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={event.status} />
                  </td>
                  <td data-label="Capacity">{event.capacity ?? '—'}</td>
                  <td data-label="Slots">{event.slotsEnabled ? 'Yes' : '—'}</td>
                  <td data-label="Actions">
                    <div className="row-actions">
                      {event.status === 'DRAFT' && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setConfirm({ action: 'publish', event })}
                        >
                          Publish
                        </button>
                      )}
                      {event.status === 'PUBLISHED' && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setConfirm({ action: 'unpublish', event })}
                        >
                          Unpublish
                        </button>
                      )}
                      {event.status !== 'CANCELLED' && (
                        <Link
                          className="btn btn-secondary btn-sm"
                          to={`/ngo/events/${event.id}/edit`}
                        >
                          Edit
                        </Link>
                      )}
                      {(event.eventType === 'DOG_REGISTRATION' ||
                        event.eventType === 'VACCINATION') && (
                        <Link
                          className="btn btn-secondary btn-sm"
                          to={`/ngo/registrations?event=${event.id}`}
                        >
                          Registrations
                        </Link>
                      )}
                      {event.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setConfirm({ action: 'cancel', event })}
                        >
                          Cancel event
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(confirm)}
        title={copy?.title ?? ''}
        onClose={() => (busy ? undefined : setConfirm(null))}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirm(null)}
              disabled={busy}
            >
              Keep as is
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={runConfirm}
              disabled={busy}
            >
              {busy ? 'Working…' : (copy?.cta ?? 'Confirm')}
            </button>
          </>
        }
      >
        <p>{copy?.body}</p>
        {confirm && (
          <p>
            <strong>{confirm.event.title}</strong>
          </p>
        )}
      </Modal>
    </section>
  )
}
