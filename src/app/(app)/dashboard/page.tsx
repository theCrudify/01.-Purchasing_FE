'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  Database,
  FileCheck2,
  FileText,
  ShieldCheck,
  Sliders,
  UserCheck,
} from 'lucide-react'
import { Badge, Button, Card, ErrorText, PageHeader, fmtDate, fmtDateTime, fmtMoney } from '@/components/ui'
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

const DOC_TYPES: { code: string; name: string; href: string }[] = [
  { code: 'PR', name: 'Purchase Request & PR Raw Material', href: '/purchasing/pr' },
  { code: 'RFQ', name: 'Request for Quotation', href: '/purchasing/rfq' },
  { code: 'QUO', name: 'Vendor Quotation', href: '/purchasing/quotations' },
  { code: 'CTR', name: 'Purchase Contract', href: '/purchasing/contracts' },
  { code: 'PO', name: 'Purchase Order', href: '/purchasing/po' },
  { code: 'GR', name: 'Goods Receipt', href: '/purchasing/gr' },
  { code: 'CA', name: 'Cash Advance (Kasbon)', href: '/finance/cash-advances' },
  { code: 'STL', name: 'Cash Advance Settlement', href: '/finance/settlements' },
  { code: 'RMB', name: 'Reimbursement Claim', href: '/finance/reimbursements' },
  { code: 'INV', name: 'AP Invoice (Tagihan Vendor)', href: '/finance/ap-invoices' },
  { code: 'PAY', name: 'Outgoing Payment (OPAP / OPCA / Outgoing RMB)', href: '/finance/outgoing-ap' },
  { code: 'ARI', name: 'AR Invoice (Tagihan Customer)', href: '/finance/ar-invoices' },
  { code: 'SVR', name: 'Supplier Verification', href: '/vendors/verifications' },
]

const SHORTCUTS = [
  { href: '/purchasing/pr', title: 'Purchase Request (PR)', desc: 'Permintaan pembelian barang/jasa umum', icon: FileText },
  { href: '/purchasing/pr-raw-material', title: 'PR Raw Material', desc: 'Permintaan bahan baku produksi & resin', icon: Database },
  { href: '/finance/cash-advances', title: 'Cash Advance & Settlement', desc: 'Kasbon operasional & pertanggungjawaban (STL)', icon: CreditCard },
  { href: '/finance/reimbursements', title: 'Reimbursement (RMB)', desc: 'Klaim biaya karyawan & operasional', icon: FileCheck2 },
  { href: '/finance/ap-invoices', title: 'AP Invoice & OP AP Invoice', desc: 'Tagihan supplier & pembayaran OPAP', icon: ShieldCheck },
  { href: '/finance/ar-invoices', title: 'AR Invoice (ARI)', desc: 'Penagihan penjualan & piutang customer', icon: Sliders },
]

export default function Dashboard() {
  const me = useMe()
  const [d, setD] = useState<DashboardData | null>(null)
  const [tasks, setTasks] = useState<ApprovalTask[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api<{ data: DashboardData }>('/dashboard'),
      api<Paged<ApprovalTask>>('/approvals/tasks?pageSize=6&sort=startedAt:asc').catch(() => ({
        data: [],
        meta: { page: 1, pageSize: 6, total: 0, totalPages: 1 },
      })),
    ])
      .then(([dashRes, taskRes]) => {
        setD(dashRes.data)
        setTasks(taskRes.data ?? [])
      })
      .catch((e) => setError(e.message))
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dashboard${me ? ` — ${me.displayName}` : ''}`}
        subtitle="Overview of your pending approval tasks, procurement document pipeline, and system notifications."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/purchasing/pr">
              <Button>
                <FileText className="h-4 w-4" />
                <span>+ Buat Purchase Request</span>
              </Button>
            </Link>
            <Link href="/purchasing/po">
              <Button variant="secondary">
                <CreditCard className="h-4 w-4" />
                <span>Purchase Orders</span>
              </Button>
            </Link>
            <Link href="/approvals">
              <Button variant="secondary">
                <FileCheck2 className="h-4 w-4" />
                <span>Approvals ({d?.pendingApprovals ?? 0})</span>
              </Button>
            </Link>
          </div>
        }
      />

      <ErrorText error={error} />

      {/* 4 Uniform Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/approvals"
          className="group rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs hover:border-brand-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Pending My Approval
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 group-hover:border-brand-200 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{d?.pendingApprovals ?? 0}</p>
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-brand-600">
            <span>Review pending tasks</span>
            <ArrowRight className="h-3 w-3" />
          </p>
        </Link>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              My Total Documents
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{totalMyDocs}</p>
          <p className="mt-1 text-xs text-gray-500">
            {pendingMyDocs} in approval · {draftMyDocs} draft
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Approved Documents
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{approvedDocs}</p>
          <p className="mt-1 text-xs text-gray-500">
            {totalMyDocs > 0 ? `${Math.round((approvedDocs / totalMyDocs) * 100)}% completion rate` : 'No documents submitted yet'}
          </p>
        </div>

        <Link
          href="/notifications"
          className="group rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs hover:border-brand-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Unread Notifications
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 group-hover:border-brand-200 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
              <Bell className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{d?.unreadNotifications ?? 0}</p>
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-brand-600">
            <span>View notification feed</span>
            <ArrowRight className="h-3 w-3" />
          </p>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left 8 Columns: Pending Approvals Table & Document Pipeline Summary Table */}
        <div className="col-span-12 space-y-6 xl:col-span-8">
          <Card
            title="Waiting for My Approval"
            desc="Documents currently assigned to you or delegated to your inbox."
            actions={
              <Link href="/approvals" className="text-xs font-semibold text-brand-600 hover:underline">
                View all →
              </Link>
            }
          >
            <div className="overflow-x-auto -mx-5 -my-5">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Document</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Requester</th>
                    <th className="px-4 py-3">Step</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-xs text-gray-500">
                        No approval tasks currently waiting for your decision.
                      </td>
                    </tr>
                  ) : (
                    tasks.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-gray-700 mr-2">
                            {t.docType}
                          </span>
                          <span className="font-semibold text-gray-900">{t.docNo}</span>
                        </td>
                        <td className="px-4 py-3 max-w-[200px] truncate text-gray-700">{t.title}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{t.ownerName}</td>
                        <td className="px-4 py-3">
                          <Badge value="PENDING" />
                          <span className="ml-1.5 text-xs text-gray-600">{t.stepName}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-900 whitespace-nowrap">
                          {fmtMoney(t.totalAmount, t.currencyCode)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={docHref(t.docType, t.documentId)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <span>Open</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card
            title="Document Summary by Type & Status"
            desc="Distribution of your authored documents across procurement stages."
          >
            <div className="overflow-x-auto -mx-5 -my-5">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Code</th>
                    <th className="px-4 py-3">Document Type</th>
                    <th className="px-4 py-3 text-center">Draft / Returned</th>
                    <th className="px-4 py-3 text-center">Pending Approval</th>
                    <th className="px-4 py-3 text-center">Approved / Issued</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {DOC_TYPES.map((dt) => {
                    const rows = d?.myDocuments.filter((x) => x.docType === dt.code) ?? []
                    const draft = rows
                      .filter((x) => ['DRAFT', 'RETURNED', 'REVISION_REQUIRED'].includes(x.status))
                      .reduce((a, b) => a + Number(b.n), 0)
                    const pending = rows
                      .filter((x) => ['PENDING_APPROVAL', 'SUBMITTED'].includes(x.status))
                      .reduce((a, b) => a + Number(b.n), 0)
                    const approved = rows
                      .filter((x) => ['APPROVED', 'ISSUED', 'POSTED', 'PAID'].includes(x.status))
                      .reduce((a, b) => a + Number(b.n), 0)
                    const total = rows.reduce((a, b) => a + Number(b.n), 0)
                    return (
                      <tr key={dt.code} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center rounded border border-gray-200 bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-800">
                            {dt.code}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          <Link href={dt.href} className="hover:text-brand-600 hover:underline">
                            {dt.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-medium text-gray-600">{draft}</td>
                        <td className="px-4 py-3 text-center text-xs font-medium text-gray-600">{pending}</td>
                        <td className="px-4 py-3 text-center text-xs font-medium text-gray-600">{approved}</td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-900">{total}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right 4 Columns: Quick Shortcuts & Recent Notifications */}
        <div className="col-span-12 space-y-6 xl:col-span-4">
          <Card title="Quick Access" desc="Frequently used modules and settings.">
            <div className="divide-y divide-gray-100 -my-2">
              {SHORTCUTS.map((s) => {
                const Icon = s.icon
                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="group flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
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
            desc="Latest system and approval updates."
            actions={
              <Link href="/notifications" className="text-xs font-semibold text-brand-600 hover:underline">
                All →
              </Link>
            }
          >
            {!d?.recentNotifications.length ? (
              <p className="py-6 text-center text-xs text-gray-400">No recent notifications.</p>
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
