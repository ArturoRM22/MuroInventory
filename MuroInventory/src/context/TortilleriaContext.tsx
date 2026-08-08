import { useEffect, useState, type ReactNode } from 'react'
import { TortilleriaContext } from './tortilleria'
import { getJSON } from '../lib/api'
import type { Me, Tortilleria, UserRole } from '../types'

export function TortilleriaProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: number; name: string; role: UserRole } | null>(null)
  const [tortillerias, setTortillerias] = useState<Tortilleria[]>([])
  const [current, setCurrentState] = useState<Tortilleria | null>(null)
  const [loading, setLoading] = useState(true)

  function applyCurrent(list: Tortilleria[]) {
    const saved = sessionStorage.getItem('currentTortilleriaId')
    const found = saved ? list.find((t) => String(t.id) === saved) : null
    const next = found ?? list[0] ?? null
    setCurrentState(next)
    if (next) sessionStorage.setItem('currentTortilleriaId', String(next.id))
  }

  function refresh() {
    if (!sessionStorage.getItem('user')) {
      setLoading(false)
      return
    }
    setLoading(true)
    getJSON('/api/auth/me')
      .then((me: Me | null) => {
        if (!me) return
        setUser({ id: me.id, name: me.name, role: me.role })
        setTortillerias(me.tortillerias ?? [])
        applyCurrent(me.tortillerias ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  function setCurrent(id: number) {
    const next = tortillerias.find((t) => t.id === id) ?? null
    setCurrentState(next)
    if (next) sessionStorage.setItem('currentTortilleriaId', String(next.id))
  }

  function reset() {
    setUser(null)
    setTortillerias([])
    setCurrentState(null)
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <TortilleriaContext.Provider value={{ user, tortillerias, current, loading, setCurrent, refresh, reset }}>
      {children}
    </TortilleriaContext.Provider>
  )
}
