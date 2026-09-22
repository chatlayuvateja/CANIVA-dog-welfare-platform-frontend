import { useParams } from 'react-router-dom'

/**
 * Animal details - Session 02 placeholder.
 * Real animal data comes from the API in Session 15.
 */
export default function AnimalDetails() {
  const { id } = useParams()

  return (
    <section className="page">
      <h1>Animal Details</h1>
      <p className="lead">Animal #{id} will be shown here.</p>
      <div className="empty-state">
        <p>Animal data is loaded from the backend in Session 15.</p>
      </div>
    </section>
  )
}
