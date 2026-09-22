/**
 * Shared frontend constants (Session 15) - exact enum names as sent by the
 * API (the backend accepts ONLY these exact uppercase values; anything else
 * is a 400).
 */

export const EVENT_TYPES = [
  { value: 'DOG_REGISTRATION', label: 'Dog Registration' },
  { value: 'VACCINATION', label: 'Vaccination' },
  { value: 'ADOPTION', label: 'Adoption' },
]

export const EVENT_TYPE_LABELS = Object.fromEntries(
  EVENT_TYPES.map((type) => [type.value, type.label]),
)

/** Human label for any EventType coming back from the API. */
export function eventTypeLabel(value) {
  return EVENT_TYPE_LABELS[value] ?? value ?? ''
}
