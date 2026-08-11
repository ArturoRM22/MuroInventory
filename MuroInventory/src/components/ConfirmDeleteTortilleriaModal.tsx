import type { Tortilleria } from '../types'

interface ConfirmDeleteTortilleriaModalProps {
  tortilleria: Tortilleria
  deleting: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmDeleteTortilleriaModal({
  tortilleria,
  deleting,
  error,
  onCancel,
  onConfirm,
}: ConfirmDeleteTortilleriaModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Eliminar tortillería</h2>
        <p className="mb-4 text-sm text-gray-600">
          ¿Eliminar la tortillería{' '}
          <span className="font-medium">{tortilleria.name}</span>? Esta acción no se puede deshacer.
        </p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
