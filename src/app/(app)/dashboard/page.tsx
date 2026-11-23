'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  CreditCard,
  Database,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Layers,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Sliders,
  UserCheck,
  Users,
} from 'lucide-react'
import { Badge, Button, Card, ErrorText, fmtDate, fmtDateTime, fmtMoney } from '@/components/ui'
import { api, type Paged } from '@/lib/api'
import { docHref } from '@/lib/doc-links'
import { useMe } from '@/lib/me'

type DashboardData = {
  pendingApprovals: number
  unreadNotifications: number
  myDocuments: { docType: string; status: string; n: number }[]
  recentNotifications: { id: string; title: string; readAt: string | null; createdAt: string }[]
}

type ApprovalTask = {
  id: string
  documentId: string
  docType: string
  docNo: string
  title: string
  ownerName: string
  stepName: string
  startedAt: string
  currencyCode: string
  totalAmount: string
  docStatus: string
}

const DOC_PIPELINE_META: {
  code: string
  name: string
  desc: string
  color: string
  bg: string
  icon: typeof FileText
}[] = [
  {
    code: 'PR',
    name: 'Purchase Request',
    desc: 'Permintaan pembelian internal departemen',
    color: 'text-brand-600',
    bg: 'bg-brand-50 border-brand-200',
    icon: ShoppingCart,
  },
  {
    code: 'RFQ',
    name: 'Request for Quotation',
    desc: 'Permintaan penawaran harga ke vendor',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    icon: FileSpreadsheet,
  },
  {
    code: 'QUO',
    name: 'Vendor Quotation',
    desc: 'Evaluasi & perbandingan penawaran rekanan',
    color: 'text-sky-600',
    bg: 'bg-sky-50 border-sky-200',
    icon: ClipboardCheck,
  },
  {
    code: 'CTR',
    name: 'Purchase Contract',
    desc: 'Kontrak pengadaan & kesepakatan harga',
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
    icon: FolderKanban,
  },
  {
    code: 'PO',
    name: 'Purchase Order',
    desc: 'Pesanan pembelian resmi ke supplier',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
    icon: FileCheck2,
  },
  {
    code: 'GR',
    name: 'Goods Receipt',
    desc: 'Penerimaan barang & berita acara serah terima',
    color: 'text-teal-600',
    bg: 'bg-teal-50 border-teal-200',
    icon: PackageCheck,
  },
  {
    code: 'SVR',
    name: 'Supplier Verification',
    desc: 'Onboarding & verifikasi dokumen legalitas vendor',
    color: 'text-rose-600',
    bg: 'bg-rose-50 border-rose-200',
    icon: Building2,
  },
]

const QUICK_MODULES = [
  {
    href: '/approvals',
    title: 'Approval Inbox',
    desc: 'Periksa, setujui, atau kembalikan dokumen',
    icon: FileCheck2,
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  {
    href: '/settings/approval-templates',
    title: 'Approval Templates',
    desc: 'Konfigurasi alur & matriks persetujuan',
    icon: Sliders,
    iconBg: 'bg-brand-50 text-brand-600 border-brand-200',
  },
  {
    href: '/settings/delegations',
    title: 'Delegasi & Backup',
    desc: 'Atur pelimpahan wewenang sementara',
    icon: UserCheck,
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
  {
    href: '/master/items',
    title: 'Master Items & UoM',
    desc: 'Katalog barang, jasa, dan kategori',
    icon: Database,
    iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
  },
  {
    href: '/master/budgets',
    title: 'Budget & Kurs',
    desc: 'Pagu anggaran departemen & nilai tukar',
    icon: CreditCard,
    iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
  },
  {
    href: '/admin/users',
    title: 'Users & Security',
    desc: 'Kelola akun, karyawan, role, dan audit',
    icon: ShieldCheck,
    iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
  },
]

export default function Dashboard() {
  const me = useMe()
  const [d, setD] = useState<DashboardData | null>(null)
  const [tasks, setTasks] = useState<ApprovalTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = () => {
    setLoading(true)
    Promise.all([
      api<{ data: DashboardData }>('/dashboard'),
      api<Paged<ApprovalTask>>('/approvals/tasks?pageSize=5&sort=startedAt:asc').catch(() => ({
        data: [],
        meta: { page: 1, pageSize: 5, total: 0, totalPages: 1 },
      })),
    ])
      .then(([dashRes, taskRes]) => {
        setD(dashRes.data)
        setTasks(taskRes.data ?? [])
        setError(null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const totalMyDocs = d ? d.myDocuments.reduce((acc, curr) => acc + Number(curr.n), 0) : 0
  const approvedDocs = d
    ? d.myDocuments
        .filter((x) => ['APPROVED', 'ISSUED', 'POSTED', 'PAID'].includes(x.status))
        .reduce((acc, curr) => acc + Number(curr.n), 0)
    : 0
  const pendingMyDocs = d
    ? d.myDocuments
        .filter((x) => ['PENDING_APPROVAL', 'SUBMITTED'].includes(x.status))
        .reduce((acc, curr) => acc + Number(curr.n), 0)
    : 0
  const draftMyDocs = d
    ? d.myDocuments
        .filter((x) => ['DRAFT', 'RETURNED', 'REVISION_REQUIRED'].includes(x.status))
        .reduce((acc, curr) => acc + Number(curr.n), 0)
    : 0

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-6">
      {/* Executive Welcome Hero Card */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-linear-to-r from-gray-900 via-[#1a2231] to-[#262e89] p-6 text-white shadow-theme-md sm:p-8">
        {/* Decorative Grid Shape */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/shape/grid-01.svg"
          alt=""
          className="pointer-events-none absolute right-0 top-0 h-full w-auto max-w-xs opacity-25 select-none"
        />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>PT Kansai Paint Indonesia • {todayStr}</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Selamat Datang, {me?.displayName ?? 'Administrator'}
            </h1>
            <p className="max-w-2xl text-sm text-gray-300">
              Pusat kendali Purchasing, Approval Workflow, dan Manajemen Rekanan KPIN. Pantau tugas persetujuan,
              dokumen pengadaan, dan aktivitas sistem secara real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/approvals"
              className="inline-flex items-center gap-2 rounded-xl bg-[#c3002f] px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm hover:bg-[#a50027] transition-all"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Kotak Masuk Approval ({d?.pendingApprovals ?? 0})</span>
            </Link>
            <Link
              href="/settings/approval-templates"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-xs hover:bg-white/20 transition-all"
            >
              <Sliders className="h-4 w-4" />
              <span>Atur Workflow</span>
            </Link>
          </div>
        </div>
      </div>

      <ErrorText error={error} />

      {/* 4 TailAdmin KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-5">
        {/* Card 1: Pending Approvals */}
        <Link
          href="/approvals"
          className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs hover:border-brand-300 hover:shadow-theme-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-warning-200 bg-warning-50 text-warning-600">
              <Clock className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2.5 py-0.5 text-xs font-semibold text-warning-700 border border-warning-200">
              Perlu Tindakan
            </span>
          </div>
          <div className="mt-4">
            <span className="text-sm font-medium text-gray-500">Menunggu Approval Saya</span>
            <div className="mt-1 flex items-baseline justify-between">
              <h4 className="text-3xl font-extrabold text-gray-900">{d?.pendingApprovals ?? 0}</h4>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:translate-x-0.5 transition-transform">
                Buka Inbox <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </Link>

        {/* Card 2: Total My Documents */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-600">
              <FileText className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 border border-brand-200">
              {pendingMyDocs} In-Progress
            </span>
          </div>
          <div className="mt-4">
            <span className="text-sm font-medium text-gray-500">Total Dokumen Saya</span>
            <div className="mt-1 flex items-baseline justify-between">
              <h4 className="text-3xl font-extrabold text-gray-900">{totalMyDocs}</h4>
              <span className="text-xs font-medium text-gray-400">{draftMyDocs} Draft / Revisi</span>
            </div>
          </div>
        </div>

        {/* Card 3: Approved / Completed Documents */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-success-200 bg-success-50 text-success-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-semibold text-success-700 border border-success-200">
              Disetujui
            </span>
          </div>
          <div className="mt-4">
            <span className="text-sm font-medium text-gray-500">Dokumen Approved & Issued</span>
            <div className="mt-1 flex items-baseline justify-between">
              <h4 className="text-3xl font-extrabold text-gray-900">{approvedDocs}</h4>
              <span className="text-xs font-medium text-success-600">
                {totalMyDocs > 0 ? `${Math.round((approvedDocs / totalMyDocs) * 100)}% selesai` : 'Siap proses'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Unread Notifications */}
        <Link
          href="/notifications"
          className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs hover:border-brand-300 hover:shadow-theme-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-[#c3002f]">
              <Bell className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-[#c3002f] border border-rose-200">
              Notifikasi
            </span>
          </div>
          <div className="mt-4">
            <span className="text-sm font-medium text-gray-500">Pesan Belum Dibaca</span>
            <div className="mt-1 flex items-baseline justify-between">
              <h4 className="text-3xl font-extrabold text-gray-900">{d?.unreadNotifications ?? 0}</h4>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:translate-x-0.5 transition-transform">
                Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Main 12-Col Grid: Left 7 Cols (Pipeline & Approval Inbox Preview), Right 5 Cols (Quick Launch & Activity) */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column (7/12) */}
        <div className="col-span-12 space-y-6 xl:col-span-7">
          {/* Pending Approval Tasks Table Preview */}
          <Card
            title="Daftar Dokumen Menunggu Persetujuan Saya"
            desc="Dokumen pengadaan dan verifikasi vendor yang membutuhkan keputusan Anda."
            actions={
              <Link
                href="/approvals"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>Lihat Semua</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          >
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-10 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success-50 text-success-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="mt-2.5 text-sm font-semibold text-gray-800">Tidak ada antrean persetujuan tertunda</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Seluruh tugas approval Anda telah selesai diproses.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 -my-2">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50/80 text-xs font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="px-6 py-3">Dokumen</th>
                      <th className="px-4 py-3">Pemohon</th>
                      <th className="px-4 py-3">Step</th>
                      <th className="px-4 py-3">Nilai</th>
                      <th className="px-6 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tasks.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <Badge value={t.docType} />
                            <div>
                              <div className="font-semibold text-gray-900">{t.docNo}</div>
                              <div className="max-w-[180px] truncate text-xs text-gray-500">{t.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-medium text-gray-700">{t.ownerName}</td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                            {t.stepName}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-semibold text-gray-900">
                          {fmtMoney(t.totalAmount, t.currencyCode)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <Link
                            href={docHref(t.docType, t.documentId)}
                            className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-100 transition-colors"
                          >
                            <span>Periksa</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* 7-Type Procurement Document Pipeline Breakdown */}
          <Card
            title="Matriks Pipeline Dokumen Pengadaan (KPIN Workflow)"
            desc="Status dokumen berdasarkan kategori transaksi dari PR hingga Goods Receipt & Supplier Verification."
          >
            <div className="space-y-3">
              {DOC_PIPELINE_META.map((m) => {
                const rows = d?.myDocuments.filter((x) => x.docType === m.code) ?? []
                const count = rows.reduce((a, b) => a + Number(b.n), 0)
                const Icon = m.icon
                return (
                  <div
                    key={m.code}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-gray-200/80 bg-gray-50/40 p-3.5 hover:bg-white hover:shadow-theme-xs transition-all sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${m.bg} ${m.color}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-gray-500">{m.code}</span>
                          <h3 className="text-sm font-semibold text-gray-900">{m.name}</h3>
                        </div>
                        <p className="text-xs text-gray-500">{m.desc}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {rows.length > 0 ? (
                        rows.map((r) => (
                          <span
                            key={r.status}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold shadow-2xs"
                          >
                            <Badge value={r.status} />
                            <span className="text-gray-900">{r.n}</span>
                          </span>
                        ))
                      ) : (
                        <span className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-400">
                          0 dokumen
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Right Column (5/12) */}
        <div className="col-span-12 space-y-6 xl:col-span-5">
          {/* Quick Modules Directory */}
          <Card
            title="Direktori Modul Cepat"
            desc="Akses langsung ke pengaturan workflow, master data, dan administrasi."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {QUICK_MODULES.map((qm) => {
                const Icon = qm.icon
                return (
                  <Link
                    key={qm.href}
                    href={qm.href}
                    className="group flex flex-col justify-between rounded-xl border border-gray-200 bg-gray-50/40 p-3.5 hover:border-brand-300 hover:bg-white hover:shadow-theme-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${qm.iconBg}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-brand-500 transition-colors" />
                    </div>
                    <div className="mt-3">
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                        {qm.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{qm.desc}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </Card>

          {/* Recent Notifications & Activity Feed */}
          <Card
            title="Notifikasi & Aktivitas Terbaru"
            desc="Riwayat pemberitahuan workflow dan keputusan approval."
            actions={
              <Link href="/notifications" className="text-xs font-semibold text-brand-600 hover:underline">
                Semua →
              </Link>
            }
          >
            {!d?.recentNotifications.length ? (
              <div className="py-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm font-medium text-gray-500">Belum ada notifikasi terbaru</p>
                <p className="text-xs text-gray-400">
                  Pemberitahuan persetujuan dokumen akan muncul secara otomatis di sini.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {d.recentNotifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                        n.readAt ? 'bg-gray-300' : 'bg-brand-500 ring-4 ring-brand-100'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${n.readAt ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
                        {n.title}
                      </p>
                      <span className="mt-0.5 block text-xs text-gray-400">{fmtDateTime(n.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
