import { useState } from 'react'
import { eventTypeLabel } from '../../utils/constants.js'
import { fieldErrorsToObject, hasErrors } from '../../utils/validators.js'
import FormField from './FormField.jsx'
import FormError from './FormError.jsx'

const EVENT_OPTIONS = ['DOG_REGISTRATION', 'VACCINATION', 'ADOPTION'].map((value) => ({
  value,
  label: eventTypeLabel(value),
}))

/** Local today as yyyy-MM-dd (timezone-safe - no UTC shift). */
function todayIso() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/**
 * Shared create/edit event form (Session 17).
 *
 * Client validation mirrors EventCreateRequest / EventUpdateRequest exactly:
 * title* <=150, eventType*, location* <=255, eventDate* not in the past,
 * startTime*, endTime*, capacity* >=1 (the MVP UI always sends a
 * capacity; the backend would accept null), slotsEnabled checkbox.
 * `status` is NEVER part of the payload - transitions happen only through
 * the publish/unpublish/cancel actions on My Events.
 *
 * `onSubmit(payload)` must perform the API call and REJECT with
 * { status, message, fieldErrors } on failure; this component renders
 * 400 field errors per field and 404/409 messages via FormError.
 */
export default function EventForm({
  initial,
  submitting = false,
  submitLabel = 'Save',
  onCancel,
  onSubmit,
}) {
  const [form, setForm] = useState(() => ({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    eventType: initial?.eventType ?? '',
    location: initial?.location ?? '',
    eventDate: initial?.eventDate ?? '',
    startTime: String(initial?.startTime ?? '').slice(0, 5),
    endTime: String(initial?.endTime ?? '').slice(0, 5),
    capacity: initial?.capacity != null ? String(initial.capacity) : '',
    slotsEnabled: initial?.slotsEnabled === true,
  }))
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)

  function validate() {
    const next = {}
    if (!form.title.trim()) next.title = 'Title is required'
    else if (form.title.trim().length > 150) next.title = 'Max 150 characters'
    if (!form.eventType) next.eventType = 'Event type is required'
    if (!form.location.trim()) next.location = 'Location is required'
    else if (form.location.trim().length > 255) next.location = 'Max 255 characters'
    if (!form.eventDate) {
      next.eventDate = 'Date is required'
    } else if (form.eventDate < todayIso()) {
      next.eventDate = 'Date cannot be in the past'
    }
    if (!form.startTime) next.startTime = 'Start time is required'
    if (!form.endTime) next.endTime = 'End time is required'
    if (!form.capacity.trim()) {
      next.capacity = 'Capacity is required'
    } else if (!Number.isInteger(Number(form.capacity)) || Number(form.capacity) < 1) {
      next.capacity = 'Capacity must be a whole number of at least 1'
    }
    return next
  }

  async function handleSubmit(domEvent) {
    domEvent.preventDefault()
    const clientErrors = validate()
    setErrors(clientErrors)
    setApiError(null)
    if (hasErrors(clientErrors)) return

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      eventType: form.eventType,
      location: form.location.trim(),
      eventDate: form.eventDate,
      startTime: form.startTime,
      endTime: form.endTime,
      capacity: Number(form.capacity),
      slotsEnabled: form.slotsEnabled === true,
    }

    try {
      await onSubmit(payload)
    } catch (err) {
      setApiError(err)
      setErrors(fieldErrorsToObject(err))
    }
  }

  function update(field) {
    return (e) =>
      setForm((prev) => ({
        ...prev,
        [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
      }))
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <FormError message={apiError?.message} />

      <FormField
        label="Title"
        name="title"
        required
        maxLength={150}
        value={form.title}
        onChange={update('title')}
        error={errors.title}
      />
      <FormField
        label="Description"
        name="description"
        type="textarea"
        maxLength={2000}
        value={form.description}
        onChange={update('description')}
        error={errors.description}
      />
      <FormField
        label="Event type"
        name="eventType"
        required
        value={form.eventType}
        onChange={update('eventType')}
        options={EVENT_OPTIONS}
        error={errors.eventType}
      />
      <FormField
        label="Location"
        name="location"
        required
        maxLength={255}
        value={form.location}
        onChange={update('location')}
        error={errors.location}
      />
      <FormField
        label="Date"
        name="eventDate"
        type="date"
        min={todayIso()}
        required
        value={form.eventDate}
        onChange={update('eventDate')}
        error={errors.eventDate}
      />
      <FormField
        label="Start time"
        name="startTime"
        type="time"
        required
        value={form.startTime}
        onChange={update('startTime')}
        error={errors.startTime}
      />
      <FormField
        label="End time"
        name="endTime"
        type="time"
        required
        value={form.endTime}
        onChange={update('endTime')}
        error={errors.endTime}
      />
      <FormField
        label="Capacity (max registrations)"
        name="capacity"
        type="number"
        min={1}
        step={1}
        required
        value={form.capacity}
        onChange={update('capacity')}
        error={errors.capacity}
      />

      <div className="form-field checkbox-field">
        <label htmlFor="slotsEnabled">
          <input
            id="slotsEnabled"
            name="slotsEnabled"
            type="checkbox"
            checked={form.slotsEnabled}
            onChange={update('slotsEnabled')}
          />{' '}
          Use time slots (visitors pick a slot when registering)
        </label>
        {form.slotsEnabled && (
          <p className="form-hint">
            Recommended for vaccination camps with limited per-slot capacity.
          </p>
        )}
      </div>

      <div className="action-row">
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button className="btn btn-secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
