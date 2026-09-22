import EmptyState from '../../components/common/EmptyState.jsx'

/**
 * NGO Profile route (/ngo/profile) - Session 14 placeholder.
 *
 * Will read GET /api/ngo/profile and edit it with PUT /api/ngo/profile
 * (ngoApi.getProfile / updateProfile; orgName is required, other fields
 * full-replacement). Data wiring in a later session. Guarded by RoleRoute.
 */
export default function Profile() {
  return (
    <section className="page page-narrow">
      <h1>Organization Profile</h1>
      <EmptyState
        title="Profile coming soon"
        message="Your NGO name, description, address and contact details will be editable here."
      />
    </section>
  )
}
