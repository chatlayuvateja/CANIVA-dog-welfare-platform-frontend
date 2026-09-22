import { Link } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState.jsx'

/**
 * Animals route (/ngo/animals) - Session 14 placeholder.
 *
 * Will list the NGO's OWN animals in all statuses
 * (GET /api/ngo/animals, animalApi.listOwnAnimals) with create / edit /
 * hide-show toggle actions (AVAILABLE <-> HIDDEN; ADOPTED is terminal and
 * system-set only). Data wiring in a later session. Guarded by RoleRoute.
 */
export default function Animals() {
  return (
    <section className="page">
      <h1>Animals</h1>
      <div className="page-actions">
        <Link className="btn btn-primary" to="/ngo/animals/new">
          Add Animal
        </Link>
      </div>
      <EmptyState
        title="No animals loaded yet"
        message="Your AVAILABLE / HIDDEN / ADOPTED listings will appear here."
      />
    </section>
  )
}
