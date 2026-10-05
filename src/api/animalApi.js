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
 *   GET    /api/ngo/animals             -> own animals, ALL statuses
 *   POST   /api/ngo/animals             -> 201 always AVAILABLE
 *   PUT    /api/ngo/animals/{id}        -> 200 full update (status untouched)
 *   PATCH  /api/ngo/animals/{id}/status -> 200 AVAILABLE <-> HIDDEN soft
 *          toggle (body { status }; target/current ADOPTED -> 409)
 *   POST   /api/ngo/animals/{id}/image  -> 200 store a photo (multipart
 *          part 'file', JPEG/PNG/WebP/GIF <=5 MB; supersedes any URL)
 *   DELETE /api/ngo/animals/{id}/image  -> 204 remove it (idempotent)
 *   GET    /api/ngo/animals/{id}/image  -> 200 own photo in ANY status
 *          (edit preview - fetched as a blob, Bearer header included)
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

// ---------- images ----------

/** Stores the chosen file (multipart; axios lets the browser set the boundary). */
export function uploadImage(id, file) {
  const form = new FormData()
  form.append('file', file)
  return axiosClient
    .post(`/api/ngo/animals/${id}/image`, form)
    .then((res) => res.data)
}

export function removeImage(id) {
  return axiosClient.delete(`/api/ngo/animals/${id}/image`)
}

/**
 * Own photo as an object URL for the edit preview. The NGO endpoint needs
 * a Bearer header (<img src> can't send one) and hidden/adopted animals'
 * photos are not publicly served, so the bytes are fetched with axios.
 * The caller MUST URL.revokeObjectURL() the result when done.
 */
export async function fetchOwnImageObjectUrl(id) {
  const res = await axiosClient.get(`/api/ngo/animals/${id}/image`, {
    responseType: 'blob',
  })
  return URL.createObjectURL(res.data)
}

/**
 * <img> src for an animal: the uploaded photo (public endpoint, cache-busted
 * with imageVersion) when hasImage, else the legacy external URL, else null.
 */
export function animalImageUrl(animal) {
  if (!animal) return null
  if (animal.hasImage) {
    return `${axiosClient.defaults.baseURL}/api/animals/${animal.id}/image?v=${animal.imageVersion ?? 0}`
  }
  return animal.imageUrl || null
}
