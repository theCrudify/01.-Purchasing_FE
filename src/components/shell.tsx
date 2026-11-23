'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  Bell,
  Building2,
  CheckSquare,
  ChevronRight,
  Database,
  FileCheck,
  FileText,
  FolderGit2,
  Layers,
  LayoutDashboard,
  Shield,
  User,
  Users,
} from 'lucide-react'
import { ALL_NAV, type NavItem } from '@/nav'
import { MeProvider, useMe } from '@/lib/me'
import { LogoutButton } from './logout-button'

function getSectionIcon(section: string) {
  switch (section) {
    case 'Overview':
      return <LayoutDashboard className="h-4 w-4" />
    case 'Workflow & Approval':
      return <FileCheck className="h-4 w-4" />
    case 'Master Data':
      return <Database className="h-4 w-4" />
    case 'Purchasing Setup':
      return <Layers className="h-4 w-4" />
    case 'Administration':
      return <Shield className="h-4 w-4" />
    case 'Documents':
      return <FileText className="h-4 w-4" />
    case 'Account':
      return <User className="h-4 w-4" />
    default:
      return <FolderGit2 className="h-4 w-4" />
  }
}

function Sidebar({ area, title }: { area: 'internal' | 'portal'; title: string }) {
  const me = useMe()
  const path = usePathname()

  const allowed = (n: NavItem) =>
    (n.area ?? 'internal') === area && (!n.perm || [n.perm].flat().some((p) => me?.permissions.includes(p)))
  const items = ALL_NAV.filter(allowed)
  const sections = [...new Set(items.map((n) => n.section))]

  const initials = me?.displayName
    ? me.displayName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U'

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200/80 bg-white flex flex-col justify-between h-screen sticky top-0">
      <div className="flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-sm shadow-sm shadow-indigo-600/30">
            KP
          </div>
          <div>
            <span className="block text-sm font-bold tracking-tight text-slate-900 leading-none">
              {title}
            </span>
            <span className="block text-xs text-slate-400 mt-1 font-medium">
              {area === 'portal' ? 'Vendor Portal' : 'Enterprise Suite'}
            </span>
          </div>
        </div>

        {/* User Card */}
        {me && (
          <div className="mx-4 my-3 rounded-xl border border-slate-200/60 bg-slate-50/60 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 font-bold text-xs text-indigo-700">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-900">{me.displayName}</p>
                <p className="truncate text-[11px] text-slate-500">{me.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="space-y-5 px-3 py-2 text-sm">
          {sections.map((s) => (
            <div key={s}>
              <div className="flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600">
                {getSectionIcon(s)}
                <span>{s}</span>
              </div>
              <div className="mt-1 space-y-0.5">
                {items
                  .filter((n) => n.section === s)
                  .map((n) => {
                    const isActive = path === n.href || (n.href !== '/dashboard' && path.startsWith(n.href))
                    return (
                      <Link
                        key={n.href}
                        href={n.href}
                        className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-indigo-50 font-semibold text-indigo-700 shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                        }`}
                      >
                        <span className="truncate">{n.label}</span>
                        {isActive && <ChevronRight className="h-3.5 w-3.5 text-indigo-500" />}
                      </Link>
                    )
                  })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Logout */}
      <div className="border-t border-slate-100 p-3 bg-slate-50/40">
        <LogoutButton />
      </div>
    </aside>
  )
}

/** App shell for internal (Expressiv) and BP portal (Supplier Portal) areas */
export function Shell({ area, children }: { area: 'internal' | 'portal'; children: ReactNode }) {
  return (
    <MeProvider>
      <div className="flex min-h-screen bg-slate-50/50">
        <Sidebar area={area} title={area === 'portal' ? 'KPIN Supplier' : 'KPIN Purchasing'} />
        <main className="min-w-0 flex-1 px-8 py-6">{children}</main>
      </div>
    </MeProvider>
  )
}
