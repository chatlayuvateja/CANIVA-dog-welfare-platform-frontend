import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import GoNav from './GoNav.jsx'
import SiteFooter from './SiteFooter.jsx'

/**
 * Shared page shell: skip link, navbar, workspace sub-nav (NGO area
 * only), page content, footer.
 *
 * Also owns scroll behaviour: every route change returns to the top,
 * while in-page hashes (#give, #meet, ...) scroll to their section.
 */
export default function Layout() {
  const { pathname, hash } = useLocation()
  const isNgoArea = pathname === '/ngo' || pathname.startsWith('/ngo/')

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0 })
  }, [pathname, hash])

  return (
    <div className="layout">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main className="main-content" id="main">
        {isNgoArea && <GoNav />}
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
