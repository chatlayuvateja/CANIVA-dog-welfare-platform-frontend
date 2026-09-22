import axiosClient from './axiosClient.js'

/**
 * NGO profile + dashboard service (Session 14).
 *
 * All under /api/ngo/** -> Bearer + ROLE_NGO (PUBLIC -> 403, anon -> 401);
 * everything is scoped to the caller's own NGO (foreign -> 404).
 *
 *   GET   /api/ngo/profile    -> 200 NgoProfileDto | 404 no profile
 *   PUT   /api/ngo/profile    -> 200 updated profile (orgName required)
 *   GET   /api/ngo/dashboard  -> 200 DashboardDto with SEVEN live counters:
 *         { totalEvents, publishedEvents, totalRegistrations,
 *           pendingDogRegistrations, vaccinationRegistrations,
 *           adoptionAnimals, pendingAdoptionApplications }
 *         (all filtered by the caller's ngoId; empty NGO -> zeros, no error)
 */

export async function getProfile() {
  const res = await axiosClient.get('/api/ngo/profile')
  return res.data
}

export async function updateProfile(payload) {
  const res = await axiosClient.put('/api/ngo/profile', payload)
  return res.data
}

export async function getDashboard() {
  const res = await axiosClient.get('/api/ngo/dashboard')
  return res.data
}
