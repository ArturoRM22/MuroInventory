import { useEffect, useCallback, useState } from 'react'
import type { Movement, TodaySummary } from '../types'
import { useTortilleria } from '../context/tortilleria'
import SummaryCard from '../components/SummaryCard'
import QuickEntryForm from '../components/QuickEntryForm'
import TodayMovements from '../components/TodayMovements'
import SummaryReport from '../components/SummaryReport'
import TortilleriaSidebar from '../components/TortilleriaSidebar'
import { getJSON } from '../lib/api'
import { getToday } from '../lib/date'

const today = getToday()

export default function Dashboard() {
  const { user, tortillerias, current } = useTortilleria()
  const canViewSummary = user?.role === 'admin' || user?.role === 'super'
  const tortilleriaId = current?.id
  const isMain = current?.is_main ?? false
  const destinations = isMain && current
    ? tortillerias.filter((t) => t.main_tortilleria_id === current.id)
    : []
  const cardsGrid = isMain ? 'md:grid-cols-5' : 'md:grid-cols-4'
  const [data, setData] = useState<TodaySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [movements, setMovements] = useState<Movement[]>([])
  const [movementsLoading, setMovementsLoading] = useState(true)
  const [movementsError, setMovementsError] = useState<string | null>(null)

  const fetchToday = useCallback(() => {
    if (!tortilleriaId) return
    setLoading(true)
    setError(null)

    getJSON(`/api/movements/today?tortilleria_id=${tortilleriaId}`)
      .then((json) => {
        setData(json)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [tortilleriaId])

  const fetchMovements = useCallback(() => {
    if (!tortilleriaId) return
    setMovementsLoading(true)
    setMovementsError(null)

    getJSON(`/api/movements?day=${today}&tortilleria_id=${tortilleriaId}`)
      .then((json) => {
        setMovements(json ?? [])
        setMovementsLoading(false)
      })
      .catch((err) => {
        setMovementsError(err.message)
        setMovementsLoading(false)
      })
  }, [tortilleriaId])

  const refresh = useCallback(() => {
    fetchToday()
    fetchMovements()
  }, [fetchToday, fetchMovements])

  useEffect(() => { refresh() }, [refresh])

  return (
    <div className="flex min-h-screen">
      <TortilleriaSidebar />

      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="mb-6 text-2xl font-semibold text-gray-800">
            Panel de Hoy:{' '}
            <span className="text-red-500">{current ? `${current.name} — ${today}` : today}</span>
          </h1>

          {loading && (
            <div className={`mb-8 grid grid-cols-2 gap-4 ${cardsGrid}`}>
              {[1, 2, 3, 4, 5].map((i) => (
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
            <div className={`mb-8 grid grid-cols-2 gap-4 ${cardsGrid}`}>
              <SummaryCard label="Existencias Iniciales" value={data.inicio} accent="#2563eb" />
              <SummaryCard label="Llegadas" value={data.llegadas} accent="#16a34a" />
              <SummaryCard label="Usos" value={data.usos} accent="#ea580c" />
              {isMain && <SummaryCard label="Salidas" value={data.salidas} accent="#9333ea" />}
              <SummaryCard label="Existencias Actuales" value={data.quedo} accent="#7c3aed" />
            </div>
          )}

          {!data && !loading && !error && (
            <p className="mb-8 text-gray-500">Sin datos por hoy.</p>
          )}

          {current && tortilleriaId && (
            <QuickEntryForm
              isMain={isMain}
              destinations={destinations}
              currentStock={data?.quedo ?? null}
              tortilleriaId={tortilleriaId}
              onSuccess={refresh}
            />
          )}

          <div className="mt-8">
            <TodayMovements
              movements={movements}
              loading={movementsLoading}
              error={movementsError}
              onRetry={fetchMovements}
              onMutate={refresh}
            />
          </div>

          {canViewSummary && (
            <div className="mt-8">
              <SummaryReport />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
