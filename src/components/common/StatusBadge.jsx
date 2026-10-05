/**
 * Status badge - Session 14.
 *
 * Color-codes any backend enum value (exact names as returned by the API):
 *   events:    DRAFT / PUBLISHED / CANCELLED
 *   dog regs:  PRE_REGISTERED / VERIFIED / REJECTED
 *   vaccination: REGISTERED / COMPLETED / NO_SHOW
 *   animals:   AVAILABLE / HIDDEN / ADOPTED
 *   applications: PENDING / APPROVED / REJECTED
 *   stories:   DRAFT / PUBLISHED
 *   urgent:    ACTIVE / CLOSED
 *
 *   <StatusBadge status={event.status} />
 */
const TONES = [
  // terminal / success-ish -> green
  { className: 'badge-green', values: ['PUBLISHED', 'VERIFIED', 'COMPLETED', 'APPROVED', 'AVAILABLE'] },
  // in progress -> blue
  { className: 'badge-blue', values: ['DRAFT', 'PENDING', 'PRE_REGISTERED', 'REGISTERED'] },
  // blocked / negative -> red
  { className: 'badge-red', values: ['CANCELLED', 'REJECTED', 'NO_SHOW', 'HIDDEN'] },
  // special -> amber
  { className: 'badge-amber', values: ['ADOPTED', 'ACTIVE'] },
]

function toneFor(status) {
  return TONES.find((tone) => tone.values.includes(status))?.className ?? ''
}

export default function StatusBadge({ status }) {
  if (!status) return null
  return (
    <span className={`badge ${toneFor(status)}`} data-status={status}>
      {status}
    </span>
  )
}
