import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAvailableAnimal } from '../../api/animalApi.js'
import { submitForAnimal } from '../../api/adoptionApi.js'
import { useAuth } from '../../context/AuthContext.jsx'
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
 * Adoption workflow (Session 16):
 *   Animal Details -> Apply -> Application form -> Submit -> Confirmation ->
 *   Application status (My Activities).
 *
 * POST /api/animals/{id}/applications (Bearer - guests are sent to /login).
 * Name/email start prefilled from the JWT user (real session data). Honest
 * error handling: 409 duplicate PENDING application -> message + link to My
 * Activities; 404 (animal no longer AVAILABLE) -> friendly state; 400 field
 * errors merge per field.
 */
export default function ApplyAdoption() {
  const { id } = useParams()
  const { user } = useAuth()

  const [animal, setAnimal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  const [form, setForm] = useState({
    applicantName: user?.fullName ?? '',
    applicantEmail: user?.email ?? '',
    applicantPhone: '',
    homeAddress: '',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)

  useEffect(() => {
    let stale = false
    setLoading(true)
    setError(null)
    getAvailableAnimal(id)
      .then((data) => {
        if (!stale) {
          setAnimal(data)
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
    if (!form.applicantName.trim()) next.applicantName = 'Your name is required'
    if (!form.applicantEmail.trim()) {
      next.applicantEmail = 'Email is required'
    } else if (!isEmail(form.applicantEmail)) {
      next.applicantEmail = 'Enter a valid email address'
    }
    if (!form.applicantPhone.trim()) {
      next.applicantPhone = 'Phone is required'
    } else if (!isPhone10(form.applicantPhone)) {
      next.applicantPhone = 'Phone must be exactly 10 digits'
    }
    if (!form.homeAddress.trim()) next.homeAddress = 'Home address is required'
    if (!form.message.trim()) {
      next.message = 'Please tell the NGO why you would like to adopt'
    }
    return next
  }

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault()
    const clientErrors = validate()
    setErrors(clientErrors)
    setApiError(null)
    if (hasErrors(clientErrors)) return

    const payload = {
      applicantName: form.applicantName.trim(),
      applicantEmail: form.applicantEmail.trim(),
      applicantPhone: form.applicantPhone.trim(),
      homeAddress: form.homeAddress.trim(),
      message: form.message.trim(),
    }

    setSubmitting(true)
    try {
      const application = await submitForAnimal(id, payload)
      setCreated(application)
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
        <Spinner label="Loading animal…" />
      </section>
    )
  }

  if (error && error.status === 404) {
    return (
      <section className="page not-found-state">
        <h1>No longer available</h1>
        <p>
          This animal does not exist or is no longer listed for adoption - it
          may already have found a home.
        </p>
        <p>
          <Link className="btn btn-primary" to="/adoption">
            Back to available animals
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

  if (!animal) return null

  // ---- confirmation --------------------------------------------------------
  if (created) {
    return (
      <section className="page page-narrow">
        <SuccessPanel
          title="Application submitted!"
          badge={<StatusBadge status={created.status} />}
          message="The NGO reviews every application. You will see updates and any decision reason here in My Activities."
        >
          <ul className="summary-list">
            <li>
              <span className="meta-label">Animal</span>
              <span>{created.animalName}</span>
            </li>
            <li>
              <span className="meta-label">Applicant</span>
              <span>{created.applicantName}</span>
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
            <Link className="btn btn-secondary" to={`/adoption/animals/${animal.id}`}>
              Back to {animal.name}
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
        <Link to={`/adoption/animals/${animal.id}`}>← Back to {animal.name}</Link>
      </p>
      <h1>Apply to adopt {animal.name}</h1>

      <div className="workflow-intro">
        <h2>{animal.name}</h2>
        <p>
          {[animal.breed, animal.age, animal.species].filter(Boolean).join(' · ')}
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormError message={apiError?.message} />
        {apiError?.status === 409 && (
          <p className="form-alt">
            You already applied for this animal - track it in{' '}
            <Link to="/my-activities">My Activities</Link>.
          </p>
        )}

        <FormField
          label="Your name"
          name="applicantName"
          autoComplete="name"
          required
          value={form.applicantName}
          onChange={update('applicantName')}
          error={errors.applicantName}
        />
        <FormField
          label="Email"
          name="applicantEmail"
          type="email"
          autoComplete="email"
          required
          value={form.applicantEmail}
          onChange={update('applicantEmail')}
          error={errors.applicantEmail}
        />
        <FormField
          label="Phone"
          name="applicantPhone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="10-digit number"
          required
          value={form.applicantPhone}
          onChange={update('applicantPhone')}
          error={errors.applicantPhone}
        />
        <FormField
          label="Home address"
          name="homeAddress"
          type="textarea"
          autoComplete="street-address"
          required
          value={form.homeAddress}
          onChange={update('homeAddress')}
          error={errors.homeAddress}
        />
        <FormField
          label="Why would you like to adopt?"
          name="message"
          type="textarea"
          maxLength={2000}
          required
          value={form.message}
          onChange={update('message')}
          error={errors.message}
        />

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </section>
  )
}
