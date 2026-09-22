import { useParams } from 'react-router-dom'

/**
 * Event details - Session 02 placeholder.
 * Real event data comes from the API in Session 15.
 */
export default function EventDetails() {
  const { id } = useParams()

  return (
    <section className="page">
      <h1>Event Details</h1>
      <p className="lead">Event #{id} will be shown here.</p>
      <div className="empty-state">
        <p>Event data is loaded from the backend in Session 15.</p>
      </div>
    </section>
  )
}
