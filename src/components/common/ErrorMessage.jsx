/**
 * Error state - Session 14.
 *
 * Renders the normalized interceptor error { status, message, fieldErrors }
 * in a clear box, with an optional retry action:
 *
 *   <ErrorMessage message={error.message} onRetry={reload} />
 *   <ErrorMessage title="Access denied" message="…" />   (forbidden state)
 */
export default function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
}) {
  return (
    <div className="error-box" role="alert">
      <h3>{title}</h3>
      {message ? <p>{message}</p> : <p>Please try again in a moment.</p>}
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
