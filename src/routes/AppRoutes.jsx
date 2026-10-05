import { Routes, Route } from 'react-router-dom'
import Layout from '../components/layout/Layout.jsx'
import ProtectedRoute from '../components/protected/ProtectedRoute.jsx'
import RoleRoute from '../components/protected/RoleRoute.jsx'

// Public
import Home from '../pages/public/Home.jsx'
import Events from '../pages/public/Events.jsx'
import EventDetails from '../pages/public/EventDetails.jsx'
import Adoption from '../pages/public/Adoption.jsx'
import AnimalDetails from '../pages/public/AnimalDetails.jsx'
import Stories from '../pages/public/Stories.jsx'
import StoryDetails from '../pages/public/StoryDetails.jsx'

// Auth
import Login from '../pages/auth/Login.jsx'
import Register from '../pages/auth/Register.jsx'

// Public workflows (any authenticated role - Session 16)
import RegisterDog from '../pages/public/RegisterDog.jsx'
import RegisterVaccination from '../pages/public/RegisterVaccination.jsx'
import ApplyAdoption from '../pages/public/ApplyAdoption.jsx'
import MyActivities from '../pages/myActivities/MyActivities.jsx'

// NGO (all behind ProtectedRoute + RoleRoute)
import Dashboard from '../pages/ngo/Dashboard.jsx'
import MyEvents from '../pages/ngo/MyEvents.jsx'
import CreateEvent from '../pages/ngo/CreateEvent.jsx'
import EditEvent from '../pages/ngo/EditEvent.jsx'
import Registrations from '../pages/ngo/Registrations.jsx'
import Animals from '../pages/ngo/Animals.jsx'
import Applications from '../pages/ngo/Applications.jsx'
import Profile from '../pages/ngo/Profile.jsx'
import MyStories from '../pages/ngo/MyStories.jsx'
import UrgentCases from '../pages/ngo/UrgentCases.jsx'

import NotFound from '../pages/public/NotFound.jsx'

/**
 * Application routes (Sessions 14 + 16, redesigned in the content wave).
 *
 * Public area: Home, Events, Event Details, Adoption, Animal Details,
 * Stories (/stories, /stories/:id), Login, Register - open to everyone
 * (guests get 401 from protected APIs, never fake data). Public story and
 * urgent-case content comes from GET /api/stories and GET /api/urgent;
 * sections the API returns empty are omitted, not faked.
 *
 * Workflow area (/events/:id/register-*, /adoption/animals/:id/apply,
 * /my-activities): ProtectedRoute only - ANY logged-in role may submit and
 * track their own registrations/applications (the server enforces the real
 * rules: event type/state, capacity, duplicates, ownership).
 *
 * NGO area: everything under /ngo/** is wrapped in
 *   ProtectedRoute (must be logged in, else -> /login)
 *   RoleRoute role="NGO" (must be NGO, else forbidden state)
 * and carries the GoNav chip sub-nav - including the content pages
 * /ngo/stories (rescue-story editor) and /ngo/urgent (urgent cases).
 * Guards are UX only - the backend enforces the same rules on every
 * endpoint (401 anonymous / 403 wrong role / 404 foreign resources).
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/adoption" element={<Adoption />} />
        <Route path="/adoption/animals/:id" element={<AnimalDetails />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/stories/:id" element={<StoryDetails />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Public workflows - logged in (any role) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/events/:id/register-dog" element={<RegisterDog />} />
          <Route path="/events/:id/register-vaccination" element={<RegisterVaccination />} />
          <Route path="/adoption/animals/:id/apply" element={<ApplyAdoption />} />
          <Route path="/my-activities" element={<MyActivities />} />
        </Route>

        {/* NGO - protected, role-restricted */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute role="NGO" />}>
            <Route path="/ngo" element={<Dashboard />} />
            <Route path="/ngo/events" element={<MyEvents />} />
            <Route path="/ngo/events/new" element={<CreateEvent />} />
            <Route path="/ngo/events/:id/edit" element={<EditEvent />} />
            <Route path="/ngo/registrations" element={<Registrations />} />
            <Route path="/ngo/animals" element={<Animals />} />
            <Route path="/ngo/applications" element={<Applications />} />
            <Route path="/ngo/stories" element={<MyStories />} />
            <Route path="/ngo/urgent" element={<UrgentCases />} />
            <Route path="/ngo/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
