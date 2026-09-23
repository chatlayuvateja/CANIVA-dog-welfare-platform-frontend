import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listOwnEvents } from '../../api/eventApi.js'
import {
  listForEvent as listDogForEvent,
  reject as rejectDogRegistration,
  verify as verifyDogRegistration,
} from '../../api/dogRegistrationApi.js'
import {
  complete as completeVaccination,
  listForEvent as listVaccForEvent,
  noShow as noShowVaccination,
} from '../../api/vaccinationApi.js'
import { formatDate } from '../../utils/date.js'
import { eventTypeLabel } from '../../utils/constants.js'
import Spinner from '../../components/common/Spinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Modal from '../../components/common/Modal.jsx'

const TABS = [
  { key: 'dogs', label: 'Dog registration verification' },
  { key: 'vaccinations', label: 'Vaccination registrations' },
]

const CONFIRM_COPY = {
  verify: {
    title: 'Verify this dog registration?',
    body: 'A unique registration number (DREG-…) is generated and stored permanently - this cannot be undone.',
    cta: 'Verify',
  },
  reject: {
    title: 'Reject this dog registration?',
    body: 'The registration becomes REJECTED (terminal) and its occupied seat is freed.',
    cta: 'Reject',
  },
  complete: {
    title: 'Mark vaccination as COMPLETED?',
    body: 'Terminal state - only do this once the pet was actually vaccinated at the camp.',
    cta: 'Mark completed',
  },
  noshow: {
    title: 'Mark as NO-SHOW?',
    body: 'Terminal state - the owner did not bring the pet to the camp.',
    cta: 'Mark no-show',
  },
}

/**
 * Event Registrations (Session 17) - the operational hub covering the plan's
 * "Event Registrations", "Dog Registration Verification" and "Vaccination
 * Registrations" views:
 *
 *   event picker (?event=<id> in the URL - refresh keeps your place)
 *   + tab (?tab=dogs|vaccinations)
 *   + dog tab: list per event, Verify / Reject behind confirmations
 *     (PATCH /api/ngo/dog-registrations/{id}/verify|reject, no body;
 *      only PRE_REGISTERED rows offer actions, everything else 409s)
 *   + vaccination tab: Complete / No-show for REGISTERED rows only.
 *
 * All lists come from GET /api/ngo/events/{eventId}/… registrations - own
 * events only; foreign/unknown event ids answer 404 server-side (URL
 * manipulation can never reach another NGO's data).
 */
export default function Registrations() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [events, setEvents] = useState(null)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState(null)
  const [eventsRetry, setEventsRetry] = useState(0)

  const tab = searchParams.get('tab') === 'vaccinations' ? 'vaccinations' : 'dogs'
  const eventParam = searchParams.get('event')

  const [rows, setRows] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  const [confirm, setConfirm] = useState(null) // { action, row }
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    let stale = false
    setEventsLoading(true)
    setEventsError(null)
    listOwnEvents()
      .then((data) => {
        if (!stale) {
          setEvents(Array.isArray(data) ? data : [])
          setEventsLoading(false)
        }
      })
      .catch((err) => {
        if (!stale) {
          setEventsError(err)
          setEventsLoading(false)
        }
      })
    return () => {
      stale = true
    }
  }, [eventsRetry])

  // Only events that can actually hold registrations are selectable.
  const eligible = (events ?? []).filter(
    (event) =>
      (event.eventType === 'DOG_REGISTRATION' || event.eventType === 'VACCINATION') &&
      event.status !== 'CANCELLED',
  )
  const selectedId = eventParam ?? eligible[0]?.id ?? null
  const selectedEvent = eligible.find((event) => String(event.id) === String(selectedId)) ?? null

  // Default the URL so refresh/share restore the same view.
  useEffect(() => {
    if (!eventsLoading && selectedId && String(eventParam) !== String(selectedId)) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('event', String(selectedId))
          return next
        },
        { replace: true },
      )
    }
  }, [eventsLoading, selectedId, eventParam, setSearchParams])

  useEffect(() => {
    if (!selectedId) {
      setRows(null)
      return undefined
    }
    let stale = false
    setLoading(true)
    setError(null)
    const loader = tab === 'dogs' ? listDogForEvent : listVaccForEvent
    loader(selectedId)
      .then((data) => {
        if (!stale) {
          setRows(Array.isArray(data) ? data : [])
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
  }, [selectedId, tab, retryKey])

  function switchTab(key) {
    const next = new URLSearchParams(searchParams)
    next.set('tab', key)
    if (selectedId) next.set('event', String(selectedId))
    setSearchParams(next, { replace: true })
  }

  function switchEvent(value) {
    const next = new URLSearchParams(searchParams)
    next.set('event', value)
    next.set('tab', tab)
    setSearchParams(next, { replace: true })
  }

  async function runConfirm() {
    if (!confirm) return
    const { action, row } = confirm
    setBusy(true)
    setConfirm(null)
    setBanner(null)
    try {
      const label =
        row.dogName ?? row.petName ?? row.ownerName ?? 'registration'
      const done =
        action === 'verify'
          ? await verifyDogRegistration(row.id)
          : action === 'reject'
            ? await rejectDogRegistration(row.id)
            : action === 'complete'
              ? await completeVaccination(row.id)
              : await noShowVaccination(row.id)
      setBanner({
        type: 'success',
        text: `“${label}” → ${done.status}${done.registrationNumber ? ` (${done.registrationNumber})` : ''}.`,
      })
      setRetryKey((k) => k + 1)
    } catch (err) {
      setBanner({ type: 'error', text: err.message })
      setRetryKey((k) => k + 1) // row may have changed (409) - refresh
    } finally {
      setBusy(false)
    }
  }

  // ---- load / empty states -------------------------------------------------
  if (eventsLoading) {
    return (
      <section className="page">
        <Spinner label="Loading your events…" />
      </section>
    )
  }

  if (eventsError) {
    return (
      <section className="page">
        <ErrorMessage
          message={eventsError.message}
          onRetry={() => setEventsRetry((k) => k + 1)}
        />
      </section>
    )
  }

  if (eligible.length === 0) {
    return (
      <section className="page">
        <h1>Event registrations</h1>
        <EmptyState
          title="No registration events yet"
          message="Create a dog-registration or vaccination event first - cancelled events are excluded."
        >
          <Link className="btn btn-primary" to="/ngo/events/new">
            Create event
          </Link>
        </EmptyState>
      </section>
    )
  }

  const copy = confirm ? CONFIRM_COPY[confirm.action] : null

  return (
    <section className="page">
      <h1>Event registrations</h1>

      <div className="toolbar">
        <label htmlFor="eventPicker">Event</label>
        <select
          id="eventPicker"
          className="select-inline"
          value={String(selectedId)}
          onChange={(e) => switchEvent(e.target.value)}
        >
          {eligible.map((event) => (
            <option key={event.id} value={String(event.id)}>
              {event.title} · {formatDate(event.eventDate)} · {eventTypeLabel(event.eventType)}
            </option>
          ))}
        </select>
        {selectedEvent && (
          <span className="toolbar-note">
            <StatusBadge status={selectedEvent.status} />
          </span>
        )}
      </div>

      <div className="tab-bar" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={tab === t.key ? 'tab-btn active' : 'tab-btn'}
            onClick={() => switchTab(t.key)}
          >
            {t.label}
          </button>
        ))}
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

      {loading ? (
        <Spinner label="Loading registrations…" />
      ) : error ? (
        <ErrorMessage message={error.message} onRetry={() => setRetryKey((k) => k + 1)} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={tab === 'dogs' ? 'No dog registrations yet' : 'No vaccination registrations yet'}
          message={
            tab === 'dogs'
              ? 'Submissions appear here as soon as owners register for this event.'
              : 'Bookings appear here as soon as owners register for this event.'
          }
        />
      ) : tab === 'dogs' ? (
        <div className="table-wrap">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Owner</th>
                <th>Dog</th>
                <th>Status</th>
                <th>Registration #</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td data-label="Owner">
                    {row.ownerName}
                    <br />
                    <span className="muted-cell">{row.ownerPhone}</span>
                  </td>
                  <td data-label="Dog">
                    {row.dogName}
                    <br />
                    <span className="muted-cell">{row.breed}</span>
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={row.status} />
                  </td>
                  <td data-label="Registration #">
                    {row.registrationNumber ? (
                      <span className="reg-number">{row.registrationNumber}</span>
                    ) : (
                      <span className="muted-cell">—</span>
                    )}
                  </td>
                  <td data-label="Submitted">{formatDate(row.createdAt)}</td>
                  <td data-label="Actions">
                    <div className="row-actions">
                      {row.status === 'PRE_REGISTERED' ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => setConfirm({ action: 'verify', row })}
                          >
                            Verify
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => setConfirm({ action: 'reject', row })}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="muted-cell">No actions</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Owner</th>
                <th>Pet</th>
                <th>Slot</th>
                <th>Status</th>
                <th>Booked</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td data-label="Owner">
                    {row.ownerName}
                    <br />
                    <span className="muted-cell">{row.ownerPhone}</span>
                  </td>
                  <td data-label="Pet">
                    {row.petName}
                    {row.species ? ` (${row.species})` : ''}
                  </td>
                  <td data-label="Slot">{row.slotLabel ?? <span className="muted-cell">Walk-in</span>}</td>
                  <td data-label="Status">
                    <StatusBadge status={row.status} />
                  </td>
                  <td data-label="Booked">{formatDate(row.registeredAt)}</td>
                  <td data-label="Actions">
                    <div className="row-actions">
                      {row.status === 'REGISTERED' ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => setConfirm({ action: 'complete', row })}
                          >
                            Completed
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => setConfirm({ action: 'noshow', row })}
                          >
                            No-show
                          </button>
                        </>
                      ) : (
                        <span className="muted-cell">No actions</span>
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
              Back
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
            <strong>
              {confirm.row.dogName ?? confirm.row.petName ?? ''}
              {confirm.row.ownerName ? ` · ${confirm.row.ownerName}` : ''}
            </strong>
          </p>
        )}
      </Modal>
    </section>
  )
}
