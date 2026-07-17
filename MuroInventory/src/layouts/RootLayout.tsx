import { useNavigate, Outlet } from 'react-router-dom'

export default function RootLayout() {
  const navigate = useNavigate()
  const raw = sessionStorage.getItem('user')
  const user = raw ? JSON.parse(raw) : null

  function handleLogout() {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      .catch(() => {})
      .finally(() => {
        sessionStorage.removeItem('user')
        navigate('/login', { replace: true })
      })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-gray-800">MuroInventory</h1>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{user.name}</span>
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
      <main>
        <Outlet />
      </main>
    </div>
  )
}
