import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTortilleria } from '../context/tortilleria'
import { getJSON } from '../lib/api'
import type { Tortilleria } from '../types'

type UserRole = 'admin' | 'user'

export default function Register() {
  const navigate = useNavigate()
  const { user } = useTortilleria()

  const [tortillerias, setTortillerias] = useState<Tortilleria[]>([])
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState<UserRole>('user')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    getJSON('/api/tortillerias')
      .then((list: Tortilleria[] | null) => setTortillerias(list ?? []))
      .catch(() => {})
  }, [])

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  function toggleTortilleria(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!name.trim()) {
      setError('El nombre de usuario es obligatorio')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (selectedIds.length === 0) {
      setError('Debes asignar al menos una tortillería')
      return
    }

    setSubmitting(true)

    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: name.trim(),
        password,
        role,
        tortilleria_ids: selectedIds,
      }),
    })
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'Error al registrar')
        return body
      })
      .then(() => {
        setName('')
        setPassword('')
        setConfirm('')
        setRole('user')
        setSelectedIds([])
        setSuccess(`Usuario registrado correctamente`)
        setSubmitting(false)
      })
      .catch((err) => {
        setError(err.message)
        setSubmitting(false)
      })
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-bold text-gray-800">Registrar Usuario</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-600">
              Usuario
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-600">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-gray-600">
              Confirmar Contraseña
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-medium text-gray-600">
              Rol
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium text-gray-600">
              Tortillerías asignadas
            </span>
            {tortillerias.length === 0 ? (
              <p className="text-sm text-gray-500">Cargando tortillerías...</p>
            ) : (
              <div className="space-y-2 rounded-lg border border-gray-300 p-3">
                {tortillerias.map((t) => (
                  <label key={t.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(t.id)}
                      onChange={() => toggleTortilleria(t.id)}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span className="text-gray-700">
                      {t.name}
                      {t.is_main && (
                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Principal
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          {success && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Registrando...' : 'Registrar'}
          </button>
        </form>

        <button
          onClick={() => navigate('/')}
          className="mt-4 w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
        >
          Volver al Panel
        </button>
      </div>
    </div>
  )
}
