import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  changeStatus,
  createAnimal,
  listOwnAnimals,
  updateAnimal,
} from '../../api/animalApi.js'
import { listOwnEvents } from '../../api/eventApi.js'
import { formatDate } from '../../utils/date.js'
import Spinner from '../../components/common/Spinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Modal from '../../components/common/Modal.jsx'
import AnimalForm from '../../components/forms/AnimalForm.jsx'

const STATUS_FILTERS = ['ALL', 'AVAILABLE', 'HIDDEN', 'ADOPTED']

/**
 * Animals (Session 17) - full NGO animal management on the real APIs:
 *
 *   GET    /api/ngo/animals             -> own animals, ALL statuses
 *   POST   /api/ngo/animals             -> 201 always AVAILABLE
 *   PUT    /api/ngo/animals/{id}        -> full update, status untouched
 *   PATCH  /api/ngo/animals/{id}/status -> AVAILABLE <-> HIDDEN soft toggle
 *          behind a confirmation (ADOPTED is terminal -> backend 409, shown)
 *
 * Client-side status + event filter chips (the NGO list has no server
 * filters). Create/edit happen in a modal (AnimalForm). No hard delete
 * exists in the MVP - hiding is the soft-deactivate. Foreign/unknown ids
 * answer 404 server-side, so URL manipulation never crosses NGOs.
 */
export default function Animals() {
  const [animals, setAnimals] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  const [events, setEvents] = useState([])

  const [statusFilter, setStatusFilter] = useState('ALL')
  const [eventFilter, setEventFilter] = useState('ALL')

  const [modal, setModal] = useState(null) // { mode: 'create'|'edit', animal? }
  const [confirm, setConfirm] = useState(null) // { animal, target }
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    let stale = false
    setLoading(true)
    setError(null)
    listOwnAnimals()
      .then((data) => {
        if (!stale) {
          setAnimals(Array.isArray(data) ? data : [])
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
    listOwnEvents()
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([])) // filter is optional; the list still works
  }, [])

  const reload = useCallback(() => setRetryKey((k) => k + 1), [])

  const adoptionEvents = useMemo(
    () => events.filter((event) => event.eventType === 'ADOPTION'),
    [events],
  )
  const eventTitleById = useMemo(() => {
    const map = {}
    for (const event of events) map[event.id] = event.title
    return map
  }, [events])

  async function saveAnimal(payload) {
    try {
      if (modal?.mode === 'edit') {
        await updateAnimal(modal.animal.id, payload)
        setBanner({ type: 'success', text: `“${payload.name}” updated.` })
      } else {
        await createAnimal(payload)
        setBanner({ type: 'success', text: `“${payload.name}” added as AVAILABLE.` })
      }
      setModal(null)
      reload()
    } catch (err) {
      throw err // AnimalForm renders 400/404/409 messages
    }
  }

  async function runToggle() {
    if (!confirm) return
    setBusy(true)
    setConfirm(null)
    setBanner(null)
    try {
      const updated = await changeStatus(confirm.animal.id, confirm.target)
      setBanner({
        type: 'success',
        text: `“${updated.name}” is now ${updated.status}.`,
      })
      reload()
    } catch (err) {
      setBanner({ type: 'error', text: err.message })
      reload()
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <section className="page">
        <Spinner label="Loading animals…" />
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

  const visible = animals.filter((animal) => {
    const okStatus = statusFilter === 'ALL' || animal.status === statusFilter
    const okEvent =
      eventFilter === 'ALL' || String(animal.eventId ?? '') === String(eventFilter)
    return okStatus && okEvent
  })

  return (
    <section className="page">
      <div className="page-head">
        <h1>Animals</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setModal({ mode: 'create' })}
        >
          Add animal
        </button>
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

      <div className="toolbar" role="group" aria-label="Filters">
        {STATUS_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            className={statusFilter === value ? 'chip active' : 'chip'}
            onClick={() => setStatusFilter(value)}
          >
            {value === 'ALL'
              ? `All (${animals.length})`
              : `${value.charAt(0) + value.slice(1).toLowerCase()} (${
                  animals.filter((animal) => animal.status === value).length
                })`}
          </button>
        ))}
        <select
          className="select-inline"
          aria-label="Filter by event"
          value={String(eventFilter)}
          onChange={(e) => setEventFilter(e.target.value)}
        >
          <option value="ALL">All events</option>
          {events.map((event) => (
            <option key={event.id} value={String(event.id)}>
              {event.title}
            </option>
          ))}
        </select>
      </div>

      {animals.length === 0 ? (
        <EmptyState
          title="No animals yet"
          message="Add your first animal - it becomes publicly visible in the adoption catalogue as AVAILABLE."
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModal({ mode: 'create' })}
          >
            Add animal
          </button>
        </EmptyState>
      ) : visible.length === 0 ? (
        <p className="muted-block">No animals match the selected filters.</p>
      ) : (
        <div className="table-wrap">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Animal</th>
                <th>Species</th>
                <th>Event</th>
                <th>Status</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((animal) => (
                <tr key={animal.id}>
                  <td data-label="Animal">
                    <strong>{animal.name}</strong>
                    {animal.breed ? <><br /><span className="muted-cell">{animal.breed}</span></> : null}
                  </td>
                  <td data-label="Species">
                    {animal.species}
                    {animal.age ? <><br /><span className="muted-cell">{animal.age}</span></> : null}
                  </td>
                  <td data-label="Event">
                    {animal.eventId && eventTitleById[animal.eventId] ? (
                      eventTitleById[animal.eventId]
                    ) : (
                      <span className="muted-cell">—</span>
                    )}
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={animal.status} />
                  </td>
                  <td data-label="Added">{formatDate(animal.createdAt)}</td>
                  <td data-label="Actions">
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setModal({ mode: 'edit', animal })}
                      >
                        Edit
                      </button>
                      {animal.status === 'ADOPTED' ? (
                        <span className="muted-cell" title="Adopted animals are terminal">
                          Adopted
                        </span>
                      ) : (
                        <button
                          type="button"
                          className={
                            animal.status === 'AVAILABLE'
                              ? 'btn btn-danger btn-sm'
                              : 'btn btn-primary btn-sm'
                          }
                          onClick={() =>
                            setConfirm({
                              animal,
                              target: animal.status === 'AVAILABLE' ? 'HIDDEN' : 'AVAILABLE',
                            })
                          }
                        >
                          {animal.status === 'AVAILABLE' ? 'Hide' : 'Show'}
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

      {/* ---- create / edit modal ---- */}
      <Modal
        open={Boolean(modal)}
        title={modal?.mode === 'edit' ? `Edit ${modal.animal?.name}` : 'Add animal'}
        onClose={() => (busy ? undefined : setModal(null))}
      >
        {modal && (
          <AnimalForm
            initial={modal.mode === 'edit' ? modal.animal : undefined}
            adoptionEvents={adoptionEvents}
            submitting={busy}
            submitLabel={modal.mode === 'edit' ? 'Save changes' : 'Add animal'}
            onCancel={() => setModal(null)}
            onSubmit={async (payload) => {
              setBusy(true)
              try {
                await saveAnimal(payload)
              } finally {
                setBusy(false)
              }
            }}
          />
        )}
      </Modal>

      {/* ---- hide/show confirmation ---- */}
      <Modal
        open={Boolean(confirm)}
        title={
          confirm?.target === 'HIDDEN'
            ? 'Hide this animal from the public?'
            : 'Make this animal publicly available?'
        }
        onClose={() => (busy ? undefined : setConfirm(null))}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirm(null)}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="button"
              className={confirm?.target === 'HIDDEN' ? 'btn btn-danger' : 'btn btn-primary'}
              onClick={runToggle}
              disabled={busy}
            >
              {busy ? 'Working…' : confirm?.target === 'HIDDEN' ? 'Hide' : 'Show'}
            </button>
          </>
        }
      >
        <p>
          {confirm?.target === 'HIDDEN'
            ? 'The animal disappears from the public adoption catalogue (soft hide - it can be shown again at any time).'
            : 'The animal reappears in the public adoption catalogue as AVAILABLE.'}
        </p>
        {confirm && (
          <p>
            <strong>{confirm.animal.name}</strong>
          </p>
        )}
      </Modal>
    </section>
  )
}
