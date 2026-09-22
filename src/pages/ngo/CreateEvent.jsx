import EmptyState from '../../components/common/EmptyState.jsx'

/**
 * Create Event route (/ngo/events/new) - Session 14 architecture placeholder.
 *
 * Will host the event form (using the reusable FormField components) that
 * POSTs to /api/ngo/events - the created event always starts DRAFT server-
 * side; `status` is never sent. Form logic is implemented in a later
 * session. Guarded by RoleRoute.
 */
export default function CreateEvent() {
  return (
    <section className="page page-narrow">
      <h1>Create Event</h1>
      <EmptyState
        title="Event form coming soon"
        message="Fields: title, description, type, location, date, times, capacity, slots. On save the event is created as DRAFT."
      />
    </section>
  )
}
