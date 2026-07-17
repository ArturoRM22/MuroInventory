import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TodaySummary } from '../types'
import SummaryCard from '../components/SummaryCard'
import QuickEntryForm from '../components/QuickEntryForm'

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<TodaySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function fetchToday() {
    if (!sessionStorage.getItem('user')) {
      navigate('/login', { replace: true })
      return
    }

    setLoading(true)
    setError(null)

    fetch('/api/movements/today?tortilleria_id=1', { credentials: 'include' })
      .then((res) => {
        if (res.status === 401) {
          sessionStorage.removeItem('user')
          navigate('/login', { replace: true })
          return
        }
        if (!res.ok) throw new Error(`Error ${res.status}`)
        return res.json()
      })
      .then((json) => {
        if (json) {
          setData(json.data)
          setLoading(false)
        }
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => { fetchToday() }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">Panel de Hoy</h1>

      {loading && (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-gray-50 p-5">
              <div className="mb-2 h-3 w-20 rounded bg-gray-200" />
              <div className="h-8 w-12 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium">Error al cargar datos de hoy</p>
          <p className="mt-1 text-sm">{error}</p>
          <button
            onClick={fetchToday}
            className="mt-3 cursor-pointer rounded bg-red-600 px-4 py-1.5 text-sm text-white hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {data && !loading && !error && (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <SummaryCard label="Existencias Iniciales" value={data.inicio} accent="#2563eb" />
          <SummaryCard label="Llegadas" value={data.llegadas} accent="#16a34a" />
          <SummaryCard label="Usos" value={data.usos} accent="#ea580c" />
          <SummaryCard label="Existencias Actuales" value={data.quedo} accent="#7c3aed" />
        </div>
      )}

      {!data && !loading && !error && (
        <p className="mb-8 text-gray-500">Sin datos por hoy.</p>
      )}

      <QuickEntryForm currentStock={data?.quedo ?? null} onSuccess={fetchToday} />
    </div>
  )
}
