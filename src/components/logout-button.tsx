'use client'
import { LogOut } from 'lucide-react'
import { api } from '@/lib/api'

export function LogoutButton() {
  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {})
    location.href = '/login'
  }

  return (
    <button
      onClick={logout}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
    >
      <LogOut className="h-4 w-4" />
      <span>Sign out</span>
    </button>
  )
}
