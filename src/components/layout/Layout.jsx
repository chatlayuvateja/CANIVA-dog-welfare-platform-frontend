import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'

/**
 * Shared page shell: navbar on top, page content below, simple footer.
 */
export default function Layout() {
  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <p>Animal Welfare Event Management Platform</p>
      </footer>
    </div>
  )
}
