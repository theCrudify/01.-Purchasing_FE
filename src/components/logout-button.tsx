'use client'
import { api } from '@/lib/api'
export function LogoutButton() {
  return <button className="text-sm underline" onClick={async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); location.href = '/login' }}>Sign out</button>
}
