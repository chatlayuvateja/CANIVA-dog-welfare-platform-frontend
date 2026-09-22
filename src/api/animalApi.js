import axiosClient from './axiosClient.js'

/**
 * Animal listing service (Session 14) - maps 1:1 to the endpoints.
 *
 * Public reads (no token) - ALWAYS AVAILABLE-only:
 *   GET /api/animals?status=AVAILABLE -> AnimalDto[] (any other status value
 *       or wrong casing -> 400; the list itself never contains HIDDEN/ADOPTED)
 *   GET /api/animals/{id}             -> 200 | 404 hidden/adopted/unknown
 *
 * NGO management (Bearer, ROLE_NGO, own animals only, foreign -> 404):
 *   GET   /api/ngo/animals             -> own animals, ALL statuses
 *   POST  /api/ngo/animals             -> 201 always AVAILABLE
 *   PUT   /api/ngo/animals/{id}        -> 200 full update (status untouched)
 *   PATCH /api/ngo/animals/{id}/status -> 200 AVAILABLE <-> HIDDEN soft
 *         toggle (body { status }; target/current ADOPTED -> 409)
 * status/ownership are NEVER sent on create/update.
 */

// ---------- public ----------

export async function listAvailableAnimals(status) {
  const res = await axiosClient.get('/api/animals', {
    params: status ? { status } : undefined,
  })
  return res.data
}

export async function getAvailableAnimal(id) {
  const res = await axiosClient.get(`/api/animals/${id}`)
  return res.data
}

// ---------- NGO ----------

export async function listOwnAnimals() {
  const res = await axiosClient.get('/api/ngo/animals')
  return res.data
}

export async function createAnimal(payload) {
  const res = await axiosClient.post('/api/ngo/animals', payload)
  return res.data
}

export async function updateAnimal(id, payload) {
  const res = await axiosClient.put(`/api/ngo/animals/${id}`, payload)
  return res.data
}

export function changeStatus(id, status) {
  return axiosClient
    .patch(`/api/ngo/animals/${id}/status`, { status })
    .then((res) => res.data)
}
