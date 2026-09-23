import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPublishedEvent } from '../../api/eventApi.js'
import { submitForEvent } from '../../api/dogRegistrationApi.js'
import { eventTypeLabel } from '../../utils/constants.js'
import { formatDate } from '../../utils/date.js'
import {
  fieldErrorsToObject,
  hasErrors,
  isEmail,
  isPhone10,
} from '../../utils/validators.js'
import Spinner from '../../components/common/Spinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import SuccessPanel from '../../components/common/SuccessPanel.jsx'
import FormField from '../../components/forms/FormField.jsx'
import FormError from '../../components/forms/FormError.jsx'

/**
 * Dog registration workflow (Session 16):
 *   Event Details -> Register Pet -> Owner + Dog details -> Submit ->
 *   Confirmation -> track status in My Activities.
 *
 * POST /api/events/{id}/dog-registrations (Bearer - guests are sent to
 * /login by ProtectedRoute and returned here after login). The response
 * starts PRE_REGISTERED; the unique DREG number appears only after NGO
 * verification. Backend rejections surface honestly: 400 field errors merge
 * per field, 409 wrong type/closed/full and 404 unknown/draft/cancelled
 * render the ApiError message.
 */
export default function RegisterDog() {
  const { id } = useParams()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  const [form, setForm] = useState({
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    ownerAddress: '',
    dogName: '',
    breed: '',
    age: '',
    gender: '',
    colour: '',
    distinguishingMarks: '',
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)

  useEffect(() => {
    let stale = false
    setLoading(true)
    setError(null)
    getPublishedEvent(id)
      .then((data) => {
        if (!stale) {
          setEvent(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!stale) {
          setError(err)
          setLoading(false)
        }
      })
    return () => {
      stale = true
    }
  }, [id, retryKey])

  function validate() {
    const next = {}
    if (!form.ownerName.trim()) next.ownerName = 'Owner name is required'
    if (!form.ownerPhone.trim()) {
      next.ownerPhone = 'Phone is required'
    } else if (!isPhone10(form.ownerPhone)) {
      next.ownerPhone = 'Phone must be exactly 10 digits'
    }
    if (form.ownerEmail.trim() && !isEmail(form.ownerEmail)) {
      next.ownerEmail = 'Enter a valid email address'
    }
    if (!form.ownerAddress.trim()) next.ownerAddress = 'Address is required'
    if (!form.dogName.trim()) next.dogName = "Dog's name is required"
    if (!form.breed.trim()) next.breed = 'Breed is required'
    return next
  }

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault()
    const clientErrors = validate()
    setErrors(clientErrors)
    setApiError(null)
    if (hasErrors(clientErrors)) return

    const payload = {
      ownerName: form.ownerName.trim(),
      ownerPhone: form.ownerPhone.trim(),
      ownerAddress: form.ownerAddress.trim(),
      dogName: form.dogName.trim(),
      breed: form.breed.trim(),
    }
    if (form.ownerEmail.trim()) payload.ownerEmail = form.ownerEmail.trim()
    if (form.age.trim()) payload.age = form.age.trim()
    if (form.gender) payload.gender = form.gender
    if (form.colour.trim()) payload.colour = form.colour.trim()
    if (form.distinguishingMarks.trim()) {
      payload.distinguishingMarks = form.distinguishingMarks.trim()
    }

    setSubmitting(true)
    try {
      const registration = await submitForEvent(id, payload)
      setCreated(registration)
    } catch (err) {
      setApiError(err)
      setErrors(fieldErrorsToObject(err))
    } finally {
      setSubmitting(false)
    }
  }

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  // ---- load / guard states -------------------------------------------------
  if (loading) {
    return (
      <section className="page">
        <Spinner label="Loading event…" />
      </section>
    )
  }

  if (error && error.status === 404) {
    return (
      <section className="page not-found-state">
        <h1>Event not found</h1>
        <p>This event does not exist or is no longer published.</p>
        <p>
          <Link className="btn btn-primary" to="/events">
            Browse all events
          </Link>
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="page">
        <ErrorMessage message={error.message} onRetry={() => setRetryKey((k) => k + 1)} />
      </section>
    )
  }

  if (!event) return null

  if (event.eventType !== 'DOG_REGISTRATION') {
    return (
      <section className="page not-found-state">
        <h1>Registration not possible</h1>
        <p>
          “{event.title}” is a {eventTypeLabel(event.eventType)} event and does not
          accept dog registrations.
        </p>
        <p>
          <Link className="btn btn-primary" to={`/events/${event.id}`}>
            Back to event
          </Link>
        </p>
      </section>
    )
  }

  // ---- confirmation --------------------------------------------------------
  if (created) {
    return (
      <section className="page page-narrow">
        <SuccessPanel
          title="Dog registration submitted!"
          badge={<StatusBadge status={created.status} />}
          message="Your registration is now pre-registered. The NGO verifies details at the camp and your unique registration number (DREG-…) appears in My Activities once verified."
        >
          <ul className="summary-list">
            <li>
              <span className="meta-label">Event</span>
              <span>{created.eventTitle}</span>
            </li>
            <li>
              <span className="meta-label">Dog</span>
              <span>{created.dogName}</span>
            </li>
            <li>
              <span className="meta-label">Owner</span>
              <span>{created.ownerName}</span>
            </li>
            <li>
              <span className="meta-label">Status</span>
              <span>{created.status}</span>
            </li>
          </ul>
          <div className="action-row">
            <Link className="btn btn-primary" to="/my-activities">
              View in My Activities
            </Link>
            <Link className="btn btn-secondary" to={`/events/${event.id}`}>
              Back to event
            </Link>
          </div>
        </SuccessPanel>
      </section>
    )
  }

  // ---- form ----------------------------------------------------------------
  return (
    <section className="page page-narrow">
      <p>
        <Link to={`/events/${event.id}`}>← Back to event</Link>
      </p>
      <h1>Register your dog</h1>

      <div className="workflow-intro">
        <h2>{event.title}</h2>
        <p>
          {eventTypeLabel(event.eventType)} · {formatDate(event.eventDate)} ·{' '}
          {event.location}
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormError message={apiError?.message} />

        <div className="form-section">
          <h2>Owner details</h2>
          <FormField
            label="Owner name"
            name="ownerName"
            autoComplete="name"
            required
            value={form.ownerName}
            onChange={update('ownerName')}
            error={errors.ownerName}
          />
          <FormField
            label="Phone"
            name="ownerPhone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="10-digit number"
            required
            value={form.ownerPhone}
            onChange={update('ownerPhone')}
            error={errors.ownerPhone}
          />
          <FormField
            label="Email (optional)"
            name="ownerEmail"
            type="email"
            autoComplete="email"
            value={form.ownerEmail}
            onChange={update('ownerEmail')}
            error={errors.ownerEmail}
          />
          <FormField
            label="Address"
            name="ownerAddress"
            type="textarea"
            autoComplete="street-address"
            required
            value={form.ownerAddress}
            onChange={update('ownerAddress')}
            error={errors.ownerAddress}
          />
        </div>

        <div className="form-section">
          <h2>Dog details</h2>
          <FormField
            label="Dog's name"
            name="dogName"
            required
            value={form.dogName}
            onChange={update('dogName')}
            error={errors.dogName}
          />
          <FormField
            label="Breed"
            name="breed"
            required
            value={form.breed}
            onChange={update('breed')}
            error={errors.breed}
          />
          <FormField
            label="Age (optional)"
            name="age"
            placeholder="e.g. 3 yr"
            value={form.age}
            onChange={update('age')}
            error={errors.age}
          />
          <FormField
            label="Gender (optional)"
            name="gender"
            value={form.gender}
            onChange={update('gender')}
            options={[
              { value: 'Male', label: 'Male' },
              { value: 'Female', label: 'Female' },
              { value: 'Other', label: 'Other' },
            ]}
            error={errors.gender}
          />
          <FormField
            label="Colour (optional)"
            name="colour"
            value={form.colour}
            onChange={update('colour')}
            error={errors.colour}
          />
          <FormField
            label="Distinguishing marks (optional)"
            name="distinguishingMarks"
            type="textarea"
            value={form.distinguishingMarks}
            onChange={update('distinguishingMarks')}
            error={errors.distinguishingMarks}
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit registration'}
        </button>
      </form>
    </section>
  )
}
