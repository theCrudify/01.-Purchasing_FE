'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  PlusCircle,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { Badge, Card, ErrorText, PageHeader, fmtDateTime } from '@/components/ui'
import { api } from '@/lib/api'
import { useMe } from '@/lib/me'

type D = {
  pendingApprovals: number
  unreadNotifications: number
  myDocuments: { docType: string; status: string; n: number }[]
  recentNotifications: { id: string; title: string; readAt: string | null; createdAt: string }[]
}

export default function Dashboard() {
  const me = useMe()
  const [d, setD] = useState<D | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<{ data: D }>('/dashboard')
      .then((r) => setD(r.data))
      .catch((e) => setError(e.message))
  }, [])

  const types = d ? [...new Set(d.myDocuments.map((x) => x.docType))] : []
  const totalMyDocs = d ? d.myDocuments.reduce((acc, curr) => acc + Number(curr.n), 0) : 0

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-500/10 via-sky-500/5 to-transparent p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back, {me?.displayName ?? 'User'} 👋
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Here is what requires your attention in your purchasing workspace today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/approvals"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Review Approvals</span>
            </Link>
          </div>
        </div>
      </div>

      <ErrorText error={error} />

      {d && (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/approvals"
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Waiting for My Approval
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {d.pendingApprovals}
                </span>
                <span className="text-xs font-medium text-slate-400">tasks pending</span>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-indigo-600">
                <span>Open approvals inbox</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/notifications"
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Unread Notifications
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 group-hover:scale-105 transition-transform">
                  <Bell className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {d.unreadNotifications}
                </span>
                <span className="text-xs font-medium text-slate-400">unread alerts</span>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-indigo-600">
                <span>View all updates</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  My Active Documents
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FileText className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {totalMyDocs}
                </span>
                <span className="text-xs font-medium text-slate-400">documents authored</span>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-500">
                <span>Across {types.length} document categories</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* My Documents Breakdown */}
            <div className="lg:col-span-2">
              <Card title="My Authored Documents Overview">
                {!types.length ? (
                  <p className="py-8 text-center text-sm text-slate-400">
                    No documents created yet. New purchase requests and quotations will appear here.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {types.map((t) => (
                      <div
                        key={t}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-12 items-center justify-center rounded-md bg-indigo-100 text-xs font-bold text-indigo-700">
                            {t}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">
                            {t === 'PR' ? 'Purchase Request' : t === 'PO' ? 'Purchase Order' : t}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {d.myDocuments
                            .filter((x) => x.docType === t)
                            .map((x) => (
                              <span
                                key={x.status}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium shadow-2xs"
                              >
                                <Badge value={x.status} />
                                <span className="font-bold text-slate-800">{x.n}</span>
                              </span>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Recent Notifications Feed */}
            <div className="lg:col-span-1">
              <Card title="Recent Activity">
                {!d.recentNotifications.length ? (
                  <p className="py-8 text-center text-sm text-slate-400">No recent notifications.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {d.recentNotifications.map((n) => (
                      <div key={n.id} className="py-2.5 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                              n.readAt ? 'bg-slate-300' : 'bg-indigo-600 ring-2 ring-indigo-200'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-xs ${
                                n.readAt ? 'text-slate-600' : 'font-semibold text-slate-900'
                              }`}
                            >
                              {n.title}
                            </p>
                            <span className="block text-[11px] text-slate-400 mt-0.5">
                              {fmtDateTime(n.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
