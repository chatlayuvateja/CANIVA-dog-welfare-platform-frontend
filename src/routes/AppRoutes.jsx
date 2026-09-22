import { Routes, Route } from 'react-router-dom'
import Layout from '../components/layout/Layout.jsx'
import Home from '../pages/public/Home.jsx'
import Events from '../pages/public/Events.jsx'
import EventDetails from '../pages/public/EventDetails.jsx'
import Adoption from '../pages/public/Adoption.jsx'
import AnimalDetails from '../pages/public/AnimalDetails.jsx'
import Login from '../pages/auth/Login.jsx'
import Register from '../pages/auth/Register.jsx'
import NotFound from '../pages/public/NotFound.jsx'

/**
 * Application routes.
 * Public area only for now - NGO routes are added in Session 14,
 * protected/role-based routes in Session 14 as well.
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

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
