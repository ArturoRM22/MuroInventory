import { useEffect, useState } from 'react'
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom'
import { useTortilleria } from '../context/tortilleria'
import { apiUrl } from '../lib/config'
import { useStandalone } from '../lib/media'

export default function RootLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, reset } = useTortilleria()
  const standalone = useStandalone()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  function handleLogout() {
    setMenuOpen(false)
    fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' })
      .catch(() => {})
      .finally(() => {
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('currentTortilleriaId')
        reset()
        navigate('/login', { replace: true })
      })
  }

  const navLinkClass =
    'cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100'
  const mobileLinkClass =
    'block w-full cursor-pointer rounded-md border border-gray-300 px-3 py-2.5 text-center text-sm text-gray-600 hover:bg-gray-100'

  return (
    <div className="min-h-screen bg-gray-50">
      <header
        className={`border-b border-gray-200 bg-white shadow-sm ${
          standalone ? 'pt-[env(safe-area-inset-top)]' : ''
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-bold text-gray-800">
            MuroInventory
          </Link>
          {user && (
            <>
              <div className="hidden items-center gap-3 md:flex">
                <span className="text-sm text-gray-500">{user.name}</span>
                <Link to="/" className={navLinkClass}>
                  Panel
                </Link>
                {user.role === 'super' && (
                  <Link to="/tortillerias" className={navLinkClass}>
                    Tortillerías
                  </Link>
                )}
                {(user.role === 'admin' || user.role === 'super') && (
                  <Link to="/register" className={navLinkClass}>
                    Registrar Usuario
                  </Link>
                )}
                <button onClick={handleLogout} className={navLinkClass}>
                  Cerrar Sesión
                </button>
              </div>

              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={menuOpen}
                className="cursor-pointer rounded-md border border-gray-300 p-2 text-gray-600 hover:bg-gray-100 md:hidden"
              >
                {menuOpen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                  </svg>
                )}
              </button>
            </>
          )}
        </div>

        {user && menuOpen && (
          <div className="border-t border-gray-200 px-4 py-3 md:hidden">
            <div className="flex flex-col gap-2">
              <span className="mb-1 text-sm font-medium text-gray-600">{user.name}</span>
              <Link to="/" className={mobileLinkClass}>
                Panel
              </Link>
              {user.role === 'super' && (
                <Link to="/tortillerias" className={mobileLinkClass}>
                  Tortillerías
                </Link>
              )}
              {(user.role === 'admin' || user.role === 'super') && (
                <Link to="/register" className={mobileLinkClass}>
                  Registrar Usuario
                </Link>
              )}
              <button onClick={handleLogout} className={mobileLinkClass}>
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl">
        <Outlet />
      </main>
    </div>
  )
}