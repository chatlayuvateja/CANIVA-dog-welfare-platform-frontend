import axiosClient from './axiosClient.js'

/**
 * Rescue stories service - maps 1:1 to the content endpoints.
 *
 * Public reads (no token):
 *   GET /api/stories          -> RescueStoryDto[] (PUBLISHED only,
 *                                newest first; stories linked to a
 *                                non-available animal are not public)
 *   GET /api/stories/{id}     -> 200 | 404 "Rescue story not found"
 *                                (draft and unknown ids are identical)
 *   GET /api/stories/{id}/images/{slot}   -> image bytes (slot is
 *                                BEFORE | AFTER), publicly cached
 *
 * NGO management (Bearer, ROLE_NGO, own stories, foreign -> 404):
 *   GET    /api/ngo/stories               -> own stories, ALL statuses
 *   POST   /api/ngo/stories               -> 201 always DRAFT
 *   PUT    /api/ngo/stories/{id}          -> 200 full update (status kept)
 *   PATCH  /api/ngo/stories/{id}/status   -> 200 DRAFT <-> PUBLISHED
 *   GET    /api/ngo/stories/{id}/images/{slot}  -> own photo in ANY status
 *                                                (edit preview, blob)
 *   POST   /api/ngo/stories/{id}/images/{slot}  -> 200 updated DTO
 *                                                (multipart 'file')
 *   DELETE /api/ngo/stories/{id}/images/{slot}  -> 204 idempotent
 *   DELETE /api/ngo/stories/{id}           -> 204 (row + images removed)
 * status/ownership are NEVER sent on create/update.
 */

export const STORY_SLOTS = ['BEFORE', 'AFTER']

// ---------- public ----------

export async function listPublishedStories() {
  const res = await axiosClient.get('/api/stories')
  return res.data
}

export async function getPublishedStory(id) {
  const res = await axiosClient.get(`/api/stories/${id}`)
  return res.data
}

/** Public <img> src for a story image slot, cache-busted by imageVersion. */
export function storyImageUrl(story, slot) {
  if (!story) return null
  if (slot === 'BEFORE' && !story.hasBeforeImage) return null
  if (slot === 'AFTER' && !story.hasAfterImage) return null
  if (slot !== 'BEFORE' && slot !== 'AFTER') return null
  return `${axiosClient.defaults.baseURL}/api/stories/${story.id}/images/${slot}?v=${story.imageVersion ?? 0}`
}

// ---------- NGO ----------

export async function listOwnStories() {
  const res = await axiosClient.get('/api/ngo/stories')
  return res.data
}

export function createStory(payload) {
  return axiosClient.post('/api/ngo/stories', payload).then((res) => res.data)
}

export function updateStory(id, payload) {
  return axiosClient
    .put(`/api/ngo/stories/${id}`, payload)
    .then((res) => res.data)
}

export function setStoryStatus(id, status) {
  return axiosClient
    .patch(`/api/ngo/stories/${id}/status`, { status })
    .then((res) => res.data)
}

export function deleteStory(id) {
  return axiosClient.delete(`/api/ngo/stories/${id}`)
}

// ---------- story images ----------

export function uploadStoryImage(id, slot, file) {
  const form = new FormData()
  form.append('file', file)
  return axiosClient
    .post(`/api/ngo/stories/${id}/images/${slot}`, form)
    .then((res) => res.data)
}

export function removeStoryImage(id, slot) {
  return axiosClient.delete(`/api/ngo/stories/${id}/images/${slot}`)
}

/**
 * Own story photo as an object URL for the edit preview (the NGO
 * endpoint needs a Bearer header that <img src> cannot send).
 * The caller MUST URL.revokeObjectURL() the result when done.
 */
export async function fetchOwnStoryImageObjectUrl(id, slot) {
  const res = await axiosClient.get(`/api/ngo/stories/${id}/images/${slot}`, {
    responseType: 'blob',
  })
  return URL.createObjectURL(res.data)
}
