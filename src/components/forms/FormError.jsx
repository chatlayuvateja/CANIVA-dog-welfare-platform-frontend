/**
 * Form-level error banner - Session 14.
 *
 * Shows the normalized interceptor error message (the backend ApiError
 * envelope's `message`), e.g. 401 wrong credentials, 409 duplicate email:
 *
 *   {error && <FormError message={error.message} />}
 *
 * Field-level problems go into each FormField's `error` prop instead
 * (from error.fieldErrors).
 */
export default function FormError({ message }) {
  if (!message) return null
  return (
    <div className="form-error" role="alert">
      {message}
    </div>
  )
}
