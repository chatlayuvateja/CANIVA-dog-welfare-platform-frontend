import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import * as authApi from '../../api/authApi.js'
import FormField from '../../components/forms/FormField.jsx'
import FormError from '../../components/forms/FormError.jsx'
import {
  fieldErrorsToObject,
  hasErrors,
  isEmail,
  isPassword,
  isPhone10,
} from '../../utils/validators.js'

/**
 * Registration (Session 15) - POST /api/auth/register.
 *
 * Mirrors the backend's RegisterRequest rules:
 *   fullName required · email required + valid · password 8-64 chars ·
 *   phone optional but exactly 10 digits when given · role PUBLIC|NGO ·
 *   orgName required for NGO (backend checks it in the service).
 *
 * Server responses (400 field errors, 409 email already registered) are
 * shown via the normalized error envelope + per-field messages. On success
 * the account exists but is NOT logged in - the JWT returned by the API is
 * deliberately discarded, and the browser lands on the login page with a
 * "sign in to continue" notice (registered email passed via router state).
 */
export default function Register() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'PUBLIC',
    orgName: '',
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (isLoggedIn) {
    return <Navigate to={from || '/'} replace />
  }

  function validate() {
    const next = {}
    if (!form.fullName.trim()) {
      next.fullName = 'Full name is required'
    }
    if (!form.email.trim()) {
      next.email = 'Email is required'
    } else if (!isEmail(form.email)) {
      next.email = 'Enter a valid email address'
    }
    if (form.phone.trim() && !isPhone10(form.phone)) {
      next.phone = 'Phone must be exactly 10 digits'
    }
    if (!form.password) {
      next.password = 'Password is required'
    } else if (!isPassword(form.password)) {
      next.password = 'Password must be 8-64 characters'
    }
    if (form.role === 'NGO' && !form.orgName.trim()) {
      next.orgName = 'Organization name is required for NGO accounts'
    }
    return next
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const clientErrors = validate()
    setErrors(clientErrors)
    setApiError(null)
    if (hasErrors(clientErrors)) return

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    }
    if (form.phone.trim()) payload.phone = form.phone.trim()
    if (form.role === 'NGO') payload.orgName = form.orgName.trim()

    setSubmitting(true)
    try {
      await authApi.register(payload)
      // New account -> straight to the login page (no auto-login).
      navigate('/login', {
        replace: true,
        state: { registered: form.email.trim() },
      })
    } catch (error) {
      setApiError(error)
      setErrors(fieldErrorsToObject(error))
    } finally {
      setSubmitting(false)
    }
  }

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  return (
    <section className="page page-narrow">
      <p className="kicker">Account</p>
      <h1>Join CANIVA</h1>
      <p className="lead">
        One account to meet the animals and attend events — or a rescue-partner
        account to bring your rescue work to CANIVA.
      </p>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormError message={apiError?.message} />

        <FormField
          label="Full name"
          name="fullName"
          autoComplete="name"
          required
          value={form.fullName}
          onChange={update('fullName')}
          error={errors.fullName}
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={update('email')}
          error={errors.email}
        />
        <FormField
          label="Phone (optional)"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="10-digit number"
          value={form.phone}
          onChange={update('phone')}
          error={errors.phone}
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={update('password')}
          error={errors.password}
        />

        <div
          className="radio-row"
          role="radiogroup"
          aria-label="Account type"
        >
          <label className="radio-option">
            <input
              type="radio"
              name="role"
              value="PUBLIC"
              checked={form.role === 'PUBLIC'}
              onChange={update('role')}
            />
            <span>Personal account - attend events and apply for adoption</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="role"
              value="NGO"
              checked={form.role === 'NGO'}
              onChange={update('role')}
            />
            <span>Rescue partner - bring your rescue work to CANIVA</span>
          </label>
        </div>

        {form.role === 'NGO' && (
          <FormField
            label="Organization name"
            name="orgName"
            required
            value={form.orgName}
            onChange={update('orgName')}
            error={errors.orgName}
          />
        )}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="form-alt">
          Already with us? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </section>
  )
}
