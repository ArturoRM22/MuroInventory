import { Fragment, useState } from 'react'
import type { Movement, TodaySummary } from '../types'
import { useTortilleria } from '../context/tortilleria'
import { getJSON } from '../lib/api'
import { getToday } from '../lib/date'

export default function SummaryReport() {
  const today = getToday()
  const { current } = useTortilleria()
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [summaries, setSummaries] = useState<TodaySummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [movementsByDay, setMovementsByDay] = useState<Record<string, Movement[]>>({})
  const [movementsLoading, setMovementsLoading] = useState<Record<string, boolean>>({})
  const [movementsError, setMovementsError] = useState<Record<string, string>>({})

  function loadSummaries() {
    if (!current) return
    const start = from && to && from > to ? to : from
    const end = from && to && from > to ? from : to

    setLoading(true)
    setError(null)
    setExpanded(new Set())
    setMovementsByDay({})
    setMovementsLoading({})
    setMovementsError({})

    getJSON(`/api/movements/summary?from=${start}&to=${end}&tortilleria_id=${current.id}`)
      .then((json) => {
        setSummaries(json ?? [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }

  function fetchDay(day: string) {
    if (!current) return
    setMovementsLoading((prev) => ({ ...prev, [day]: true }))
    setMovementsError((prev) => ({ ...prev, [day]: '' }))

    getJSON(`/api/movements?day=${day}&tortilleria_id=${current.id}`)
      .then((json) => {
        setMovementsByDay((prev) => ({ ...prev, [day]: json ?? [] }))
        setMovementsLoading((prev) => ({ ...prev, [day]: false }))
      })
      .catch((err) => {
        setMovementsError((prev) => ({ ...prev, [day]: err.message }))
        setMovementsLoading((prev) => ({ ...prev, [day]: false }))
      })
  }

  function toggleDay(day: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(day)) {
        next.delete(day)
      } else {
        next.add(day)
      }
      return next
    })

    if (!movementsByDay[day] && !movementsLoading[day] && !movementsError[day]) {
      fetchDay(day)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-semibold text-gray-800">Historial / Resumen por día</h2>

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="report-from" className="mb-1 block text-sm font-medium text-gray-600">
            Desde
          </label>
          <input
            id="report-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="report-to" className="mb-1 block text-sm font-medium text-gray-600">
            Hasta
          </label>
          <input
            id="report-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={loadSummaries}
          disabled={loading}
          className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Consultar
        </button>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg bg-gray-100 p-3">
              <div className="h-4 w-2/3 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium">Error al cargar el resumen</p>
          <p className="mt-1 text-sm">{error}</p>
          <button
            onClick={loadSummaries}
            className="mt-3 cursor-pointer rounded bg-red-600 px-4 py-1.5 text-sm text-white hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && summaries.length === 0 && (
        <p className="text-gray-500">Sin movimientos en el rango seleccionado.</p>
      )}

      {!loading && !error && summaries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="pb-2 pr-4 font-medium">Fecha</th>
                <th className="pb-2 pr-4 font-medium">Inicio</th>
                <th className="pb-2 pr-4 font-medium">Llegadas</th>
                <th className="pb-2 pr-4 font-medium">Usos</th>
                <th className="pb-2 pr-4 font-medium">Quedo</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => {
                const isOpen = expanded.has(s.day)
                const dayMovements = movementsByDay[s.day]
                const dayLoading = movementsLoading[s.day]
                const dayError = movementsError[s.day]

                return (
                  <Fragment key={s.day}>
                    <tr className="border-b border-gray-100 last:border-0">
                      <td className="py-2.5 pr-4 font-medium text-gray-800">{s.day}</td>
                      <td className="py-2.5 pr-4 text-gray-600">{s.inicio}</td>
                      <td className="py-2.5 pr-4 text-gray-600">{s.llegadas}</td>
                      <td className="py-2.5 pr-4 text-gray-600">{s.usos}</td>
                      <td className="py-2.5 pr-4 text-gray-600">{s.quedo}</td>
                      <td className="py-2.5">
                        <button
                          onClick={() => toggleDay(s.day)}
                          aria-label={isOpen ? 'Colapsar movimientos' : 'Ver movimientos'}
                          className="cursor-pointer rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        >
                          <svg
                            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-4 py-3">
                          {dayLoading && (
                            <div className="animate-pulse rounded-lg bg-gray-100 p-3">
                              <div className="h-4 w-2/3 rounded bg-gray-200" />
                            </div>
                          )}

                          {!dayLoading && dayError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                              <p>{dayError}</p>
                              <button
                                onClick={() => fetchDay(s.day)}
                                className="mt-2 cursor-pointer rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                              >
                                Reintentar
                              </button>
                            </div>
                          )}

                          {!dayLoading && !dayError && dayMovements && dayMovements.length === 0 && (
                            <p className="text-gray-500">Sin movimientos ese día.</p>
                          )}

                          {!dayLoading && !dayError && dayMovements && dayMovements.length > 0 && (
                            <table className="w-full text-left text-sm">
                              <thead>
                                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                                  <th className="pb-2 pr-4 font-medium">Quién</th>
                                  <th className="pb-2 pr-4 font-medium">Tipo</th>
                                  <th className="pb-2 pr-4 font-medium">Costales</th>
                                  <th className="pb-2 font-medium">Hora</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dayMovements.map((m) => (
                                  <tr key={m.id} className="border-b border-gray-100 last:border-0">
                                    <td className="py-2.5 pr-4 font-medium text-gray-800">
                                      {m.employee_name}
                                    </td>
                                    <td className="py-2.5 pr-4">
                                      <span
                                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                          m.type === 'llegada'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-orange-100 text-orange-700'
                                        }`}
                                      >
                                        {m.type === 'llegada' ? 'Llegada' : 'Uso'}
                                      </span>
                                    </td>
                                    <td className="py-2.5 pr-4 text-gray-600">{m.sacks}</td>
                                    <td className="py-2.5 text-gray-600">
                                      {new Date(m.created_at).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
