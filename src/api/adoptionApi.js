import axiosClient from './axiosClient.js'

/**
 * Adoption application service (Session 14) - maps 1:1 to the endpoints.
 *
 * Submit (Bearer, any role - applicant comes from the JWT, never the body):
 *   POST /api/animals/{id}/applications -> 201 PENDING
 *   (animal must be AVAILABLE: unknown/hidden/adopted -> 404 no-leak;
 *    duplicate PENDING per user+animal -> 409; re-apply after rejection OK)
 *
 * Owner reads (Bearer):
 *   GET /api/me/applications -> own applications (My Activities)
 *
 * NGO decisions (Bearer, ROLE_NGO, own animals only, foreign -> 404):
 *   GET   /api/ngo/applications?status=PENDING|APPROVED|REJECTED -> inbox
 *   GET   /api/ngo/applications/{id}                             -> detail
 *   PATCH /api/ngo/applications/{id}/approve -> 200 APPROVED; ONE atomic
 *         transaction: animal -> ADOPTED + other PENDING apps auto-REJECTED
 *   PATCH /api/ngo/applications/{id}/reject  -> 200 REJECTED with optional
 *         { reason } (we always send an object; {} means "no reason");
 *         animal availability unchanged
 * (decisions only from PENDING else 409; no body on approve)
 */

export function submitForAnimal(animalId, payload) {
  return axiosClient
    .post(`/api/animals/${animalId}/applications`, payload)
    .then((res) => res.data)
}

export async function listOwnApplications() {
  const res = await axiosClient.get('/api/me/applications')
  return res.data
}

export async function listForNgo(status) {
  const res = await axiosClient.get('/api/ngo/applications', {
    params: status ? { status } : undefined,
  })
  return res.data
}

export async function getForNgo(id) {
  const res = await axiosClient.get(`/api/ngo/applications/${id}`)
  return res.data
}

export function approve(id) {
  return axiosClient.patch(`/api/ngo/applications/${id}/approve`).then((res) => res.data)
}

export function reject(id, payload = {}) {
  return axiosClient.patch(`/api/ngo/applications/${id}/reject`, payload).then((res) => res.data)
}
