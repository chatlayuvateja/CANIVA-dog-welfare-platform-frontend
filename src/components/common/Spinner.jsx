/**
 * Loading state - Session 14.
 *
 * Reusable spinner for every "waiting for the real API" moment:
 *   <Spinner />                     default label
 *   <Spinner label="Loading events…" /> custom label
 */
export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span className="spinner-label">{label}</span>
    </div>
  )
}
