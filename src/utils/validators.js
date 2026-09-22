/**
 * Client-side validation helpers (Session 15).
 *
 * They MIRROR the backend's bean-validation rules so users get instant
 * feedback, but the server stays the authority: its rejections arrive as
 * the ApiError envelope { message, fieldErrors: [{ field, message }, …] }
 * and are merged into the same per-field error objects below.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isEmail(value) {
  return EMAIL_RE.test((value ?? '').trim())
}

/** Exactly 10 digits (phone is optional in the backend, but if given, match it). */
export function isPhone10(value) {
  return /^\d{10}$/.test((value ?? '').trim())
}

/** Backend: @Size(min = 8, max = 64) on password. */
export function isPassword(value) {
  const length = (value ?? '').length
  return length >= 8 && length <= 64
}

export function hasErrors(errorMap) {
  return Object.keys(errorMap).length > 0
}

/**
 * Converts the backend's `fieldErrors` (array of { field, message }, or an
 * already-object map) into { field: message } for FormField's `error` prop.
 * Anything else yields {}.
 */
export function fieldErrorsToObject(error) {
  const fieldErrors = error?.fieldErrors
  if (!fieldErrors) return {}
  if (Array.isArray(fieldErrors)) {
    return Object.fromEntries(
      fieldErrors
        .filter((entry) => entry && entry.field)
        .map((entry) => [entry.field, entry.message]),
    )
  }
  if (typeof fieldErrors === 'object') return fieldErrors
  return {}
}
