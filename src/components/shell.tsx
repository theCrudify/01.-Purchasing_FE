'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  FileCheck,
  FileText,
  FolderGit2,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Shield,
  Sliders,
  User,
  UserCheck,
  X,
} from 'lucide-react'
import { ALL_NAV, type NavItem } from '@/nav'
import { api, post } from '@/lib/api'
import { MeProvider, useMe } from '@/lib/me'
import { fmtDateTime } from './ui'

function getSectionIcon(section: string) {
  switch (section) {
    case 'Overview':
      return <LayoutDashboard className="h-5 w-5" />
    case 'Workflow & Approval':
      return <FileCheck className="h-5 w-5" />
    case 'Master Data':
      return <Database className="h-5 w-5" />
    case 'Purchasing Setup':
      return <Layers className="h-5 w-5" />
    case 'Administration':
      return <Shield className="h-5 w-5" />
    case 'Documents':
      return <FileText className="h-5 w-5" />
    case 'Account':
      return <User className="h-5 w-5" />
    default:
      return <FolderGit2 className="h-5 w-5" />
  }
}

function AppHeader({
  area,
  expanded,
  onToggleSidebar,
  onToggleMobile,
  items,
}: {
  area: 'internal' | 'portal'
  expanded: boolean
  onToggleSidebar: () => void
  onToggleMobile: () => void
  items: NavItem[]
}) {
  const me = useMe()
  const router = useRouter()
  const [cmdQuery, setCmdQuery] = useState('')
  const [cmdOpen, setCmdOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [notifs, setNotifs] = useState<any[]>([])
  const searchRef = useRef<HTMLInputElement>(null)

  const loadHeaderStats = () => {
    api<{ data: { pendingApprovals: number; unreadNotifications: number; recentNotifications: any[] } }>('/dashboard')
      .then((r) => {
        setPendingCount(r.data.pendingApprovals ?? 0)
        setUnreadCount(r.data.unreadNotifications ?? 0)
        setNotifs(r.data.recentNotifications ?? [])
      })
      .catch(() => {})
  }

  useEffect(() => {
    loadHeaderStats()
    const timer = setInterval(loadHeaderStats, 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
        setCmdOpen(true)
      }
      if (e.key === 'Escape') {
        setCmdOpen(false)
        setNotifOpen(false)
        setUserOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const filteredNav = cmdQuery.trim()
    ? items.filter(
        (n) =>
          n.label.toLowerCase().includes(cmdQuery.toLowerCase()) ||
          n.section.toLowerCase().includes(cmdQuery.toLowerCase())
      )
    : items.slice(0, 7)

  const initials = me?.displayName
    ? me.displayName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'KP'

  return (
    <header className="sticky top-0 z-40 flex w-full border-b border-gray-200 bg-white/95 backdrop-blur-md">
      <div className="flex flex-1 items-center justify-between px-4 py-3 lg:px-6">
        {/* Left: Sidebar Toggle & Command Search */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => {
              if (window.innerWidth >= 1024) onToggleSidebar()
              else onToggleMobile()
            }}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile Logo */}
          <Link href={area === 'portal' ? '/portal' : '/dashboard'} className="lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo/Seiho.png" alt="Kansai Paint" className="h-7 w-auto" />
          </Link>

          {/* Command Palette Search Input */}
          <div className="relative hidden sm:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                value={cmdQuery}
                onFocus={() => setCmdOpen(true)}
                onBlur={() => setTimeout(() => setCmdOpen(false), 180)}
                onChange={(e) => {
                  setCmdQuery(e.target.value)
                  setCmdOpen(true)
                }}
                placeholder="Cari menu atau modul cepat..."
                className="h-10 w-64 rounded-lg border border-gray-200 bg-gray-50/60 pl-10 pr-14 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-brand-500/15 xl:w-96 transition-all"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-gray-400 shadow-2xs">
                ⌘ K
              </span>
            </div>

            {cmdOpen && (
              <div className="absolute left-0 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-lg z-50">
                <div className="border-b border-gray-100 bg-gray-50/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Navigasi Cepat ({filteredNav.length})
                </div>
                <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50 p-1">
                  {filteredNav.map((n) => (
                    <li key={n.href}>
                      <button
                        type="button"
                        onMouseDown={() => {
                          router.push(n.href)
                          setCmdOpen(false)
                          setCmdQuery('')
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                      >
                        <span className="font-medium">{n.label}</span>
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                          {n.section}
                        </span>
                      </button>
                    </li>
                  ))}
                  {!filteredNav.length && (
                    <li className="px-3 py-4 text-center text-xs text-gray-400">Menu tidak ditemukan</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions, Pending Tasks Pill, Notifications, User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* System Status Badge */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>System Online</span>
          </div>

          {/* Pending Approvals Quick Pill */}
          {area === 'internal' && (
            <Link
              href="/approvals"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
              title="My Pending Approvals"
            >
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>Approval:</span>
              <span className="rounded-full bg-amber-600 px-1.5 py-0.2 text-[11px] font-bold text-white">
                {pendingCount}
              </span>
            </Link>
          )}

          {/* Notification Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifOpen(!notifOpen)
                setUserOpen(false)
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c3002f] px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2.5 w-80 sm:w-96 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xl z-50">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Notifikasi Sistem</h3>
                    <p className="text-xs text-gray-500">{unreadCount} pesan belum dibaca</p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={async () => {
                        await post('/notifications/read-all')
                        loadHeaderStats()
                      }}
                      className="text-xs font-semibold text-brand-600 hover:underline"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {notifs.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400">Belum ada notifikasi terbaru</div>
                  ) : (
                    notifs.map((n) => (
                      <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            n.readAt ? 'bg-gray-300' : 'bg-brand-500 ring-2 ring-brand-100'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs ${n.readAt ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
                            {n.title}
                          </p>
                          <span className="mt-0.5 block text-[11px] text-gray-400">{fmtDateTime(n.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-gray-100 bg-gray-50/50 p-2.5 text-center">
                  <Link
                    href={area === 'portal' ? '/portal/notifications' : '/notifications'}
                    onClick={() => setNotifOpen(false)}
                    className="block rounded-lg py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    Lihat Semua Notifikasi →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setUserOpen(!userOpen)
                setNotifOpen(false)
              }}
              className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white p-1.5 pr-3 hover:bg-gray-50 transition-colors"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-[#c3002f] to-brand-600 text-xs font-bold text-white shadow-2xs">
                {initials}
              </span>
              <div className="hidden text-left sm:block">
                <span className="block max-w-[140px] truncate text-xs font-semibold text-gray-800 leading-tight">
                  {me?.displayName ?? 'Administrator'}
                </span>
                <span className="block text-[10px] font-medium text-gray-400">
                  {me?.userType === 'BP' ? 'Business Partner' : 'KPIN Internal'}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${userOpen ? 'rotate-180' : ''}`} />
            </button>

            {userOpen && (
              <div className="absolute right-0 mt-2.5 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xl z-50">
                <div className="border-b border-gray-100 bg-gray-50/60 px-4 py-3.5">
                  <p className="truncate text-sm font-semibold text-gray-900">{me?.displayName}</p>
                  <p className="truncate text-xs text-gray-500">{me?.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 border border-brand-200/60">
                      {me?.userType ?? 'INTERNAL'}
                    </span>
                    {((me as any)?.roles as string[] | undefined)?.slice(0, 2).map((r: string) => (
                      <span
                        key={r}
                        className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-1.5 space-y-0.5">
                  <Link
                    href={area === 'portal' ? '/portal/profile' : '/profile'}
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    <span>Profil & Tanda Tangan</span>
                  </Link>
                  {area === 'internal' && (
                    <>
                      <Link
                        href="/approvals"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        <FileCheck className="h-4 w-4 text-gray-400" />
                        <span>Kotak Masuk Approval</span>
                      </Link>
                      <Link
                        href="/settings/delegations"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        <UserCheck className="h-4 w-4 text-gray-400" />
                        <span>Delegasi & Backup</span>
                      </Link>
                    </>
                  )}
                </div>

                <div className="border-t border-gray-100 p-1.5">
                  <button
                    onClick={async () => {
                      await api('/auth/logout', { method: 'POST' }).catch(() => {})
                      location.href = '/login'
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-error-600 hover:bg-error-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Keluar (Sign Out)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function AppSidebar({
  area,
  expanded,
  mobileOpen,
  onCloseMobile,
  items,
}: {
  area: 'internal' | 'portal'
  expanded: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
  items: NavItem[]
}) {
  const path = usePathname()
  const [hovered, setHovered] = useState(false)
  const sections = [...new Set(items.map((n) => n.section))]

  // Track open accordion sections; default all open or active section open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((s) => [s, true]))
  )

  useEffect(() => {
    for (const s of sections) {
      const hasActive = items
        .filter((n) => n.section === s)
        .some((n) => path === n.href || (n.href !== '/dashboard' && path.startsWith(n.href)))
      if (hasActive) {
        setOpenSections((prev) => ({ ...prev, [s]: true }))
      }
    }
  }, [path, sections.join(',')])

  const showFull = expanded || hovered || mobileOpen

  const toggleSection = (s: string) => {
    setOpenSections((prev) => ({ ...prev, [s]: !(prev[s] ?? true) }))
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        onMouseEnter={() => !expanded && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white text-gray-900 transition-all duration-300 ease-in-out ${
          showFull ? 'w-[280px]' : 'w-[84px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Top Brand Header with official Kansai Paint Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5">
          <Link
            href={area === 'portal' ? '/portal' : '/dashboard'}
            className="flex items-center gap-3 overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo/Seiho.png"
              alt="PT Kansai Paint Indonesia"
              className={`transition-all ${showFull ? 'h-8 w-auto' : 'h-7 w-7 object-contain'}`}
            />
            {showFull && (
              <div className="border-l border-gray-200 pl-2.5">
                <span className="block text-xs font-extrabold tracking-tight text-gray-900 leading-none">
                  KPIN PORTAL
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wider text-[#c3002f]">
                  {area === 'portal' ? 'Supplier' : 'Purchasing'}
                </span>
              </div>
            )}
          </Link>
          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
          {sections.map((s) => {
            const sectionItems = items.filter((n) => n.section === s)
            const hasActiveChild = sectionItems.some(
              (n) => path === n.href || (n.href !== '/dashboard' && path.startsWith(n.href))
            )
            const isOpen = openSections[s] ?? true

            return (
              <div key={s} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSection(s)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                    hasActiveChild
                      ? 'bg-brand-50/70 text-brand-600'
                      : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-800'
                  } ${!showFull ? 'justify-center' : 'justify-between'}`}
                  title={s}
                >
                  <div className="flex items-center gap-3">
                    <span className={hasActiveChild ? 'text-brand-600' : 'text-gray-400'}>
                      {getSectionIcon(s)}
                    </span>
                    {showFull && <span>{s}</span>}
                  </div>
                  {showFull && (
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-brand-500' : 'text-gray-400'
                      }`}
                    />
                  )}
                </button>

                {showFull && isOpen && (
                  <ul className="ml-5 space-y-0.5 border-l-2 border-gray-100 pl-3 pt-0.5">
                    {sectionItems.map((n) => {
                      const isActive =
                        path === n.href || (n.href !== '/dashboard' && path.startsWith(n.href))
                      return (
                        <li key={n.href}>
                          <Link
                            href={n.href}
                            onClick={() => mobileOpen && onCloseMobile()}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-[13px] transition-all ${
                              isActive
                                ? 'bg-brand-500 font-semibold text-white shadow-theme-xs'
                                : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                          >
                            <span className="truncate">{n.label}</span>
                            {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/80" />}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>

        {/* Sidebar Footer Widget */}
        {showFull && (
          <div className="border-t border-gray-100 bg-gray-50/60 p-3.5">
            <div className="rounded-xl border border-gray-200/80 bg-white p-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-800">PT Kansai Paint Indonesia</span>
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  v2.0
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-gray-400">
                Integrated Purchasing & Approval System
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

function ShellLayout({ area }: { area: 'internal' | 'portal'; children: ReactNode } & { children: ReactNode }) {
  const me = useMe()
  const [expanded, setExpanded] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  const allowed = (n: NavItem) =>
    (n.area ?? 'internal') === area && (!n.perm || [n.perm].flat().some((p) => me?.permissions.includes(p)))
  const items = ALL_NAV.filter(allowed)

  return (
    <div className="min-h-screen bg-gray-50">
      <AppSidebar
        area={area}
        expanded={expanded}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        items={items}
      />

      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ease-in-out ${
          expanded ? 'lg:pl-[280px]' : 'lg:pl-[84px]'
        }`}
      >
        <AppHeader
          area={area}
          expanded={expanded}
          onToggleSidebar={() => setExpanded((e) => !e)}
          onToggleMobile={() => setMobileOpen((m) => !m)}
          items={items}
        />

        <main className="mx-auto w-full max-w-screen-2xl flex-1 p-4 md:p-6 lg:p-8">{/* ContentSlot */}</main>
      </div>
    </div>
  )
}

export function Shell({ area, children }: { area: 'internal' | 'portal'; children: ReactNode }) {
  return (
    <MeProvider>
      <ShellInner area={area}>{children}</ShellInner>
    </MeProvider>
  )
}

function ShellInner({ area, children }: { area: 'internal' | 'portal'; children: ReactNode }) {
  const me = useMe()
  const [expanded, setExpanded] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  const allowed = (n: NavItem) =>
    (n.area ?? 'internal') === area && (!n.perm || [n.perm].flat().some((p) => me?.permissions.includes(p)))
  const items = ALL_NAV.filter(allowed)

  return (
    <div className="min-h-screen bg-gray-50">
      <AppSidebar
        area={area}
        expanded={expanded}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        items={items}
      />

      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ease-in-out ${
          expanded ? 'lg:pl-[280px]' : 'lg:pl-[84px]'
        }`}
      >
        <AppHeader
          area={area}
          expanded={expanded}
          onToggleSidebar={() => setExpanded((e) => !e)}
          onToggleMobile={() => setMobileOpen((m) => !m)}
          items={items}
        />

        <main className="mx-auto w-full max-w-screen-2xl flex-1 p-4 md:p-6 lg:p-7">{children}</main>
      </div>
    </div>
  )
}
