import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createEvent } from '../../api/eventApi.js'
import EventForm from '../../components/forms/EventForm.jsx'

/**
 * Create Event (Session 17). POST /api/ngo/events - the response is always
 * DRAFT; publishing happens from My Events. Validation + API errors are
 * handled by the shared EventForm (400 fieldErrors per field).
 */
export default function CreateEvent() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(payload) {
    setSubmitting(true)
    try {
      const created = await createEvent(payload)
      navigate('/ngo/events', {
        state: { flash: `“${created.title}” created as DRAFT - publish it when you are ready.` },
      })
    } catch (err) {
      throw err // EventForm renders 400/409/404 messages
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page page-narrow">
      <p>
        <Link to="/ngo/events">← Back to my events</Link>
      </p>
      <h1>Create event</h1>
      <div className="workflow-intro">
        <p>
          New events start as <strong>DRAFT</strong>: nothing is visible to the public
          until you press Publish on the My Events page.
        </p>
      </div>

      <EventForm
        submitLabel="Create event"
        submitting={submitting}
        onCancel={() => navigate('/ngo/events')}
        onSubmit={handleSubmit}
      />
    </section>
  )
}
