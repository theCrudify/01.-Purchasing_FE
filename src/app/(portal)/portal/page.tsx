'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Bell, Building2, CheckCircle2, FileCheck2, FileText, PackageCheck, User } from 'lucide-react'
import { Badge, Card, ErrorText, fmtDateTime } from '@/components/ui'
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
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-linear-to-r from-[#1e3a8a] to-brand-700 p-6 text-white shadow-theme-md sm:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/shape/grid-01.svg"
          alt=""
          className="pointer-events-none absolute right-0 top-0 h-full w-auto max-w-xs opacity-30 select-none"
        />
        <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              PT Kansai Paint Indonesia • Supplier Portal
            </span>
            <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              Selamat Datang, {me?.displayName ?? 'Business Partner'}
            </h1>
            <p className="mt-1 text-sm text-blue-100">
              Kelola profil rekanan, penawaran harga (Quotation), Purchase Order, dan notifikasi pengadaan.
            </p>
          </div>
          <Link
            href="/portal/notifications"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-theme-xs hover:bg-blue-50 transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span>Notifikasi ({d?.unreadNotifications ?? 0})</span>
          </Link>
        </div>
      </div>

      <ErrorText error={error} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Total Dokumen Portal</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-gray-900">{totalDocs}</p>
        </div>

        <Link
          href="/portal/notifications"
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs hover:border-brand-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Notifikasi Belum Dibaca</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Bell className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-gray-900">{d?.unreadNotifications ?? 0}</p>
        </Link>

        <Link
          href="/portal/profile"
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs hover:border-brand-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Status Akun Rekanan</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Badge value="ACTIVE" />
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
              Kelola Profil <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>
      </div>

      <Card title="Notifikasi Terbaru">
        {!d?.recentNotifications.length ? (
          <p className="py-6 text-center text-sm text-gray-400">Belum ada notifikasi terbaru.</p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm">
            {d.recentNotifications.map((n) => (
              <li key={n.id} className="flex items-center justify-between py-3">
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
