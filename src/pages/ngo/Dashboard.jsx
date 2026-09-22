import EmptyState from '../../components/common/EmptyState.jsx'

/**
 * NGO Dashboard route (/ngo) - Session 14 architecture placeholder.
 *
 * Will render the seven live counters from GET /api/ngo/dashboard
 * (ngoApi.getDashboard) with loading/error/empty states - data wiring is
 * done in a later session. Guarded by RoleRoute (NGO).
 */
export default function Dashboard() {
  return (
    <section className="page">
      <h1>Dashboard</h1>
      <p className="lead">Your NGO at a glance.</p>
      <EmptyState
        title="Live counters coming soon"
        message="Events, registrations, animals and applications will be loaded from GET /api/ngo/dashboard."
      />
    </section>
  )
}
