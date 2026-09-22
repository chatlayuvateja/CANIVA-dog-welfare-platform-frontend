import { AuthProvider } from './context/AuthContext.jsx'
import AppRoutes from './routes/AppRoutes.jsx'

/**
 * Root component (Session 14). All navigation is in routes/AppRoutes.jsx;
 * AuthProvider supplies login/register/logout + the current user to the
 * whole tree (Navbar, route guards, pages).
 * BrowserRouter lives in main.jsx.
 */
export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
