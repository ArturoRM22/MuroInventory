import { useNavigate, Outlet, Link } from 'react-router-dom'
import { useTortilleria } from '../context/tortilleria'

export default function RootLayout() {
  const navigate = useNavigate()
  const { user, reset } = useTortilleria()

  function handleLogout() {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      .catch(() => {})
      .finally(() => {
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('currentTortilleriaId')
        reset()
        navigate('/login', { replace: true })
      })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-bold text-gray-800">
            MuroInventory
          </Link>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{user.name}</span>
              <Link to="/" 
                className="cursor-pointer rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Panel
              </Link>
              {user.role === 'super' && (
                <Link to="/tortillerias"
                  className="cursor-pointer rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Tortillerías
                </Link>
              )}
              {(user.role === 'admin' || user.role === 'super') && (
                <Link
                  to = '/register'
                  className="cursor-pointer rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Registrar Usuario
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="cursor-pointer rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl">
        <Outlet />
      </main>
    </div>
  )
}
