/**
 * Workflow confirmation panel (Session 16) - rendered after a successful
 * submission (dog registration, vaccination booking, adoption application).
 *
 *   <SuccessPanel
 *     title="Registration submitted!"
 *     badge={<StatusBadge status={created.status} />}
 *     message="...">
 *     <ul className="summary-list">…</ul>
 *     <div className="action-row">…</div>
 *   </SuccessPanel>
 */
export default function SuccessPanel({ title, badge, message, children }) {
  return (
    <div className="success-box" role="status">
      <h2>{title}</h2>
      {badge && <div className="success-badge">{badge}</div>}
      {message && <p>{message}</p>}
      {children}
    </div>
  )
}
