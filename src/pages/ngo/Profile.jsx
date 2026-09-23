import { useEffect, useState } from 'react'
import { getProfile, updateProfile } from '../../api/ngoApi.js'
import { fieldErrorsToObject, hasErrors, isEmail } from '../../utils/validators.js'
import Spinner from '../../components/common/Spinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import FormField from '../../components/forms/FormField.jsx'
import FormError from '../../components/forms/FormError.jsx'

/**
 * NGO Profile (Session 17).
 *
 *   GET /api/ngo/profile -> own profile (404 only if no profile exists yet)
 *   PUT /api/ngo/profile -> full replacement; orgName required, the other
 *       fields may be omitted (cleared). Optional email/phone are only sent
 *       when filled, so empty values clear the stored ones.
 *
 * The profile is scoped to the caller's NGO server-side - there is no id in
 * the URL, so it can never be manipulated to show another NGO's data.
 */
export default function Profile() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [missing, setMissing] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  const [form, setForm] = useState({
    orgName: '',
    description: '',
    address: '',
    contactEmail: '',
    phone: '',
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let stale = false
    setLoading(true)
    setLoadError(null)
    setMissing(false)
    getProfile()
      .then((data) => {
        if (!stale) {
          setForm({
            orgName: data.orgName ?? '',
            description: data.description ?? '',
            address: data.address ?? '',
            contactEmail: data.contactEmail ?? '',
            phone: data.phone ?? '',
          })
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!stale) {
          if (err.status === 404) {
            // No profile stored yet - start with an empty form; PUT creates it.
            setMissing(true)
            setLoading(false)
          } else {
            setLoadError(err)
            setLoading(false)
          }
        }
      })
    return () => {
      stale = true
    }
  }, [retryKey])

  function validate() {
    const next = {}
    if (!form.orgName.trim()) next.orgName = 'Organisation name is required'
    else if (form.orgName.trim().length > 120) next.orgName = 'Max 120 characters'
    if (form.contactEmail.trim() && !isEmail(form.contactEmail)) {
      next.contactEmail = 'Enter a valid email address'
    }
    if (form.phone.trim().length > 20) next.phone = 'Max 20 characters'
    return next
  }

  async function handleSubmit(domEvent) {
    domEvent.preventDefault()
    const clientErrors = validate()
    setErrors(clientErrors)
    setApiError(null)
    setSaved(false)
    if (hasErrors(clientErrors)) return

    const payload = {
      orgName: form.orgName.trim(),
      description: form.description.trim(),
      address: form.address.trim(),
    }
    if (form.contactEmail.trim()) payload.contactEmail = form.contactEmail.trim()
    if (form.phone.trim()) payload.phone = form.phone.trim()

    setSaving(true)
    try {
      const updated = await updateProfile(payload)
      setForm({
        orgName: updated.orgName ?? '',
        description: updated.description ?? '',
        address: updated.address ?? '',
        contactEmail: updated.contactEmail ?? '',
        phone: updated.phone ?? '',
      })
      setMissing(false)
      setSaved(true)
    } catch (err) {
      setApiError(err)
      setErrors(fieldErrorsToObject(err))
    } finally {
      setSaving(false)
    }
  }

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  if (loading) {
    return (
      <section className="page">
        <Spinner label="Loading profile…" />
      </section>
    )
  }

  if (loadError) {
    return (
      <section className="page">
        <ErrorMessage
          message={loadError.message}
          onRetry={() => setRetryKey((k) => k + 1)}
        />
      </section>
    )
  }

  return (
    <section className="page page-narrow">
      <h1>NGO profile</h1>

      <div className="workflow-intro">
        <p>
          This profile is shown as the organiser on your public events and animal
          listings. It belongs to your NGO only - there is nothing in the URL to change.
        </p>
        {missing && (
          <p>
            <strong>No profile saved yet</strong> - fill the form below and save to
            create it.
          </p>
        )}
      </div>

      {saved && <div className="flash">Profile saved.</div>}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormError message={apiError?.message} />

        <FormField
          label="Organisation name"
          name="orgName"
          required
          maxLength={120}
          value={form.orgName}
          onChange={update('orgName')}
          error={errors.orgName}
        />
        <FormField
          label="About (optional)"
          name="description"
          type="textarea"
          maxLength={1000}
          value={form.description}
          onChange={update('description')}
          error={errors.description}
        />
        <FormField
          label="Address (optional)"
          name="address"
          type="textarea"
          maxLength={255}
          value={form.address}
          onChange={update('address')}
          error={errors.address}
        />
        <FormField
          label="Contact email (optional)"
          name="contactEmail"
          type="email"
          value={form.contactEmail}
          onChange={update('contactEmail')}
          error={errors.contactEmail}
        />
        <FormField
          label="Phone (optional)"
          name="phone"
          type="tel"
          maxLength={20}
          value={form.phone}
          onChange={update('phone')}
          error={errors.phone}
        />

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </section>
  )
}
