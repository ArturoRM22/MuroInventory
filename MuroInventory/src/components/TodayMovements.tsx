import type { Movement } from '../types'

interface TodayMovementsProps {
  movements: Movement[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

export default function TodayMovements({ movements, loading, error, onRetry }: TodayMovementsProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="pb-2 pr-4 font-medium">Quién</th>
                <th className="pb-2 pr-4 font-medium">Tipo</th>
                <th className="pb-2 pr-4 font-medium">Costales</th>
                <th className="pb-2 pr-4 font-medium">Fecha</th>
                <th className="pb-2 font-medium">Hora</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-2.5 pr-4 font-medium text-gray-800">{m.employee_name}</td>
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
                  <td className="py-2.5 pr-4 text-gray-600">{m.day.slice(0, 10)}</td>
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
        </div>
      )}
    </div>
  )
}
