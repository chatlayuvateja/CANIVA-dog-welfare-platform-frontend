import axiosClient from './axiosClient.js'

/**
 * Vaccination registration service (Session 14) - maps 1:1 to the endpoints.
 *
 * Submit (Bearer, any role):
 *   POST /api/events/{id}/vaccination-registrations -> 201 REGISTERED
 *   (event must be PUBLISHED + VACCINATION; slotId required iff the event
 *    has slots enabled - 400 missing/forbidden, 404 bad slot, 409 full;
 *    status never sent)
 *
 * Owner read (Bearer):
 *   GET  /api/me/vaccination-registrations -> own registrations
 *
 * NGO actions (Bearer, ROLE_NGO, own events only, foreign -> 404):
 *   GET   /api/ngo/events/{eventId}/vaccination-registrations -> list
 *   PATCH /api/ngo/vaccination-registrations/{id}/complete -> COMPLETED
 *   PATCH /api/ngo/vaccination-registrations/{id}/noshow    -> NO_SHOW
 * (complete/noshow: only from REGISTERED else 409; no request body)
 */

export function submitForEvent(eventId, payload) {
  return axiosClient
    .post(`/api/events/${eventId}/vaccination-registrations`, payload)
    .then((res) => res.data)
}

export async function listOwnRegistrations() {
  const res = await axiosClient.get('/api/me/vaccination-registrations')
  return res.data
}

export async function listForEvent(eventId) {
  const res = await axiosClient.get(`/api/ngo/events/${eventId}/vaccination-registrations`)
  return res.data
}

export function complete(id) {
  return axiosClient
    .patch(`/api/ngo/vaccination-registrations/${id}/complete`)
    .then((res) => res.data)
}

export function noShow(id) {
  return axiosClient
    .patch(`/api/ngo/vaccination-registrations/${id}/noshow`)
    .then((res) => res.data)
}
