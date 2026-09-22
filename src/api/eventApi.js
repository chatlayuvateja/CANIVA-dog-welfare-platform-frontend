import axiosClient from './axiosClient.js'

/**
 * Event service (Session 14) - maps 1:1 to the event endpoints.
 *
 * Public reads (no token): PUBLISHED events only.
 *   GET    /api/events?type=&location=&date=&page=&size= -> PagedResponse
 *   GET    /api/events/{id}                              -> EventDto | 404
 *
 * NGO management (Bearer, ROLE_NGO): own events only (foreign -> 404).
 *   GET    /api/ngo/events                 -> EventDto[]
 *   GET    /api/ngo/events/{id}            -> EventDto (any status)
 *   POST   /api/ngo/events                 -> 201 always DRAFT
 *   PUT    /api/ngo/events/{id}            -> 200 (DRAFT/PUBLISHED only)
 *   PATCH  /api/ngo/events/{id}/publish    -> DRAFT -> PUBLISHED
 *   PATCH  /api/ngo/events/{id}/unpublish  -> PUBLISHED -> DRAFT
 *   PATCH  /api/ngo/events/{id}/cancel     -> -> CANCELLED (terminal)
 *
 * `status` is NEVER sent from the client - transitions happen only through
 * the three PATCH actions above. Lists return the plain DTO array (no
 * wrapper); the public list returns the paged envelope
 * { content, page, size, totalElements, totalPages, last }.
 */

// ---------- public ----------

export async function listPublishedEvents({ type, location, date, page, size } = {}) {
  const res = await axiosClient.get('/api/events', {
    params: { type, location, date, page, size },
  })
  return res.data
}

export async function getPublishedEvent(id) {
  const res = await axiosClient.get(`/api/events/${id}`)
  return res.data
}

// ---------- NGO ----------

export async function listOwnEvents() {
  const res = await axiosClient.get('/api/ngo/events')
  return res.data
}

export async function getOwnEvent(id) {
  const res = await axiosClient.get(`/api/ngo/events/${id}`)
  return res.data
}

export async function createEvent(payload) {
  const res = await axiosClient.post('/api/ngo/events', payload)
  return res.data
}

export async function updateEvent(id, payload) {
  const res = await axiosClient.put(`/api/ngo/events/${id}`, payload)
  return res.data
}

export function publishEvent(id) {
  return axiosClient.patch(`/api/ngo/events/${id}/publish`).then((res) => res.data)
}

export function unpublishEvent(id) {
  return axiosClient.patch(`/api/ngo/events/${id}/unpublish`).then((res) => res.data)
}

export function cancelEvent(id) {
  return axiosClient.patch(`/api/ngo/events/${id}/cancel`).then((res) => res.data)
}
