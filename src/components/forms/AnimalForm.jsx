import { useState } from 'react'
import FormField from './FormField.jsx'
import FormError from './FormError.jsx'
import { fieldErrorsToObject, hasErrors } from '../../utils/validators.js'

const GENDER_OPTIONS = ['Male', 'Female', 'Other']

/**
 * Animal create/edit form (Session 17) - used inside the Animals page modal.
 *
 * Mirrors AnimalCreateRequest / AnimalUpdateRequest: name* <=100,
 * species* <=50, breed/age/gender optional, description <=2000,
 * imageUrl optional external http(s) URL (same rule as the backend
 * @Pattern), adoptionEvent optional link to one of the NGO's own
 * ADOPTION events (event id sent only when chosen; omitted on PUT clears
 * the link - PUT is a full replacement). Status/ownership are NEVER sent.
 *
 * `onSubmit(payload)` must call the API and REJECT with
 * { status, message, fieldErrors } on failure.
 */
export default function AnimalForm({
  initial,
  adoptionEvents = [],
  submitting = false,
  submitLabel = 'Save',
  onCancel,
  onSubmit,
}) {
  const [form, setForm] = useState(() => ({
    name: initial?.name ?? '',
    species: initial?.species ?? '',
    breed: initial?.breed ?? '',
    age: initial?.age ?? '',
    gender: initial?.gender ?? '',
    description: initial?.description ?? '',
    imageUrl: initial?.imageUrl ?? '',
    eventId: initial?.eventId != null ? String(initial.eventId) : '',
  }))
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)

  function validate() {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.species.trim()) next.species = 'Species is required'
    if (form.imageUrl.trim() && !/^https?:\/\/\S+$/.test(form.imageUrl.trim())) {
      next.imageUrl = 'Must be a full http(s):// address'
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
      name: form.name.trim(),
      species: form.species.trim(),
      breed: form.breed.trim(),
      age: form.age.trim(),
      gender: form.gender.trim(),
      description: form.description.trim(),
    }
    // Omitted optional fields = null (PUT full-replacement semantics).
    if (form.imageUrl.trim()) payload.imageUrl = form.imageUrl.trim()
    if (form.eventId) payload.eventId = Number(form.eventId)

    try {
      await onSubmit(payload)
    } catch (err) {
      setApiError(err)
      setErrors(fieldErrorsToObject(err))
    }
  }

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const genderOptions = GENDER_OPTIONS.includes(form.gender)
    ? GENDER_OPTIONS.map((value) => ({ value, label: value }))
    : [
        ...GENDER_OPTIONS.map((value) => ({ value, label: value })),
        ...(form.gender ? [{ value: form.gender, label: form.gender }] : []),
      ]

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <FormError message={apiError?.message} />

      <FormField
        label="Name"
        name="name"
        required
        maxLength={100}
        value={form.name}
        onChange={update('name')}
        error={errors.name}
      />
      <FormField
        label="Species"
        name="species"
        required
        maxLength={50}
        placeholder="e.g. Dog, Cat"
        value={form.species}
        onChange={update('species')}
        error={errors.species}
      />
      <FormField
        label="Breed (optional)"
        name="breed"
        maxLength={100}
        value={form.breed}
        onChange={update('breed')}
        error={errors.breed}
      />
      <FormField
        label="Age (optional)"
        name="age"
        maxLength={50}
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
        options={genderOptions}
        error={errors.gender}
      />
      <FormField
        label="Description (optional)"
        name="description"
        type="textarea"
        maxLength={2000}
        value={form.description}
        onChange={update('description')}
        error={errors.description}
      />
      <FormField
        label="Photo URL (optional)"
        name="imageUrl"
        type="url"
        placeholder="https://…"
        value={form.imageUrl}
        onChange={update('imageUrl')}
        error={errors.imageUrl}
      />

      {adoptionEvents.length > 0 && (
        <FormField
          label="Adoption event (optional)"
          name="eventId"
          value={form.eventId}
          onChange={update('eventId')}
          options={adoptionEvents.map((event) => ({
            value: String(event.id),
            label: `${event.title} · ${event.eventDate}`,
          }))}
          error={errors.eventId}
        />
      )}

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
