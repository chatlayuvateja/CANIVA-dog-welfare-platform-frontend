/**
 * Empty state - Session 14.
 *
 * Shown when a real API list comes back with zero rows (never fake data):
 *
 *   <EmptyState
 *     title="No events yet"
 *     message="Published events will appear here."
 *   />
 *   <EmptyState …>optional action, e.g. a Link button</EmptyState>
 */
export default function EmptyState({ title = 'Nothing here yet', message, children }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {children}
    </div>
  )
}
