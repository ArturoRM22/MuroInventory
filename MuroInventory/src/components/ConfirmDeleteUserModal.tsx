import type { UserRef } from '../types'

interface ConfirmDeleteUserModalProps {
  user: UserRef
  tortilleriaName: string
  deleting: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmDeleteUserModal({
  user,
  tortilleriaName,
  deleting,
  error,
  onCancel,
  onConfirm,
}: ConfirmDeleteUserModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Quitar usuario</h2>
        <p className="mb-4 text-sm text-gray-600">
          ¿Quitar a <span className="font-medium">{user.name}</span> de la tortillería{' '}
          <span className="font-medium">{tortilleriaName}</span>? Esta acción no se puede deshacer.
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
            {deleting ? 'Quitando...' : 'Quitar'}
          </button>
        </div>
      </div>
    </div>
  )
}
