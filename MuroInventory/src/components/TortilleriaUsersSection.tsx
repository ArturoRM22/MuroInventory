import { useCallback, useEffect, useState } from 'react'
import type { Tortilleria, UserRef } from '../types'
import { getJSON, sendJSON, deleteJSON } from '../lib/api'
import ConfirmDeleteUserModal from './ConfirmDeleteUserModal'

interface TortilleriaUsersSectionProps {
  tortillerias: Tortilleria[]
}

const ROLE_LABELS: Record<UserRef['role'], string> = {
  admin: 'Administrador',
  user: 'Usuario',
}

export default function TortilleriaUsersSection({ tortillerias }: TortilleriaUsersSectionProps) {
  const [users, setUsers] = useState<UserRef[]>([])
  const [usersError, setUsersError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [members, setMembers] = useState<UserRef[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<UserRef | null>(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)

  useEffect(() => {
    getJSON('/api/users')
      .then((json: UserRef[] | null) => setUsers(json ?? []))
      .catch((err) => setUsersError(err.message))
  }, [])

  useEffect(() => {
    setSelectedId((prev) =>
      prev != null && tortillerias.some((t) => t.id === prev) ? prev : (tortillerias[0]?.id ?? null)
    )
  }, [tortillerias])

  const fetchMembers = useCallback(() => {
    if (selectedId == null) {
      setMembers([])
      setMembersLoading(false)
      return
    }
    setMembersLoading(true)
    setMembersError(null)
    getJSON(`/api/tortillerias/${selectedId}/users`)
      .then((json: UserRef[] | null) => setMembers(json ?? []))
      .catch((err) => setMembersError(err.message))
      .finally(() => setMembersLoading(false))
  }, [selectedId])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  function handleAdd() {
    if (selectedId == null || !selectedUserId) return
    setAdding(true)
    setAddError(null)

    sendJSON('POST', `/api/tortillerias/${selectedId}/users`, { user_id: Number(selectedUserId) })
      .then(() => {
        setSelectedUserId('')
        fetchMembers()
      })
      .catch((err) => setAddError(err.message))
      .finally(() => setAdding(false))
  }

  function handleRemove() {
    if (selectedId == null || !pendingRemove) return
    setRemoving(true)
    setRemoveError(null)

    deleteJSON(`/api/tortillerias/${selectedId}/users/${pendingRemove.id}`)
      .then(() => {
        setPendingRemove(null)
        fetchMembers()
      })
      .catch((err) => setRemoveError(err.message))
      .finally(() => setRemoving(false))
  }

  const available = users.filter((u) => !members.some((m) => m.id === u.id))
  const selected = tortillerias.find((t) => t.id === selectedId) ?? null

  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">Usuarios por Tortillería</h2>

      {usersError && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Error al cargar usuarios: {usersError}
        </p>
      )}

      <div className="mb-4 max-w-md">
        <label htmlFor="ut-tortilleria" className="mb-1 block text-sm font-medium text-gray-600">
          Tortillería
        </label>
        <select
          id="ut-tortilleria"
          value={selectedId ?? ''}
          onChange={(e) => setSelectedId(Number(e.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          {tortillerias.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {membersLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : membersError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {membersError}
        </p>
      ) : (
        <div className="rounded-lg border border-gray-200">
          {members.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">Sin usuarios asignados.</p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                      <th className="px-4 py-2 font-medium">Usuario</th>
                      <th className="px-4 py-2 font-medium">Rol</th>
                      <th className="px-4 py-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{m.name}</td>
                        <td className="px-4 py-2.5 text-gray-600">{ROLE_LABELS[m.role]}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => {
                              setRemoveError(null)
                              setPendingRemove(m)
                            }}
                            title="Quitar usuario"
                            aria-label={`Quitar a ${m.name}`}
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
                                d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-3 md:hidden">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-800">{m.name}</p>
                      <p className="text-xs text-gray-500">{ROLE_LABELS[m.role]}</p>
                    </div>
                    <button
                      onClick={() => {
                        setRemoveError(null)
                        setPendingRemove(m)
                      }}
                      aria-label={`Quitar a ${m.name}`}
                      className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
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
                          d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="mt-4 flex max-w-md flex-col items-stretch gap-3 md:flex-row md:items-end md:gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="ut-user" className="mb-1 block text-sm font-medium text-gray-600">
            Agregar usuario
          </label>
          <select
            id="ut-user"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Seleccionar usuario...</option>
            {available.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({ROLE_LABELS[u.role]})
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAdd}
          disabled={adding || !selectedUserId || selectedId == null}
          className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto md:py-2"
        >
          {adding ? 'Agregando...' : 'Agregar'}
        </button>
      </div>

      {addError && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{addError}</p>
      )}

      {pendingRemove && (
        <ConfirmDeleteUserModal
          user={pendingRemove}
          tortilleriaName={selected?.name ?? ''}
          deleting={removing}
          error={removeError}
          onCancel={() => {
            if (!removing) setPendingRemove(null)
          }}
          onConfirm={handleRemove}
        />
      )}
    </div>
  )
}
