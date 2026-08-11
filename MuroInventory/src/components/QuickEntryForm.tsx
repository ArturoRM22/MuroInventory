import { useState } from 'react'
import { getToday } from '../lib/date'
import { apiUrl } from '../lib/config'
import type { Tortilleria } from '../types'
import DateField from './DateField'

type MovementType = 'llegada' | 'uso' | 'salida'

interface QuickEntryFormProps {
  isMain: boolean
  destinations: Tortilleria[]
  currentStock: number | null
  tortilleriaId: number
  onSuccess: () => void
}

export default function QuickEntryForm({
  isMain,
  destinations,
  currentStock,
  tortilleriaId,
  onSuccess,
}: QuickEntryFormProps) {
  const today = getToday()
  const defaultType: MovementType = isMain ? 'llegada' : 'uso'
  const [mtype, setMtype] = useState<MovementType>(defaultType)
  const [sacks, setSacks] = useState('')
  const [employee, setEmployee] = useState('')
  const [destination, setDestination] = useState('')
  const [day, setDay] = useState(today)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setMtype(defaultType)
    setSacks('')
    setEmployee('')
    setDestination('')
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
    if (mtype === 'salida' && !destination) {
      setError('Selecciona la tortillería a la que se envían los costales')
      return
    }

    if (mtype === 'uso' && currentStock !== null && sacksNum > currentStock) {
      setError(`No hay suficiente existencias — disponibles: ${currentStock} costales`)
      return
    }

    setSubmitting(true)

    const body: Record<string, unknown> = {
      day,
      type: mtype,
      sacks: sacksNum,
      tortilleria_id: tortilleriaId,
      employee_name: employee.trim(),
    }
    if (mtype === 'salida') {
      body.destination_tortilleria_id = Number(destination)
    }

    fetch(apiUrl('/api/movements'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
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

  const types: { value: MovementType; label: string; activeClass: string }[] = isMain
    ? [
        { value: 'llegada', label: 'Llegada', activeClass: 'bg-blue-600 text-white' },
        { value: 'uso', label: 'Uso', activeClass: 'bg-orange-600 text-white' },
        ...(destinations.length > 0
          ? [{ value: 'salida' as MovementType, label: 'Salida', activeClass: 'bg-purple-600 text-white' }]
          : []),
      ]
    : [{ value: 'uso', label: 'Uso', activeClass: 'bg-orange-600 text-white' }]

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
      <h2 className="mb-5 text-lg font-semibold text-gray-800">
        Registrar Movimiento{isMain ? '' : ' (Uso)'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-600">Tipo</label>
          <div className="flex overflow-hidden rounded-lg border border-gray-300">
            {types.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setMtype(t.value)}
                className={`flex-1 cursor-pointer py-2.5 text-sm font-medium transition md:py-2 ${
                  mtype === t.value
                    ? t.activeClass
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {mtype === 'salida' && (
          <div>
            <label htmlFor="destination" className="mb-1 block text-sm font-medium text-gray-600">
              Tortillería destino
            </label>
            <select
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Selecciona una tortillería</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

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
            Nombre de quien registra
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
          <DateField
            id="day"
            value={day}
            onChange={setDay}
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
