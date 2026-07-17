import { useState } from 'react'

type MovementType = 'llegada' | 'uso'

interface QuickEntryFormProps {
  currentStock: number | null
  onSuccess: () => void
}

export default function QuickEntryForm({ currentStock, onSuccess }: QuickEntryFormProps) {
  const today = new Date().toISOString().split('T')[0]
  const [mtype, setMtype] = useState<MovementType>('llegada')
  const [sacks, setSacks] = useState('')
  const [employee, setEmployee] = useState('')
  const [day, setDay] = useState(today)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setMtype('llegada')
    setSacks('')
    setEmployee('')
    setDay(today)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const sacksNum = parseInt(sacks, 10)
    if (!sacksNum || sacksNum < 1) {
      setError('Los costales deben ser un número positivo')
      return
    }
    if (!employee.trim()) {
      setError('El nombre del empleado es obligatorio')
      return
    }

    if (mtype === 'uso' && currentStock !== null && sacksNum > currentStock) {
      setError(`No hay suficiente existencias — disponibles: ${currentStock} costales`)
      return
    }

    setSubmitting(true)

    fetch('/api/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        day,
        type: mtype,
        sacks: sacksNum,
        tortilleria_id: 1,
        employee_name: employee.trim(),
      }),
    })
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'Error al registrar')
        return body
      })
      .then(() => {
        resetForm()
        onSuccess()
        setSubmitting(false)
      })
      .catch((err) => {
        setError(err.message)
        setSubmitting(false)
      })
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-semibold text-gray-800">Registrar Movimiento</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">Tipo</label>
          <div className="flex overflow-hidden rounded-lg border border-gray-300">
            <button
              type="button"
              onClick={() => setMtype('llegada')}
              className={`flex-1 cursor-pointer py-2 text-sm font-medium transition ${
                mtype === 'llegada'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Llegada
            </button>
            <button
              type="button"
              onClick={() => setMtype('uso')}
              className={`flex-1 cursor-pointer py-2 text-sm font-medium transition ${
                mtype === 'uso'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Uso
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="sacks" className="mb-1 block text-sm font-medium text-gray-600">
            Costales
          </label>
          <input
            id="sacks"
            type="number"
            min={1}
            step={1}
            value={sacks}
            onChange={(e) => setSacks(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="employee" className="mb-1 block text-sm font-medium text-gray-600">
            Empleado
          </label>
          <input
            id="employee"
            type="text"
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="day" className="mb-1 block text-sm font-medium text-gray-600">
            Fecha
          </label>
          <input
            id="day"
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Registrando...' : 'Registrar'}
        </button>
      </form>
    </div>
  )
}
