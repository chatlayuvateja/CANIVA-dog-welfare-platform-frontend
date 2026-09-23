/**
 * Date/time formatting helpers (Session 15).
 *
 * The API sends plain ISO-ish strings (LocalDate "2030-12-31",
 * LocalTime "09:00"). They are parsed MANUALLY to avoid timezone shifts
 * (new Date("2030-12-31") would be interpreted as UTC).
 */

export function formatDate(isoDate) {
  if (!isoDate) return ''
  // Accept full LocalDateTime strings too ("2030-12-31T09:00:00") by
  // taking only the date part before parsing.
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return isoDate
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(hhmm) {
  if (!hhmm) return ''
  const [hours, minutes] = hhmm.split(':').map(Number)
  if (Number.isNaN(hours)) return hhmm
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${String(minutes ?? 0).padStart(2, '0')} ${suffix}`
}
