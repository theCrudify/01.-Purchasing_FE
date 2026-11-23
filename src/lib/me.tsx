'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'

export type Me = { id: string; email: string; displayName: string; userType: 'INTERNAL' | 'BP' | 'SYSTEM'; permissions: string[] }

const Ctx = createContext<Me | null>(null)

/** Loads /auth/me once per app shell. UI-only: the API re-checks every permission. */
export function MeProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  useEffect(() => { api<{ data: Me }>('/auth/me').then((r) => setMe(r.data)).catch(() => {}) }, [])
  return <Ctx.Provider value={me}>{children}</Ctx.Provider>
}
export const useMe = () => useContext(Ctx)
export const useCan = () => { const me = useMe(); return (p: string) => !!me?.permissions.includes(p) }
