import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import FormField from '../../components/forms/FormField.jsx'
import FormError from '../../components/forms/FormError.jsx'
import {
  fieldErrorsToObject,
  hasErrors,
  isEmail,
} from '../../utils/validators.js'

/**
 * Login (Session 15) - POST /api/auth/login { email, password }.
 *
 * Client-side validation mirrors the backend; API failures (401 wrong
 * credentials, 400 bad body) are shown through the normalized error
 * envelope, with any fieldErrors merged per field. On success the JWT is
 * stored by AuthContext and the user lands where they were headed
 * (location.state.from) or on their role's home (NGO -> /ngo).
 */
export default function Login() {
  const { login, isLoggedIn, isNgo } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Already signed in (e.g. opened /login from the navbar) -> leave.
  if (isLoggedIn) {
    return <Navigate to={from || (isNgo ? '/ngo' : '/')} replace />
  }

  function validate() {
    const next = {}
    if (!form.email.trim()) {
      next.email = 'Email is required'
    } else if (!isEmail(form.email)) {
      next.email = 'Enter a valid email address'
    }
    if (!form.password) {
      next.password = 'Password is required'
    }
    return next
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const clientErrors = validate()
    setErrors(clientErrors)
    setApiError(null)
    if (hasErrors(clientErrors)) return

    setSubmitting(true)
    try {
      const authResponse = await login(form.email.trim(), form.password)
      // Priority: page the guard sent us from -> path saved by the axios
      // interceptor when the JWT expired -> role-based home.
      const saved = sessionStorage.getItem('redirectAfterLogin')
      sessionStorage.removeItem('redirectAfterLogin')
      const target =
        from || saved || (authResponse?.user?.role === 'NGO' ? '/ngo' : '/')
      navigate(target, { replace: true })
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
      <h1>Login</h1>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormError message={apiError?.message} />

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
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={update('password')}
          error={errors.password}
        />

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Login'}
        </button>

        <p className="form-alt">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </section>
  )
}
