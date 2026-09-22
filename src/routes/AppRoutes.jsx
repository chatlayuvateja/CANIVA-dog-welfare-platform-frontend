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

// Auth
import Login from '../pages/auth/Login.jsx'
import Register from '../pages/auth/Register.jsx'

// NGO (all behind ProtectedRoute + RoleRoute)
import Dashboard from '../pages/ngo/Dashboard.jsx'
import MyEvents from '../pages/ngo/MyEvents.jsx'
import CreateEvent from '../pages/ngo/CreateEvent.jsx'
import EditEvent from '../pages/ngo/EditEvent.jsx'
import Registrations from '../pages/ngo/Registrations.jsx'
import Animals from '../pages/ngo/Animals.jsx'
import Applications from '../pages/ngo/Applications.jsx'
import Profile from '../pages/ngo/Profile.jsx'

import NotFound from '../pages/public/NotFound.jsx'

/**
 * Application routes (Session 14).
 *
 * Public area: Home, Events, Event Details, Adoption, Animal Details,
 * Login, Register - open to everyone (guests get 401 from protected APIs,
 * never fake data).
 *
 * NGO area: everything under /ngo/** is wrapped in
 *   ProtectedRoute (must be logged in, else -> /login)
 *   RoleRoute role="NGO" (must be NGO, else forbidden state)
 * Guards are UX only - the backend enforces the same rules on every
 * /api/ngo/** endpoint (401 anonymous / 403 wrong role).
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

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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
            <Route path="/ngo/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
