'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Bell, CheckCircle2, FileText } from 'lucide-react'
import { Badge, Button, Card, ErrorText, PageHeader, fmtDateTime } from '@/components/ui'
import { api } from '@/lib/api'
import { useMe } from '@/lib/me'

type D = {
  pendingApprovals: number
  unreadNotifications: number
  myDocuments: { docType: string; status: string; n: number }[]
  recentNotifications: { id: string; title: string; readAt: string | null; createdAt: string }[]
}

export default function PortalHome() {
  const me = useMe()
  const [d, setD] = useState<D | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<{ data: D }>('/dashboard')
      .then((r) => setD(r.data))
      .catch((e) => setError(e.message))
  }, [])

  const totalDocs = d ? d.myDocuments.reduce((a, b) => a + Number(b.n), 0) : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Supplier Portal${me ? ` — ${me.displayName}` : ''}`}
        subtitle="Manage your vendor profile, quotations, purchase orders, and delivery receipts."
        actions={
          <Link href="/portal/notifications">
            <Button variant="secondary">
              <Bell className="h-4 w-4" />
              <span>Notifications ({d?.unreadNotifications ?? 0})</span>
            </Button>
          </Link>
        }
      />

      <ErrorText error={error} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Documents</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{totalDocs}</p>
        </div>

        <Link
          href="/portal/notifications"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs hover:border-brand-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Unread Notifications</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700">
              <Bell className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{d?.unreadNotifications ?? 0}</p>
        </Link>

        <Link
          href="/portal/profile"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs hover:border-brand-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Account Status</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Badge value="ACTIVE" />
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
              Profile <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>
      </div>

      <Card title="Recent Notifications">
        {!d?.recentNotifications.length ? (
          <p className="py-6 text-center text-xs text-gray-400">No recent notifications.</p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm">
            {d.recentNotifications.map((n) => (
              <li key={n.id} className="flex items-center justify-between py-2.5">
                <span className={n.readAt ? 'text-gray-500' : 'font-semibold text-gray-900'}>{n.title}</span>
                <span className="text-xs text-gray-400">{fmtDateTime(n.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
