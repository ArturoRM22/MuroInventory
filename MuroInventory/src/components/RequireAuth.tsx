import { Navigate, Outlet } from 'react-router-dom'
import { useTortilleria } from '../context/tortilleria'

export default function RequireAuth() {
  const { user, loading } = useTortilleria()

  if (!loading && !user) return <Navigate to="/login" replace />
  return <Outlet />
}
