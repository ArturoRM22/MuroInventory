import { useState } from 'react'
import type { Movement } from '../types'
import { deleteJSON } from '../lib/api'
import { formatDMY } from '../lib/date'
import ConfirmDeleteModal from './ConfirmDeleteModal'

interface TodayMovementsProps {
  movements: Movement[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onMutate: () => void
}

export function MovementBadge({ m }: { m: Movement }) {
  if (m.type === 'llegada') {
    return <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">Llegada</span>
  }
  if (m.type === 'uso') {
    return <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">Uso</span>
  }
  return <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">Salida</span>
}

export function MovementNote({ m }: { m: Movement }) {
  if (m.type === 'salida' && m.destination_name) {
    return <p className="mt-0.5 text-xs text-gray-500">a {m.destination_name}</p>
  }
  if (m.type === 'llegada' && m.source_name) {
    return <p className="mt-0.5 text-xs text-gray-500">de {m.source_name}</p>
  }
  return null
}

export default function TodayMovements({ movements, loading, error, onRetry, onMutate }: TodayMovementsProps) {
  const [pendingDelete, setPendingDelete] = useState<Movement | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handleDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    setDeleteError(null)

    deleteJSON(`/api/movements/${pendingDelete.id}`)
      .then(() => {
        setPendingDelete(null)
        onMutate()
      })
      .catch((err) => setDeleteError(err.message))
      .finally(() => setDeleting(false))
  }

  function timeOf(m: Movement) {
    return new Date(m.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
      <h2 className="mb-5 text-lg font-semibold text-gray-800">Movimientos de Hoy</h2>

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
          <p className="font-medium">Error al cargar movimientos</p>
          <p className="mt-1 text-sm">{error}</p>
          <button
            onClick={onRetry}
            className="mt-3 cursor-pointer rounded bg-red-600 px-4 py-1.5 text-sm text-white hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && movements.length === 0 && (
        <p className="text-gray-500">Sin movimientos registrados hoy.</p>
      )}

      {!loading && !error && movements.length > 0 && (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Quién</th>
                  <th className="pb-2 pr-4 font-medium">Tipo</th>
                  <th className="pb-2 pr-4 font-medium">Costales</th>
                  <th className="pb-2 pr-4 font-medium">Fecha</th>
                  <th className="pb-2 pr-4 font-medium">Hora</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-gray-800">{m.employee_name}</td>
                    <td className="py-2.5 pr-4">
                      <MovementBadge m={m} />
                      <MovementNote m={m} />
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600">{m.sacks}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{formatDMY(m.day)}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{timeOf(m)}</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => {
                          setDeleteError(null)
                          setPendingDelete(m)
                        }}
                        title="Eliminar"
                        aria-label={`Eliminar movimiento de ${m.employee_name}`}
                        className="cursor-pointer rounded-lg p-2.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 md:p-2"
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
          </div>

          <div className="space-y-3 md:hidden">
            {movements.map((m) => (
              <div key={m.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-800">{m.employee_name}</p>
                    <p className="text-xs text-gray-500">
                      {formatDMY(m.day)} · {timeOf(m)}
                    </p>
                  </div>
                  <div className="text-right">
                    <MovementBadge m={m} />
                    <MovementNote m={m} />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">{m.sacks}</span> costales
                  </p>
                  <button
                    onClick={() => {
                      setDeleteError(null)
                      setPendingDelete(m)
                    }}
                    aria-label={`Eliminar movimiento de ${m.employee_name}`}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                  >
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
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
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