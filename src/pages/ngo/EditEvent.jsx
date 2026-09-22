import { useParams } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState.jsx'

/**
 * Edit Event route (/ngo/events/:id/edit) - Session 14 placeholder.
 *
 * Reads the event id from the URL (useParams) - the real page will load
 * GET /api/ngo/events/{id} (own events only, foreign -> 404) and PUT the
 * updated fields; status transitions stay on the publish/unpublish/cancel
 * actions. Form logic is implemented in a later session. Guarded by
 * RoleRoute.
 */
export default function EditEvent() {
  const { id } = useParams()

  return (
    <section className="page page-narrow">
      <h1>Edit Event</h1>
      <EmptyState
        title={`Editing event #${id}`}
        message="The event form will be pre-filled from GET /api/ngo/events/{id} here."
      />
    </section>
  )
}
