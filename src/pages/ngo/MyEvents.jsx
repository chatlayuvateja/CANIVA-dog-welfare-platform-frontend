import { Link } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState.jsx'

/**
 * My Events route (/ngo/events) - Session 14 architecture placeholder.
 *
 * Will list the NGO's own events in all statuses via
 * GET /api/ngo/events (eventApi.listOwnEvents) with publish/unpublish/cancel
 * actions - data wiring is done in a later session. Guarded by RoleRoute.
 */
export default function MyEvents() {
  return (
    <section className="page">
      <h1>My Events</h1>
      <div className="page-actions">
        <Link className="btn btn-primary" to="/ngo/events/new">
          Create Event
        </Link>
      </div>
      <EmptyState
        title="No events loaded yet"
        message="Your DRAFT / PUBLISHED / CANCELLED events will be listed here."
      />
    </section>
  )
}
