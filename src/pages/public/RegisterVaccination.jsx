import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPublishedEvent } from '../../api/eventApi.js'
import { listSlots, submitForEvent } from '../../api/vaccinationApi.js'
import { eventTypeLabel } from '../../utils/constants.js'
import { formatDate, formatTime } from '../../utils/date.js'
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
 * Vaccination workflow (Session 16):
 *   Event Details -> Register -> Owner/Pet details (+ slot when the event
 *   uses slots) -> Submit -> Confirmation -> status in My Activities.
 *
 * POST /api/events/{id}/vaccination-registrations (Bearer - guests are sent
 * to /login by ProtectedRoute). Slot rules come straight from the backend:
 * slotId is REQUIRED iff event.slotsEnabled (the public
 * GET /api/events/{id}/slots list powers the picker; full slots are
 * disabled). On a 409 (capacity race) the slot counts are reloaded so the
 * user sees the current state. 400 field errors merge per field; 404 for
 * unknown/draft/cancelled events renders the ApiError message.
 */
export default function RegisterVaccination() {
  const { id } = useParams()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  const [slots, setSlots] = useState([])
  const [slotsError, setSlotsError] = useState(null)
  const [slotsLoading, setSlotsLoading] = useState(false)

  const [form, setForm] = useState({
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    ownerAddress: '',
    petName: '',
    species: '',
    breed: '',
    age: '',
    gender: '',
    slotId: '',
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)

  const slotsEnabled = event?.slotsEnabled === true

  const loadSlots = useCallback(async () => {
    setSlotsLoading(true)
    setSlotsError(null)
    try {
      const data = await listSlots(id)
      setSlots(Array.isArray(data) ? data : [])
    } catch (err) {
      setSlotsError(err)
    } finally {
      setSlotsLoading(false)
    }
  }, [id])

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

  // Slots are only fetched for events that actually use them (loaded event).
  useEffect(() => {
    if (event?.slotsEnabled) loadSlots()
  }, [event, loadSlots])

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
    if (!form.petName.trim()) next.petName = "Pet's name is required"
    if (slotsEnabled && !form.slotId) next.slotId = 'Please select a time slot'
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
      petName: form.petName.trim(),
    }
    if (form.ownerEmail.trim()) payload.ownerEmail = form.ownerEmail.trim()
    if (form.ownerAddress.trim()) payload.ownerAddress = form.ownerAddress.trim()
    if (form.species.trim()) payload.species = form.species.trim()
    if (form.breed.trim()) payload.breed = form.breed.trim()
    if (form.age.trim()) payload.age = form.age.trim()
    if (form.gender.trim()) payload.gender = form.gender.trim()
    if (slotsEnabled) payload.slotId = Number(form.slotId)

    setSubmitting(true)
    try {
      const registration = await submitForEvent(id, payload)
      setCreated(registration)
    } catch (err) {
      setApiError(err)
      setErrors(fieldErrorsToObject(err))
      // 409 = capacity race (event or slot filled meanwhile): refresh the
      // picker so the user sees the current availability immediately.
      if (err.status === 409 && slotsEnabled) loadSlots()
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

  if (event.eventType !== 'VACCINATION') {
    return (
      <section className="page not-found-state">
        <h1>Registration not possible</h1>
        <p>
          “{event.title}” is a {eventTypeLabel(event.eventType)} event and does not
          accept vaccination registrations.
        </p>
        <p>
          <Link className="btn btn-primary" to={`/events/${event.id}`}>
            Back to event
          </Link>
        </p>
      </section>
    )
  }

  const slotOptions = slots.map((slot) => ({
    value: String(slot.id),
    label:
      `${slot.slotLabel}` +
      (slot.slotTime ? ` · ${formatTime(slot.slotTime)}` : '') +
      ` — ${slot.remainingCount} of ${slot.capacity} free` +
      (slot.remainingCount === 0 ? ' (FULL)' : ''),
    disabled: slot.remainingCount === 0,
  }))

  // ---- confirmation --------------------------------------------------------
  if (created) {
    return (
      <section className="page page-narrow">
        <SuccessPanel
          title="Vaccination booking confirmed!"
          badge={<StatusBadge status={created.status} />}
          message={
            created.slotLabel
              ? `Your slot is booked: ${created.slotLabel}. Bring your pet to the camp on the event date.`
              : 'Your booking is confirmed. Bring your pet to the camp on the event date.'
          }
        >
          <ul className="summary-list">
            <li>
              <span className="meta-label">Event</span>
              <span>{created.eventTitle}</span>
            </li>
            <li>
              <span className="meta-label">Pet</span>
              <span>{created.petName}</span>
            </li>
            <li>
              <span className="meta-label">Slot</span>
              <span>{created.slotLabel ?? 'Walk-in (no slots)'}</span>
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
      <h1>Register for vaccination</h1>

      <div className="workflow-intro">
        <h2>{event.title}</h2>
        <p>
          {eventTypeLabel(event.eventType)} · {formatDate(event.eventDate)} ·{' '}
          {event.location}
        </p>
        <p>
          {slotsEnabled
            ? 'This camp uses time slots - pick your preferred slot below.'
            : 'Walk-in event - no slot needed.'}
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
            label="Address (optional)"
            name="ownerAddress"
            type="textarea"
            autoComplete="street-address"
            value={form.ownerAddress}
            onChange={update('ownerAddress')}
            error={errors.ownerAddress}
          />
        </div>

        <div className="form-section">
          <h2>Pet details</h2>
          <FormField
            label="Pet's name"
            name="petName"
            required
            value={form.petName}
            onChange={update('petName')}
            error={errors.petName}
          />
          <FormField
            label="Species (optional)"
            name="species"
            placeholder="e.g. Dog, Cat"
            value={form.species}
            onChange={update('species')}
            error={errors.species}
          />
          <FormField
            label="Breed (optional)"
            name="breed"
            value={form.breed}
            onChange={update('breed')}
            error={errors.breed}
          />
          <FormField
            label="Age (optional)"
            name="age"
            placeholder="e.g. 2 yr"
            value={form.age}
            onChange={update('age')}
            error={errors.age}
          />
          <FormField
            label="Gender (optional)"
            name="gender"
            value={form.gender}
            onChange={update('gender')}
            error={errors.gender}
          />
        </div>

        {slotsEnabled && (
          <div className="form-section">
            <h2>Time slot</h2>
            {slotsLoading ? (
              <Spinner label="Loading slots…" />
            ) : slotsError ? (
              <ErrorMessage
                message={slotsError.message}
                onRetry={loadSlots}
              />
            ) : (
              <FormField
                label="Choose a slot"
                name="slotId"
                required
                value={form.slotId}
                onChange={update('slotId')}
                options={slotOptions}
                error={errors.slotId}
              />
            )}
          </div>
        )}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Booking…' : 'Submit registration'}
        </button>
      </form>
    </section>
  )
}
