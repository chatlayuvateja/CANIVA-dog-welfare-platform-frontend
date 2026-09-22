import EmptyState from '../../components/common/EmptyState.jsx'

/**
 * Applications route (/ngo/applications) - Session 14 placeholder.
 *
 * Will show the decision inbox for the NGO's own animals
 * (GET /api/ngo/applications?status=…) with approve / reject actions:
 * approve is atomic (application APPROVED + animal ADOPTED + other PENDING
 * applications auto-REJECTED), both decisions only valid from PENDING
 * (else 409). Data wiring in a later session. Guarded by RoleRoute.
 */
export default function Applications() {
  return (
    <section className="page">
      <h1>Applications</h1>
      <p className="lead">Adoption applications for your animals.</p>
      <EmptyState
        title="No applications loaded yet"
        message="PENDING applications arrive here; approve or reject them with one action each."
      />
    </section>
  )
}
