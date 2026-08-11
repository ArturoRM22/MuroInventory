import { useEffect, useState, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import type { Tortilleria } from '../types'
import { useTortilleria } from '../context/tortilleria'
import { getJSON, deleteJSON } from '../lib/api'
import TortilleriaFormModal from '../components/TortilleriaFormModal'
import ConfirmDeleteTortilleriaModal from '../components/ConfirmDeleteTortilleriaModal'
import TortilleriaUsersSection from '../components/TortilleriaUsersSection'

export default function Tortillerias() {
  const { user, refresh } = useTortilleria()
  const [list, setList] = useState<Tortilleria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Tortilleria | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Tortilleria | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const fetchList = useCallback(() => {
    getJSON('/api/tortillerias')
      .then((json) => setList(json ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  if (!user || user.role !== 'super') {
    return <Navigate to="/" replace />
  }

  function afterMutate() {
    setFormOpen(false)
    setEditing(null)
    fetchList()
    refresh()
  }

  function handleDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    setDeleteError(null)

    deleteJSON(`/api/tortillerias/${pendingDelete.id}`)
      .then(() => {
        setPendingDelete(null)
        afterMutate()
      })
      .catch((err) => setDeleteError(err.message))
      .finally(() => setDeleting(false))
  }

  const mains = list.filter((t) => t.is_main)
  const nameOf = (id: number | null) => (id != null ? list.find((t) => t.id === id)?.name : null)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-800 md:text-2xl">Tortillerías</h1>
        <button
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
          className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 md:py-2"
        >
          Nueva Tortillería
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium">Error al cargar tortillerías</p>
          <p className="mt-1 text-sm">{error}</p>
          <button
            onClick={fetchList}
            className="mt-3 cursor-pointer rounded bg-red-600 px-4 py-1.5 text-sm text-white hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <>
          {list.length === 0 ? (
            <p className="text-gray-500">Sin tortillerías registradas.</p>
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:block">
                <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Nombre</th>
                  <th className="pb-2 pr-4 font-medium">Tipo</th>
                  <th className="pb-2 pr-4 font-medium">Principal</th>
                  <th className="pb-2 pr-4 font-medium">Existencia inicial</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-gray-800">{t.name}</td>
                    <td className="py-2.5 pr-4">
                      {t.is_main ? (
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          Principal
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                          Sucursal
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600">{nameOf(t.main_tortilleria_id) ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{t.initial_stock}</td>
                    <td className="py-2.5 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditing(t)
                            setFormOpen(true)
                          }}
                          title="Editar"
                          aria-label={`Editar ${t.name}`}
                          className="cursor-pointer rounded-lg p-2.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600 md:p-2"
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
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setDeleteError(null)
                            setPendingDelete(t)
                          }}
                          title="Eliminar"
                          aria-label={`Eliminar ${t.name}`}
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
              </div>

              <div className="space-y-3 md:hidden">
                {list.map((t) => (
                  <div key={t.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-800">{t.name}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {t.is_main ? 'Principal' : `Sucursal de ${nameOf(t.main_tortilleria_id) ?? '—'}`}
                        </p>
                      </div>
                      {t.is_main ? (
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          Principal
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                          Sucursal
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Existencia inicial:{' '}
                        <span className="font-semibold text-gray-800">{t.initial_stock}</span>
                      </p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditing(t)
                            setFormOpen(true)
                          }}
                          aria-label={`Editar ${t.name}`}
                          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
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
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setDeleteError(null)
                            setPendingDelete(t)
                          }}
                          aria-label={`Eliminar ${t.name}`}
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
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {list.length > 0 && <TortilleriaUsersSection tortillerias={list} />}

      {formOpen && (
        <TortilleriaFormModal
          tortilleria={editing}
          mains={mains}
          onCancel={() => setFormOpen(false)}
          onSaved={afterMutate}
        />
      )}

      {pendingDelete && (
        <ConfirmDeleteTortilleriaModal
          tortilleria={pendingDelete}
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
