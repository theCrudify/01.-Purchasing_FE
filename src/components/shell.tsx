'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Bell,
  Building2,
  ChevronDown,
  Clock,
  CreditCard,
  Database,
  FileCheck,
  FileText,
  FolderGit2,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Search,
  Shield,
  ShoppingCart,
  User,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react'
import { ALL_NAV, type NavItem } from '@/nav'
import { api, post } from '@/lib/api'
import { MeProvider, useMe } from '@/lib/me'
import { fmtDateTime } from './ui'

function getSectionIcon(section: string) {
  switch (section) {
    case 'Overview':
      return <LayoutDashboard className="h-4 w-4" />
    case 'Purchasing Documents':
    case 'Procurement':
      return <ShoppingCart className="h-4 w-4" />
    case 'Cash Advance & Reimbursement':
      return <Wallet className="h-4 w-4" />
    case 'Invoicing & Outgoing Payment':
      return <Receipt className="h-4 w-4" />
    case 'Vendors & Partners':
      return <Building2 className="h-4 w-4" />
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

function AppHeader({
  area,
  onToggleSidebar,
  onToggleMobile,
  items,
}: {
  area: 'internal' | 'portal'
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
    api<{ data: { pendingApprovals: number; unreadNotifications: number; recentNotifications: any[] } }>(area === 'portal' ? '/dashboard/portal' : '/dashboard')
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
    : 'U'

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full border-b border-gray-200 bg-white print:hidden">
      <div className="flex flex-1 items-center justify-between px-4 lg:px-6">
        {/* Left: Sidebar Toggle & Command Search */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.innerWidth >= 1024) onToggleSidebar()
              else onToggleMobile()
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Quick Search Input */}
          <div className="relative hidden sm:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                value={cmdQuery}
                onFocus={() => setCmdOpen(true)}
                onBlur={() => setTimeout(() => setCmdOpen(false), 180)}
                onChange={(e) => {
                  setCmdQuery(e.target.value)
                  setCmdOpen(true)
                }}
                placeholder="Quick search menu…"
                className="h-9 w-64 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-12 text-xs text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-brand-500/15 xl:w-80 transition-all"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                ⌘K
              </span>
            </div>

            {cmdOpen && (
              <div className="absolute left-0 mt-1.5 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-lg z-50">
                <div className="border-b border-gray-100 bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-gray-500">
                  Navigation
                </div>
                <ul className="max-h-64 overflow-y-auto divide-y divide-gray-50 p-1">
                  {filteredNav.map((n) => (
                    <li key={n.href}>
                      <button
                        type="button"
                        onMouseDown={() => {
                          router.push(n.href)
                          setCmdOpen(false)
                          setCmdQuery('')
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-gray-700 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                      >
                        <span className="font-medium">{n.label}</span>
                        <span className="text-[11px] text-gray-400">{n.section}</span>
                      </button>
                    </li>
                  ))}
                  {!filteredNav.length && (
                    <li className="px-3 py-4 text-center text-xs text-gray-400">No matching menu</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions, Pending Tasks Pill, Notifications, User Profile */}
        <div className="flex items-center gap-2.5">
          {area === 'internal' && (
            <Link
              href="/approvals"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Clock className="h-3.5 w-3.5 text-gray-500" />
              <span>Approvals</span>
              <span className="rounded-full bg-brand-600 px-1.5 py-0.2 text-[11px] font-semibold text-white">
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
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-lg z-50">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-900">Notifications</h3>
                    <p className="text-[11px] text-gray-500">{unreadCount} unread</p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={async () => {
                        await post('/notifications/read-all')
                        loadHeaderStats()
                      }}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                  {notifs.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400">No notifications</div>
                  ) : (
                    notifs.map((n) => (
                      <div key={n.id} className="flex items-start gap-2.5 px-4 py-3 hover:bg-gray-50 transition-colors">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            n.readAt ? 'bg-gray-300' : 'bg-brand-600'
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

                <div className="border-t border-gray-100 bg-gray-50 p-2 text-center">
                  <Link
                    href={area === 'portal' ? '/portal/notifications' : '/notifications'}
                    onClick={() => setNotifOpen(false)}
                    className="block rounded-lg py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    View all notifications
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
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 hover:bg-gray-50 transition-colors"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-xs font-semibold text-white">
                {initials}
              </span>
              <span className="hidden max-w-[130px] truncate text-xs font-medium text-gray-800 sm:block">
                {me?.displayName ?? 'User'}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${userOpen ? 'rotate-180' : ''}`} />
            </button>

            {userOpen && (
              <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-lg z-50">
                <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="truncate text-xs font-semibold text-gray-900">{me?.displayName}</p>
                  <p className="truncate text-[11px] text-gray-500">{me?.email}</p>
                </div>

                <div className="p-1.5 space-y-0.5">
                  <Link
                    href={area === 'portal' ? '/portal/profile' : '/profile'}
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    <span>My Profile</span>
                  </Link>
                  {area === 'internal' && (
                    <>
                      <Link
                        href="/approvals"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        <FileCheck className="h-4 w-4 text-gray-400" />
                        <span>My Approvals</span>
                      </Link>
                      <Link
                        href="/settings/delegations"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        <UserCheck className="h-4 w-4 text-gray-400" />
                        <span>Delegations & Backups</span>
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
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-error-600 hover:bg-error-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
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

  const isNavActive = (href: string) =>
    path === href || (href !== '/dashboard' && href !== '/portal' && path.startsWith(href + '/'))

  const DEFAULT_OPEN = new Set(['Overview', 'Purchasing Documents', 'Procurement', 'Invoicing & Outgoing Payment', 'Account'])
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      sections.map((s) => [
        s,
        DEFAULT_OPEN.has(s) || items.filter((n) => n.section === s).some((n) => isNavActive(n.href)),
      ])
    )
  )

  useEffect(() => {
    for (const s of sections) {
      if (items.filter((n) => n.section === s).some((n) => isNavActive(n.href))) {
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
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        onMouseEnter={() => !expanded && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white text-gray-900 transition-all duration-200 ease-in-out print:hidden ${
          showFull ? 'w-[264px]' : 'w-[76px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Uniform Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <Link
            href={area === 'portal' ? '/portal' : '/dashboard'}
            className="flex items-center gap-2.5 overflow-hidden"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white shadow-theme-xs">
              <Layers className="h-5 w-5" />
            </div>
            {showFull && (
              <div className="min-w-0">
                <span className="block truncate text-sm font-bold tracking-tight text-gray-900 leading-none">
                  {area === 'portal' ? 'Supplier Portal' : 'Purchasing'}
                </span>
                <span className="mt-1 block truncate text-[11px] font-medium text-gray-500">
                  Procurement System
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

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
          {sections.map((s) => {
            const sectionItems = items.filter((n) => n.section === s)
            const hasActiveChild = sectionItems.some((n) => isNavActive(n.href))
            const isOpen = openSections[s] ?? DEFAULT_OPEN.has(s)

            return (
              <div key={s} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSection(s)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${
                    hasActiveChild ? 'text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  } ${!showFull ? 'justify-center' : 'justify-between'}`}
                  title={s}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={hasActiveChild ? 'text-brand-600' : 'text-gray-400'}>
                      {getSectionIcon(s)}
                    </span>
                    {showFull && <span>{s}</span>}
                  </div>
                  {showFull && (
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>

                {showFull && isOpen && (
                  <ul className="ml-4 space-y-0.5 border-l border-gray-200 pl-2.5">
                    {sectionItems.map((n) => {
                      const isActive = isNavActive(n.href)
                      return (
                        <li key={n.href}>
                          <Link
                            href={n.href}
                            onClick={() => mobileOpen && onCloseMobile()}
                            className={`block truncate rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
                              isActive
                                ? 'bg-brand-50 font-semibold text-brand-700'
                                : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                          >
                            {n.label}
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
      </aside>
    </>
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
  const router = useRouter()
  const [expanded, setExpanded] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  // UX gate only (the API enforces user type): BP users live in /portal, internal users in the app.
  const home = me?.userType === 'BP' ? '/portal' : '/dashboard'
  const wrongArea = !!me && (me.userType === 'BP') !== (area === 'portal')
  useEffect(() => { if (wrongArea) router.replace(home) }, [wrongArea, home, router])

  const allowed = (n: NavItem) =>
    (n.area ?? 'internal') === area && (!n.perm || [n.perm].flat().some((p) => me?.permissions.includes(p)))
  const items = me ? ALL_NAV.filter(allowed) : []

  if (wrongArea) return null

  return (
    <div className="min-h-screen bg-gray-50 print:min-h-0 print:bg-white">
      <AppSidebar
        area={area}
        expanded={expanded}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        items={items}
      />

      <div
        className={`flex min-h-screen flex-col transition-all duration-200 ease-in-out print:min-h-0 print:pl-0 ${
          expanded ? 'lg:pl-[264px]' : 'lg:pl-[76px]'
        }`}
      >
        <AppHeader
          area={area}
          onToggleSidebar={() => setExpanded((e) => !e)}
          onToggleMobile={() => setMobileOpen((m) => !m)}
          items={items}
        />

        <main className="mx-auto w-full max-w-screen-2xl flex-1 p-4 md:p-6 print:max-w-none print:p-0">{children}</main>
      </div>
    </div>
  )
}
