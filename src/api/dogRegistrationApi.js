import axiosClient from './axiosClient.js'

/**
 * Dog registration service (Session 14) - maps 1:1 to the endpoints.
 *
 * Submit (Bearer, any role):
 *   POST /api/events/{id}/dog-registrations -> 201 PRE_REGISTERED
 *   (event must be PUBLISHED + DOG_REGISTRATION; 404 unknown/draft/cancelled,
 *    409 wrong type/closed/full; status/number never sent)
 *
 * Owner reads (Bearer):
 *   GET  /api/me/dog-registrations          -> own registrations
 *
 * NGO decisions (Bearer, ROLE_NGO, own events only, foreign -> 404):
 *   GET   /api/ngo/events/{eventId}/dog-registrations -> list for one event
 *   GET   /api/ngo/dog-registrations/{id}             -> detail
 *   PATCH /api/ngo/dog-registrations/{id}/verify      -> VERIFIED + DREG number
 *   PATCH /api/ngo/dog-registrations/{id}/reject      -> REJECTED (terminal)
 * (verify/reject: only from PRE_REGISTERED else 409; no request body)
 */

export function submitForEvent(eventId, payload) {
  return axiosClient
    .post(`/api/events/${eventId}/dog-registrations`, payload)
    .then((res) => res.data)
}

export async function listOwnRegistrations() {
  const res = await axiosClient.get('/api/me/dog-registrations')
  return res.data
}

export async function listForEvent(eventId) {
  const res = await axiosClient.get(`/api/ngo/events/${eventId}/dog-registrations`)
  return res.data
}

export async function getRegistration(id) {
  const res = await axiosClient.get(`/api/ngo/dog-registrations/${id}`)
  return res.data
}

export function verify(id) {
  return axiosClient.patch(`/api/ngo/dog-registrations/${id}/verify`).then((res) => res.data)
}

export function reject(id) {
  return axiosClient.patch(`/api/ngo/dog-registrations/${id}/reject`).then((res) => res.data)
}
