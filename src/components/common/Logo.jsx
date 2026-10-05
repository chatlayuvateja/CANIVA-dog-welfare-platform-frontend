/**
 * CANIVA brand mark - a minimal paw glyph used in the wordmark and footer.
 * Pure inline SVG (currentColor), no external assets.
 */
export function PawMark({ size = 22, className = '' }) {
  return (
    <svg
      className={className}
 width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="12" cy="15.4" rx="5" ry="4.2" fill="currentColor" />
      <ellipse cx="5.9" cy="9.6" rx="2.1" ry="2.7" fill="currentColor" transform="rotate(-18 5.9 9.6)" />
      <ellipse cx="9.9" cy="7.1" rx="2.2" ry="2.9" fill="currentColor" />
      <ellipse cx="14.4" cy="7.1" rx="2.2" ry="2.9" fill="currentColor" />
      <ellipse cx="18.4" cy="9.6" rx="2.1" ry="2.7" fill="currentColor" transform="rotate(18 18.4 9.6)" />
    </svg>
  )
}

/**
 * Wordmark text fragment: paw + CANIVA. Wrap in a link yourself.
 */
export function Wordmark({ className = '' }) {
  return (
    <span className={`brand-wordmark ${className}`.trim()}>
      <PawMark size={20} className="brand-mark" />
      CANIVA
    </span>
  )
}
