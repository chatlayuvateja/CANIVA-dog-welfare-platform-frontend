import { useEffect, useRef, useState } from 'react'
import FormField from './FormField.jsx'
import FormError from './FormError.jsx'
import { fieldErrorsToObject, hasErrors } from '../../utils/validators.js'
import { fetchOwnImageObjectUrl } from '../../api/animalApi.js'

const GENDER_OPTIONS = ['Male', 'Female', 'Other']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * Animal create/edit form (Session 17) - used inside the Animals page modal.
 *
 * Mirrors AnimalCreateRequest / AnimalUpdateRequest: name* <=100,
 * species* <=50, breed/age/gender optional, description <=2000,
 * adoptionEvent optional link to one of the NGO's own ADOPTION events
 * (event id sent only when chosen; omitted on PUT clears the link - PUT is
 * a full replacement). Status/ownership are NEVER sent.
 *
 * Image: a file picker replaces the URL field. The chosen file (<=5 MB,
 * JPEG/PNG/WebP/GIF - the backend re-checks both from the magic bytes) is
 * uploaded right after the save; the old legacy imageUrl is echoed
 * unchanged on PUT so a text-only edit never wipes an existing photo link
 * (unless the user presses "Remove photo").
 *
 * `onSubmit(payload, imageOps)` must call the API and REJECT with
 * { status, message, fieldErrors } on failure, where imageOps is
 * { file: File|null, removeImage: boolean }.
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
    eventId: initial?.eventId != null ? String(initial.eventId) : '',
  }))
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)

  const [file, setFile] = useState(null) // chosen photo, uploaded after save
  const [removeImage, setRemoveImage] = useState(false)
  const [imageError, setImageError] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  // Legacy external URL shows instantly; an uploaded photo is fetched
  // below as a blob (the NGO endpoint needs a Bearer header).
  const [currentPreview, setCurrentPreview] = useState(initial?.imageUrl ?? null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!initial?.hasImage || initial?.id == null) return undefined
    let stale = false
    let objectUrl = null
    fetchOwnImageObjectUrl(initial.id)
      .then((url) => {
        if (stale) {
          URL.revokeObjectURL(url)
          return
        }
        objectUrl = url
        setCurrentPreview(url)
      })
      .catch(() => {
        if (!stale) setCurrentPreview(null)
      })
    return () => {
      stale = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [initial?.id, initial?.hasImage])

  useEffect(() => {
    if (!file) {
      setFilePreview(null)
      return undefined
    }
    const url = URL.createObjectURL(file)
    setFilePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function validate() {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.species.trim()) next.species = 'Species is required'
    return next
  }

  async function handleSubmit(domEvent) {
    domEvent.preventDefault()
    const clientErrors = validate()
    setErrors(clientErrors)
    setApiError(null)
    if (hasErrors(clientErrors) || imageError) return

    const payload = {
      name: form.name.trim(),
      species: form.species.trim(),
      breed: form.breed.trim(),
      age: form.age.trim(),
      gender: form.gender.trim(),
      description: form.description.trim(),
    }
    // Omitted optional fields = null (PUT full-replacement semantics).
    // The legacy URL field is gone from the UI, so echo the stored value -
    // otherwise a plain text edit would silently clear an existing photo
    // link. "Remove photo" opts out of the echo. A fresh upload clears the
    // URL server-side anyway.
    if (!removeImage && initial?.imageUrl) payload.imageUrl = initial.imageUrl
    if (form.eventId) payload.eventId = Number(form.eventId)

    try {
      await onSubmit(payload, { file, removeImage })
    } catch (err) {
      setApiError(err)
      setErrors(fieldErrorsToObject(err))
    }
  }

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  function handleFileChange(event) {
    const chosen = event.target.files?.[0] ?? null
    if (!chosen) {
      setFile(null)
      setImageError(null)
      return
    }
    if (chosen.size > MAX_IMAGE_BYTES) {
      event.target.value = ''
      setFile(null)
      setImageError('Image must be 5 MB or smaller')
      return
    }
    if (chosen.type && !IMAGE_TYPES.includes(chosen.type)) {
      event.target.value = ''
      setFile(null)
      setImageError('Only JPEG, PNG, WebP or GIF images are allowed')
      return
    }
    setImageError(null)
    setRemoveImage(false) // a new photo replaces the current one
    setFile(chosen)
  }

  function clearSelectedFile() {
    setFile(null)
    setImageError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const hasCurrent = Boolean(initial && (initial.hasImage || initial.imageUrl))
  const displaySrc = file ? filePreview : removeImage ? null : currentPreview

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

      <div className="form-field">
        <label htmlFor="imageFile">
          Photo (optional)
        </label>
        <input
          ref={fileInputRef}
          id="imageFile"
          name="imageFile"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          aria-invalid={imageError ? true : undefined}
        />
        <p className="file-hint">JPEG, PNG, WebP or GIF - up to 5 MB.</p>
        {imageError && (
          <span className="field-error" role="alert">
            {imageError}
          </span>
        )}
        {errors.imageUrl && (
          <span className="field-error" role="alert">
            {errors.imageUrl}
          </span>
        )}

        {displaySrc ? (
          <div className="image-preview">
            <img
              src={displaySrc}
              alt={file ? 'Selected photo preview' : 'Current photo'}
            />
          </div>
        ) : (
          removeImage &&
          hasCurrent && (
            <p className="file-hint">
              The current photo will be removed when you save.
            </p>
          )
        )}

        {file && (
          <button type="button" className="btn-link" onClick={clearSelectedFile}>
            Clear selected photo
          </button>
        )}
        {!file && hasCurrent && !removeImage && (
          <button
            type="button"
            className="btn-link"
            onClick={() => setRemoveImage(true)}
          >
            Remove photo
          </button>
        )}
        {!file && hasCurrent && removeImage && (
          <button
            type="button"
            className="btn-link"
            onClick={() => setRemoveImage(false)}
          >
            Undo remove
          </button>
        )}
      </div>

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
