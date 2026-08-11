import { useState } from 'react'
import type { Tortilleria } from '../types'
import { sendJSON } from '../lib/api'

interface TortilleriaFormModalProps {
  tortilleria: Tortilleria | null
  mains: Tortilleria[]
  onCancel: () => void
  onSaved: () => void
}

export default function TortilleriaFormModal({
  tortilleria,
  mains,
  onCancel,
  onSaved,
}: TortilleriaFormModalProps) {
  const [name, setName] = useState(tortilleria?.name ?? '')
  const [isMain, setIsMain] = useState(tortilleria?.is_main ?? true)
  const [mainId, setMainId] = useState(
    tortilleria?.main_tortilleria_id != null ? String(tortilleria.main_tortilleria_id) : ''
  )
  const [initialStock, setInitialStock] = useState(
    tortilleria != null ? String(tortilleria.initial_stock) : '0'
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parentOptions = mains.filter((m) => m.id !== tortilleria?.id)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    if (!isMain && !mainId) {
      setError('Selecciona la tortillería principal a la que pertenece')
      return
    }
    const stock = parseInt(initialStock, 10)
    if (!Number.isInteger(stock) || stock < 0) {
      setError('La existencia inicial debe ser un número mayor o igual a 0')
      return
    }

    setSubmitting(true)

    const body = {
      name: name.trim(),
      is_main: isMain,
      main_tortilleria_id: isMain ? null : Number(mainId),
      initial_stock: stock,
    }

    const request = tortilleria
      ? sendJSON('PATCH', `/api/tortillerias/${tortilleria.id}`, body)
      : sendJSON('POST', '/api/tortillerias', body)

    request
      .then(() => {
        setSubmitting(false)
        onSaved()
      })
      .catch((err) => {
        setError(err.message)
        setSubmitting(false)
      })
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="mb-5 text-lg font-semibold text-gray-800">
          {tortilleria ? 'Editar Tortillería' : 'Nueva Tortillería'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tname" className="mb-1 block text-sm font-medium text-gray-600">
              Nombre
            </label>
            <input
              id="tname"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-600">Tipo</span>
            <div className="flex overflow-hidden rounded-lg border border-gray-300">
              <button
                type="button"
                onClick={() => setIsMain(true)}
                className={`flex-1 cursor-pointer py-2.5 text-sm font-medium transition md:py-2 ${
                  isMain ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Principal
              </button>
              <button
                type="button"
                onClick={() => setIsMain(false)}
                className={`flex-1 cursor-pointer py-2.5 text-sm font-medium transition md:py-2 ${
                  !isMain ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Sucursal
              </button>
            </div>
          </div>

          {!isMain && (
            <div>
              <label htmlFor="tmain" className="mb-1 block text-sm font-medium text-gray-600">
                Tortillería principal
              </label>
              <select
                id="tmain"
                value={mainId}
                onChange={(e) => setMainId(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Selecciona una principal</option>
                {parentOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {parentOptions.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No hay tortillerías principales disponibles
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="tstock" className="mb-1 block text-sm font-medium text-gray-600">
              Existencia inicial
            </label>
            <input
              id="tstock"
              type="number"
              min={0}
              step={1}
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : tortilleria ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
