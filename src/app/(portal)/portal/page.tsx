'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Bell, CheckCircle2, FileCheck2, FileText, PackageCheck, Receipt } from 'lucide-react'
import { Badge, Button, Card, ErrorText, PageHeader, fmtDateTime } from '@/components/ui'
import { api } from '@/lib/api'
import { useMe } from '@/lib/me'

type D = {
  unreadNotifications: number
  documents: { docType: string; status: string; n: number }[]
  recentNotifications: { id: string; title: string; readAt: string | null; createdAt: string }[]
}

const PORTAL_DOC_TYPES: { code: string; name: string; href: string }[] = [
  { code: 'QUO', name: 'My Quotations (Penawaran Harga)', href: '/portal/quotations' },
  { code: 'PO', name: 'Purchase Orders (Pesanan Pembelian)', href: '/portal/po' },
  { code: 'CTR', name: 'Purchase Contracts (Kontrak Payung)', href: '/portal/contracts' },
  { code: 'GR', name: 'Goods Receipts (Tanda Terima Barang)', href: '/portal/receipts' },
  { code: 'INV', name: 'AP Invoices (Tagihan Pembayaran)', href: '/portal/invoices' },
]

const PORTAL_ACTIONS = [
  { href: '/portal/rfq', title: 'RFQ Invitations', desc: 'Lihat tender aktif & kirim penawaran', icon: FileText },
  { href: '/portal/po', title: 'Purchase Orders', desc: 'Konfirmasi PO yang diterbitkan', icon: PackageCheck },
  { href: '/portal/invoices', title: 'Tagihan & Invoice', desc: 'Ajukan dan pantau status tagihan', icon: Receipt },
  { href: '/portal/profile', title: 'Profil Perusahaan', desc: 'Kelola data rekening & legalitas', icon: FileCheck2 },
]

export default function PortalHome() {
  const me = useMe()
  const [d, setD] = useState<D | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<{ data: D }>('/dashboard/portal')
      .then((r) => setD(r.data))
      .catch((e) => setError(e.message))
  }, [])

  const totalDocs = d ? d.documents.reduce((a, b) => a + Number(b.n), 0) : 0
  const poCount = d ? d.documents.filter((x) => x.docType === 'PO').reduce((a, b) => a + Number(b.n), 0) : 0
  const invCount = d ? d.documents.filter((x) => x.docType === 'INV').reduce((a, b) => a + Number(b.n), 0) : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Supplier Portal${me ? ` — ${me.displayName}` : ''}`}
        subtitle="Kelola undangan tender RFQ, penawaran harga, konfirmasi PO, dan status tagihan Anda."
        actions={
          <>
            <Link href="/portal/rfq">
              <Button>
                <FileText className="h-4 w-4" />
                <span>RFQ Invitations</span>
              </Button>
            </Link>
            <Link href="/portal/po">
              <Button variant="secondary">
                <PackageCheck className="h-4 w-4" />
                <span>Purchase Orders ({poCount})</span>
              </Button>
            </Link>
          </>
        }
      />

      <ErrorText error={error} />

      {/* 4 Balanced Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Total Documents</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-gray-900">{totalDocs}</p>
          <p className="mt-1 text-xs text-gray-500">Seluruh dokumen portal aktif</p>
        </div>

        <Link
          href="/portal/po"
          className="group rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs hover:border-brand-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Purchase Orders</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 group-hover:border-brand-200 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
              <PackageCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-gray-900">{poCount}</p>
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-brand-600">
            <span>Lihat pesanan masuk</span>
            <ArrowRight className="h-3 w-3" />
          </p>
        </Link>

        <Link
          href="/portal/invoices"
          className="group rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs hover:border-brand-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Invoices</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 group-hover:border-brand-200 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-gray-900">{invCount}</p>
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-brand-600">
            <span>Pantau status tagihan</span>
            <ArrowRight className="h-3 w-3" />
          </p>
        </Link>

        <Link
          href="/portal/profile"
          className="group rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs hover:border-brand-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Account Status</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 group-hover:border-brand-200 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Badge value="ACTIVE" />
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
              Profile <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500">{d?.unreadNotifications ?? 0} notifikasi belum dibaca</p>
        </Link>
      </div>

      {/* Main Content Grid: 8/4 matching Internal Dashboard */}
      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 xl:col-span-8">
          <Card noPadding title="Document Summary" desc="Ringkasan dokumen transaksi Anda di portal rekanan.">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Code</th>
                    <th className="px-4 py-3">Document Type</th>
                    <th className="px-4 py-3 text-center">Draft / Submitted</th>
                    <th className="px-4 py-3 text-center">Active / Issued</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {PORTAL_DOC_TYPES.map((dt) => {
                    const rows = d?.documents.filter((x) => x.docType === dt.code) ?? []
                    const inProg = rows
                      .filter((x) => ['DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'RETURNED'].includes(x.status))
                      .reduce((a, b) => a + Number(b.n), 0)
                    const active = rows
                      .filter((x) => ['APPROVED', 'ISSUED', 'ACKNOWLEDGED', 'POSTED', 'PAID'].includes(x.status))
                      .reduce((a, b) => a + Number(b.n), 0)
                    const total = rows.reduce((a, b) => a + Number(b.n), 0)
                    return (
                      <tr key={dt.code} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center rounded border border-gray-200 bg-gray-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-gray-800">
                            {dt.code}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          <Link href={dt.href} className="hover:text-brand-600 hover:underline">
                            {dt.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-medium tabular-nums text-gray-600">{inProg}</td>
                        <td className="px-4 py-3 text-center text-xs font-medium tabular-nums text-gray-600">{active}</td>
                        <td className="px-5 py-3 text-right font-semibold tabular-nums text-gray-900">{total}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="col-span-12 space-y-6 xl:col-span-4">
          <Card title="Quick Access" desc="Navigasi cepat portal rekanan.">
            <div className="divide-y divide-gray-100 -my-2">
              {PORTAL_ACTIONS.map((s) => {
                const Icon = s.icon
                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="group flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600 group-hover:border-brand-200 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                          {s.title}
                        </p>
                        <p className="truncate text-[11px] text-gray-500">{s.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-brand-600 transition-colors" />
                  </Link>
                )
              })}
            </div>
          </Card>

          <Card
            title="Recent Notifications"
            desc="Pembaruan PO, undangan RFQ & pembayaran."
            actions={
              <Link href="/portal/notifications" className="text-xs font-semibold text-brand-600 hover:underline">
                All →
              </Link>
            }
          >
            {!d?.recentNotifications.length ? (
              <p className="py-6 text-center text-xs text-gray-400">Belum ada notifikasi terbaru.</p>
            ) : (
              <ul className="divide-y divide-gray-100 -my-2">
                {d.recentNotifications.map((n) => (
                  <li key={n.id} className="flex items-start gap-2.5 py-2.5">
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
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
