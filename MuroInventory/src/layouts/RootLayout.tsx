import { useNavigate, Outlet } from 'react-router-dom'
import { useTortilleria } from '../context/tortilleria'

export default function RootLayout() {
  const navigate = useNavigate()
  const { user, tortillerias, current, loading, setCurrent } = useTortilleria()

  function handleLogout() {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      .catch(() => {})
      .finally(() => {
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('currentTortilleriaId')
        navigate('/login', { replace: true })
      })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-gray-800">MuroInventory</h1>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{user.name}</span>
              {user.role === 'admin' && (
                <button
                  onClick={() => navigate('/register')}
                  className="cursor-pointer rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Registrar Usuario
                </button>
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

      <div className="mx-auto flex max-w-6xl">
        <aside className="w-52 shrink-0 border-r border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Tortillerías
          </h2>

          <select
            value={current?.id ?? ''}
            onChange={(e) => setCurrent(Number(e.target.value))}
            className="mb-2 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500 md:hidden"
          >
            {tortillerias.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : (
            <ul className="hidden md:block">
              {tortillerias.map((t) => (
                <li key={t.id} className="mb-1">
                  <button
                    onClick={() => setCurrent(t.id)}
                    className={`w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm transition ${
                      current?.id === t.id
                        ? 'bg-blue-600 font-medium text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
