import { createContext, useContext } from 'react'
import type { Tortilleria } from '../types'

export interface TortilleriaContextValue {
  user: { id: number; name: string; role: 'admin' | 'user' } | null
  tortillerias: Tortilleria[]
  current: Tortilleria | null
  loading: boolean
  setCurrent: (id: number) => void
  refresh: () => void
}

export const TortilleriaContext = createContext<TortilleriaContextValue | null>(null)

export function useTortilleria() {
  const ctx = useContext(TortilleriaContext)
  if (!ctx) throw new Error('useTortilleria must be used within TortilleriaProvider')
  return ctx
}
