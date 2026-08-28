import { Fragment, useEffect, useState } from 'react'
import type { Movement, TodaySummary } from '../types'
import { useTortilleria } from '../context/tortilleria'
import { deleteJSON, getJSON } from '../lib/api'
import { getToday, formatDMY } from '../lib/date'
import { MovementBadge, MovementNote } from './TodayMovements'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import DateField from './DateField'

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
  const [pendingDelete, setPendingDelete] = useState<Movement | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handleDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    setDeleteError(null)

    deleteJSON(`/api/movements/${pendingDelete.id}`)
      .then(() => {
        const day = pendingDelete.day
        setPendingDelete(null)
        fetchDay(day)
      })
      .catch((err) => setDeleteError(err.message))
      .finally(() => setDeleting(false))
  }

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

  useEffect(() => {
    loadSummaries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
      <h2 className="mb-5 text-lg font-semibold text-gray-800">Historial / Resumen por día</h2>

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="report-from" className="mb-1 block text-sm font-medium text-gray-600">
            Desde
          </label>
          <DateField
            id="report-from"
            value={from}
            onChange={setFrom}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor="report-to" className="mb-1 block text-sm font-medium text-gray-600">
            Hasta
          </label>
          <DateField
            id="report-to"
            value={to}
            onChange={setTo}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={loadSummaries}
          disabled={loading}
          className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto md:py-2"
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
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Fecha</th>
                  <th className="pb-2 pr-4 font-medium">Inicio</th>
                  <th className="pb-2 pr-4 font-medium">Llegadas</th>
                  <th className="pb-2 pr-4 font-medium">Usos</th>
                  <th className="pb-2 pr-4 font-medium">Salidas</th>
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
                        <td className="py-2.5 pr-4 font-medium text-gray-800">{formatDMY(s.day)}</td>
                        <td className="py-2.5 pr-4 text-gray-600">{s.inicio}</td>
                        <td className="py-2.5 pr-4 text-gray-600">{s.llegadas}</td>
                        <td className="py-2.5 pr-4 text-gray-600">{s.usos}</td>
                        <td className="py-2.5 pr-4 text-gray-600">{s.salidas}</td>
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
                          <td colSpan={8} className="px-4 py-3">
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
                                    <th className="pb-2 pr-4 font-medium">Hora</th>
                                    <th className="pb-2 font-medium" />
                                  </tr>
                                </thead>
                                <tbody>
                                  {dayMovements.map((m) => (
                                    <tr key={m.id} className="border-b border-gray-100 last:border-0">
                                      <td className="py-2.5 pr-4 font-medium text-gray-800">
                                        {m.employee_name}
                                      </td>
                                      <td className="py-2.5 pr-4">
                                        <MovementBadge m={m} />
                                        <MovementNote m={m} />
                                      </td>
                                      <td className="py-2.5 pr-4 text-gray-600">{m.sacks}</td>
                                      <td className="py-2.5 text-gray-600">
                                        {new Date(m.created_at).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </td>
                                      <td className="py-2.5 text-right">
                                        <button
                                          onClick={() => {
                                            setDeleteError(null)
                                            setPendingDelete(m)
                                          }}
                                          title="Eliminar"
                                          aria-label={`Eliminar movimiento de ${m.employee_name}`}
                                          className="cursor-pointer rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="h-4 w-4"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                            />
                                          </svg>
                                        </button>
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

          <div className="space-y-3 md:hidden">
            {summaries.map((s) => {
              const isOpen = expanded.has(s.day)
              const dayMovements = movementsByDay[s.day]
              const dayLoading = movementsLoading[s.day]
              const dayError = movementsError[s.day]

              return (
                <div key={s.day} className="rounded-lg border border-gray-200 p-3">
                  <button
                    onClick={() => toggleDay(s.day)}
                    aria-label={isOpen ? 'Colapsar movimientos' : 'Ver movimientos'}
                    className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{formatDMY(s.day)}</p>
                      <p className="text-xs text-gray-500">
                        Quedó: <span className="font-semibold text-gray-700">{s.quedo}</span> costales
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium text-blue-600">
                      {isOpen ? 'Ocultar' : 'Ver'}
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
                    </span>
                  </button>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-xs text-gray-500">Inicio</p>
                      <p className="text-base font-semibold text-gray-800">{s.inicio}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-xs text-gray-500">Llegadas</p>
                      <p className="text-base font-semibold text-blue-700">{s.llegadas}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-xs text-gray-500">Usos</p>
                      <p className="text-base font-semibold text-orange-700">{s.usos}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-xs text-gray-500">Salidas</p>
                      <p className="text-base font-semibold text-purple-700">{s.salidas}</p>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
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
                        <p className="text-sm text-gray-500">Sin movimientos ese día.</p>
                      )}

                      {!dayLoading && !dayError && dayMovements && dayMovements.length > 0 && (
                        <div className="space-y-2">
                          {dayMovements.map((m) => (
                            <div
                              key={m.id}
                              className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-gray-800">
                                  {m.employee_name}
                                </p>
                                <div className="mt-0.5">
                                  <MovementBadge m={m} />
                                  <MovementNote m={m} />
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-right">
                                <div>
                                  <p className="text-base font-semibold text-gray-800">{m.sacks}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(m.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    setDeleteError(null)
                                    setPendingDelete(m)
                                  }}
                                  title="Eliminar"
                                  aria-label={`Eliminar movimiento de ${m.employee_name}`}
                                  className="ml-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="h-4 w-4"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {pendingDelete && (
        <ConfirmDeleteModal
          movement={pendingDelete}
          deleting={deleting}
          error={deleteError}
          onCancel={() => {
            if (!deleting) setPendingDelete(null)
          }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}