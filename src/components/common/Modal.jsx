import { useEffect } from 'react'

/**
 * Lightweight modal dialog - Session 14.
 *
 *   <Modal open={open} title="Cancel this event?" onClose={close}
 *          footer={<button …/>}>
 *     …body…
 *   </Modal>
 *
 * Closes on backdrop click and Escape key; renders nothing when closed.
 * Used for confirmation prompts (e.g. publish / cancel / reject actions).
 */
export default function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            onClick={() => onClose?.()}
          >
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
