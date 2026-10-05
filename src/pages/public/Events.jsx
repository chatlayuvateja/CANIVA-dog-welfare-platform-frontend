import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listPublishedEvents } from '../../api/eventApi.js'
import { EVENT_TYPES } from '../../utils/constants.js'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { EventGridSkeleton } from '../../components/common/Skeleton.jsx'
import FormField from '../../components/forms/FormField.jsx'
import EventCard from './EventCard.jsx'

const PAGE_SIZE = 10

/**
 * Events listing + filters (Session 15).
 *
 * Data comes from GET /api/events with the real query contract:
 *   ?type=DOG_REGISTRATION|VACCINATION|ADOPTION (exact enum names)
 *   &location=partial text &date=yyyy-MM-dd &page=0-based &size=1-100
 *
 * The filter/page state lives in the URL (useSearchParams), so refreshing,
 * sharing a link or using Back/Forward restores exactly the same view -
 * navigation never breaks the routing. Loading / API-error+retry / empty
 * (with a "clear filters" action) states are all covered.
 */
export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams()
  const type = searchParams.get('type') ?? ''
  const location = searchParams.get('location') ?? ''
  const date = searchParams.get('date') ?? ''
  const page = Math.max(0, Number.parseInt(searchParams.get('page') ?? '0', 10) || 0)

  // Local draft for the filter form; re-synced when the URL changes
  // (Back/Forward, refreshed link, "clear").
  const [draft, setDraft] = useState({ type, location, date })
  useEffect(() => {
    setDraft({ type, location, date })
  }, [type, location, date])

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  const filtersActive = Boolean(type || location || date)

  useEffect(() => {
    let stale = false
    setLoading(true)
    setError(null)

    const params = { page, size: PAGE_SIZE }
    if (type) params.type = type
    if (location) params.location = location
    if (date) params.date = date

    listPublishedEvents(params)
      .then((result) => {
        if (!stale) {
          setData(result)
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
  }, [type, location, date, page, retryKey])

  function applyFilters(event) {
    event.preventDefault()
    const next = {}
    if (draft.type) next.type = draft.type
    if (draft.location.trim()) next.location = draft.location.trim()
    if (draft.date) next.date = draft.date
    // page is intentionally dropped -> back to page 0
    setSearchParams(next)
  }

  function clearFilters() {
    setDraft({ type: '', location: '', date: '' })
    setSearchParams({})
  }

  function goToPage(nextPage) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  function updateDraft(field) {
    return (event) => setDraft((prev) => ({ ...prev, [field]: event.target.value }))
  }

  return (
    <section className="page">
      <p className="kicker">Gather</p>
      <h1>Events</h1>
      <p className="lead">Find a camp or drive near you and save your place.</p>

      <form className="filter-bar" role="search" aria-label="Filter events" onSubmit={applyFilters}>
        <FormField
          label="Event type"
          name="type"
          value={draft.type}
          onChange={updateDraft('type')}
          options={EVENT_TYPES}
        />
        <FormField
          label="Location"
          name="location"
          type="text"
          placeholder="e.g. Hyderabad"
          value={draft.location}
          onChange={updateDraft('location')}
        />
        <FormField
          label="Date"
          name="date"
          type="date"
          value={draft.date}
          onChange={updateDraft('date')}
        />
        <div className="filter-actions">
          <button className="btn btn-primary" type="submit">
            Apply filters
          </button>
          {filtersActive && (
            <button className="btn btn-secondary" type="button" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <EventGridSkeleton count={6} />
      ) : error ? (
        <ErrorMessage
          message={error.message}
          onRetry={() => setRetryKey((key) => key + 1)}
        />
      ) : data && data.content.length === 0 ? (
        filtersActive ? (
          <EmptyState
            title="No events match your filters"
            message="Try a different type, location or date."
          >
            <button className="btn btn-secondary" type="button" onClick={clearFilters}>
              Clear filters
            </button>
          </EmptyState>
        ) : (
          <EmptyState
            title="No events published yet"
            message="Check back soon - NGOs are always adding new camps."
          />
        )
      ) : data ? (
        <>
          <div className="event-grid">
            {data.content.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          <nav className="pagination" aria-label="Events pagination">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 0}
            >
              ← Previous
            </button>
            <span className="page-info">
              Page {data.page + 1} of {Math.max(1, data.totalPages)} ·{' '}
              {data.totalElements} event{data.totalElements === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => goToPage(page + 1)}
              disabled={data.last}
            >
              Next →
            </button>
          </nav>
        </>
      ) : null}
    </section>
  )
}
