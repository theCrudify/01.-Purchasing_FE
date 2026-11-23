'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { ALL_NAV, type NavItem } from '@/nav'
import { MeProvider, useMe } from '@/lib/me'
import { LogoutButton } from './logout-button'

function Sidebar({ area, title }: { area: 'internal' | 'portal'; title: string }) {
  const me = useMe()
  const path = usePathname()
  const allowed = (n: NavItem) => (n.area ?? 'internal') === area && (!n.perm || [n.perm].flat().some((p) => me?.permissions.includes(p)))
  const items = ALL_NAV.filter(allowed)
  const sections = [...new Set(items.map((n) => n.section))]
  return (
    <aside className="w-60 shrink-0 border-r bg-gray-50 p-4">
      <p className="mb-1 font-semibold">{title}</p>
      <p className="mb-4 truncate text-xs text-gray-500">{me?.displayName}</p>
      <nav className="space-y-4 text-sm">
        {sections.map((s) => (
          <div key={s}>
            <p className="mb-1 text-xs font-semibold uppercase text-gray-400">{s}</p>
            {items.filter((n) => n.section === s).map((n) => (
              <Link key={n.href} href={n.href} className={`block rounded px-2 py-1 hover:bg-gray-200 ${path.startsWith(n.href) ? 'bg-gray-200 font-medium' : ''}`}>{n.label}</Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="mt-6"><LogoutButton /></div>
    </aside>
  )
}

/** App shell for internal (Expressiv) and BP portal (Supplier Portal) areas — one app, two menus. */
export function Shell({ area, children }: { area: 'internal' | 'portal'; children: ReactNode }) {
  return (
    <MeProvider>
      <div className="flex min-h-screen">
        <Sidebar area={area} title={area === 'portal' ? 'KPIN Supplier Portal' : 'KPIN'} />
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </MeProvider>
  )
}
