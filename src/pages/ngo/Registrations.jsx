import EmptyState from '../../components/common/EmptyState.jsx'

/**
 * Registrations route (/ngo/registrations) - Session 14 placeholder.
 *
 * Will show the NGO's dog + vaccination registrations for its own events:
 *   GET /api/ngo/events/{eventId}/dog-registrations            (list)
 *   GET /api/ngo/events/{eventId}/vaccination-registrations    (list)
 * with the verify / reject / complete / no-show actions (each only valid
 * from its initial state, else 409). Data wiring in a later session.
 * Guarded by RoleRoute.
 */
export default function Registrations() {
  return (
    <section className="page">
      <h1>Registrations</h1>
      <p className="lead">Dog registrations and vaccination bookings for your events.</p>
      <EmptyState
        title="No registrations loaded yet"
        message="Pick one of your published events to see its registrations here."
      />
    </section>
  )
}
