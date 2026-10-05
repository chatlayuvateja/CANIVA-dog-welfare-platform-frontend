import axiosClient from './axiosClient.js'

/**
 * Urgent cases service - maps 1:1 to the content endpoints.
 *
 * Public reads (no token):
 *   GET /api/urgent  -> UrgentCaseDto[] (ACTIVE cases whose animal is
 *                       AVAILABLE, newest first; progressPercent is
 *                       computed server-side)
 *
 * NGO management (Bearer, ROLE_NGO, own cases, foreign -> 404):
 *   GET    /api/ngo/urgent             -> own cases, ALL statuses
 *   POST   /api/ngo/urgent             -> 201 always ACTIVE
 *   PUT    /api/ngo/urgent/{id}        -> 200 full update (status kept)
 *   PATCH  /api/ngo/urgent/{id}/status -> 200 ACTIVE <-> CLOSED
 * status/ownership are NEVER sent on create/update.
 *
 * There are no payment rails: amountRaised is recorded by the NGO,
 * the public UI only shows progress.
 */

// ---------- public ----------

export async function listUrgentCases() {
  const res = await axiosClient.get('/api/urgent')
  return res.data
}

// ---------- NGO ----------

export async function listOwnUrgentCases() {
  const res = await axiosClient.get('/api/ngo/urgent')
  return res.data
}

export function createUrgentCase(payload) {
  return axiosClient
    .post('/api/ngo/urgent', payload)
    .then((res) => res.data)
}

export function updateUrgentCase(id, payload) {
  return axiosClient
    .put(`/api/ngo/urgent/${id}`, payload)
    .then((res) => res.data)
}

export function setUrgentCaseStatus(id, status) {
  return axiosClient
    .patch(`/api/ngo/urgent/${id}/status`, { status })
    .then((res) => res.data)
}

/** <img> src for the campaign's animal photo (public endpoint). */
export function urgentAnimalImageUrl(item) {
  if (!item || !item.animalHasImage) return null
  return `${axiosClient.defaults.baseURL}/api/animals/${item.animalId}/image?v=${item.animalImageVersion ?? 0}`
}
