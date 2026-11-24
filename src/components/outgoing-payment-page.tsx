'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Edit3, Eye, Landmark, Plus, Send, Zap } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { LookupSelect } from '@/components/form'
import { Badge, Button, ErrorText, Field, Modal, PageHeader, Select, fmtDate, fmtMoney } from '@/components/ui'
import { post } from '@/lib/api'
import { useList } from '@/lib/use-list'

type PayRow = {
  id: string
  docNo: string | null
  docDate: string
  plannedDate: string | null
  paidDate: string | null
  status: string
  title: string
  bpCode: string | null
  bpName: string | null
  purpose: string
  payeeType: string
  paymentMethod: string
  companyBankCode: string | null
  companyBankName: string | null
  bankReference: string | null
  targetDocNo: string | null
  targetDocPublicId: string | null
  currencyCode: string
  totalAmount: string
  ownerName: string
}

const BASE_HREF_BY_PURPOSE: Record<'AP_INVOICE' | 'CASH_ADVANCE' | 'REIMBURSEMENT', string> = {
  AP_INVOICE: '/finance/outgoing-ap',
  CASH_ADVANCE: '/finance/outgoing-ca',
  REIMBURSEMENT: '/finance/outgoing-reimbursement',
}

const DEFAULT_LOOKUP_BY_PURPOSE: Record<'AP_INVOICE' | 'CASH_ADVANCE' | 'REIMBURSEMENT', string> = {
  AP_INVOICE: '/ap-invoices',
  CASH_ADVANCE: '/cash-advances',
  REIMBURSEMENT: '/reimbursements',
}

const PRESET_SCHEDULES: {
  key: string
  label: string
  stages: { label: string; percent: number; offsetDays: number }[]
}[] = [
  {
    key: 'FULL',
    label: '100% Pelunasan Sekaligus (Full Auto-Pay)',
    stages: [{ label: 'Pelunasan 100%', percent: 100, offsetDays: 0 }],
  },
  {
    key: 'DP_30_70',
    label: '2 Tahap Perjanjian: DP 30% + Pelunasan 70%',
    stages: [
      { label: 'Termin 1 — Down Payment', percent: 30, offsetDays: 0 },
      { label: 'Termin 2 — Pelunasan Akhir', percent: 70, offsetDays: 30 },
    ],
  },
  {
    key: 'SPLIT_50_50',
    label: '2 Tahap Perjanjian: Termin 50% + 50%',
    stages: [
      { label: 'Termin 1 — Tahap Awal', percent: 50, offsetDays: 0 },
      { label: 'Termin 2 — Pelunasan', percent: 50, offsetDays: 14 },
    ],
  },
  {
    key: 'TERM_30_40_30',
    label: '3 Tahap Perjanjian: 30% + 40% + Retensi 30%',
    stages: [
      { label: 'Termin 1 — DP Kontrak', percent: 30, offsetDays: 0 },
      { label: 'Termin 2 — Progress Pengiriman', percent: 40, offsetDays: 14 },
      { label: 'Termin 3 — Retensi / Pelunasan', percent: 30, offsetDays: 30 },
    ],
  },
]

const addDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)

export function OutgoingPaymentPageView({
  purpose,
  title,
  subtitle,
  buttonLabel,
  targetLookupPath,
  targetFieldLabel,
}: {
  purpose: 'AP_INVOICE' | 'CASH_ADVANCE' | 'REIMBURSEMENT'
  title: string
  subtitle: string
  buttonLabel: string
  targetLookupPath?: string
  targetFieldLabel?: string
}) {
  const baseHref = BASE_HREF_BY_PURPOSE[purpose]
  const lookupPath = targetLookupPath ?? DEFAULT_LOOKUP_BY_PURPOSE[purpose]
  const [status, setStatus] = useState('')
  const list = useList<PayRow>('/payments', 'createdAt:desc', {
    status: status || undefined,
    purpose,
  })
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  // Staged / Auto-Pay Modal state
  const [termOpen, setTermOpen] = useState(false)
  const [targetDocId, setTargetDocId] = useState<string>('')
  const [targetRow, setTargetRow] = useState<any | null>(null)
  const [bankId, setBankId] = useState<number | null>(2) // BCA-IDR / MUFG-IDR
  const [presetKey, setPresetKey] = useState<string>('DP_30_70')
  const [termBusy, setTermBusy] = useState(false)
  const [termErr, setTermErr] = useState<string | null>(null)

  const submitDoc = async (id: string) => {
    setError(null)
    try {
      await post(`/payments/${id}/submit`)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const mufgAutoPay = async (id: string) => {
    setError(null)
    setBusyId(id)
    try {
      await post(`/payments/${id}/mufg`, { mode: 'AUTO' })
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const activePreset = PRESET_SCHEDULES.find((p) => p.key === presetKey) ?? PRESET_SCHEDULES[0]
  const targetTotal = Number(targetRow?.totalAmount ?? 0)
  const targetApplied = Number(targetRow?.appliedAmount ?? 0)
  const targetRemaining = Math.max(0, targetTotal - targetApplied)

  const submitInstallments = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetDocId || !bankId) {
      setTermErr('Pilih dokumen tagihan dan rekening bank perusahaan terlebih dahulu.')
      return
    }
    setTermBusy(true)
    setTermErr(null)
    try {
      await post('/payments/installments', {
        targetDocId,
        companyBankAccountId: bankId,
        paymentMethod: 'TRANSFER',
        schedule: activePreset.stages.map((s) => ({
          label: s.label,
          percent: s.percent,
          plannedDate: addDays(s.offsetDays),
        })),
      })
      setTermOpen(false)
      setTargetDocId('')
      setTargetRow(null)
      list.reload()
    } catch (err) {
      setTermErr((err as Error).message)
    } finally {
      setTermBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => { setTermErr(null); setTermOpen(true) }}>
              <Landmark className="h-4 w-4 text-brand-600" />
              <span>Auto-Pay / Bayar Bertahap (MUFG)</span>
            </Button>
            <Link href={`${baseHref}/new`}>
              <Button>
                <Plus className="h-4 w-4" />
                <span>{buttonLabel}</span>
              </Button>
            </Link>
          </div>
        }
      />

      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          {
            key: 'docNo',
            header: 'Payment No.',
            sortable: true,
            render: (r) => (
              <Link className="font-semibold text-brand-600 hover:underline" href={`${baseHref}/${r.id}`}>
                {r.docNo ?? '(Draft)'}
              </Link>
            ),
          },
          { key: 'title', header: 'Payment Title' },
          {
            key: 'targetDocNo',
            header: 'Target Doc Ref.',
            render: (r) =>
              r.targetDocPublicId ? (
                <Link
                  href={`/documents/${r.targetDocPublicId}`}
                  className="font-mono text-xs font-semibold text-brand-600 hover:underline"
                >
                  {r.targetDocNo ?? 'Open Doc'}
                </Link>
              ) : (
                '—'
              ),
          },
          {
            key: 'companyBankName',
            header: 'Source Bank / Cash',
            render: (r) => (
              <div>
                <div className="font-medium text-gray-900">{r.companyBankName}</div>
                <div className="font-mono text-xs text-gray-500">{r.companyBankCode}</div>
              </div>
            ),
          },
          { key: 'paymentMethod', header: 'Method', render: (r) => <Badge value={r.paymentMethod} /> },
          { key: 'plannedDate', header: 'Planned Date', sortable: true, render: (r) => fmtDate(r.plannedDate) },
          {
            key: 'totalAmountBase',
            header: 'Payment Amount',
            sortable: true,
            render: (r) => <span className="font-semibold tabular-nums text-gray-900">{fmtMoney(r.totalAmount, r.currencyCode)}</span>,
          },
          { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge value={r.status} /> },
          {
            key: '_a',
            header: 'Actions',
            render: (r) => (
              <div className="flex items-center gap-1.5">
                <Link
                  href={`${baseHref}/${r.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {['DRAFT', 'RETURNED'].includes(r.status) ? (
                    <>
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span>Detail</span>
                    </>
                  )}
                </Link>
                {['DRAFT', 'RETURNED'].includes(r.status) && (
                  <button
                    type="button"
                    onClick={() => submitDoc(r.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-100 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Submit</span>
                  </button>
                )}
                {['APPROVED', 'FAILED'].includes(r.status) && (
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => mufgAutoPay(r.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 cursor-pointer"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>{busyId === r.id ? 'Paying…' : 'MUFG Pay'}</span>
                  </button>
                )}
              </div>
            ),
          },
        ]}
        actions={
          <Select
            className="w-44"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              list.setPage(1)
            }}
          >
            <option value="">All Statuses</option>
            {['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT_TO_BANK', 'POSTED', 'COMPLETED', 'FAILED', 'RETURNED', 'REJECTED'].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
          </Select>
        }
      />

      {/* Mock MUFG Auto-Pay & Staged Payment Modal */}
      <Modal
        open={termOpen}
        wide
        title="Mock MUFG — Auto-Pay & Pembayaran Bertahap (Termin Perjanjian)"
        onClose={() => setTermOpen(false)}
      >
        <form onSubmit={submitInstallments} className="space-y-4">
          <ErrorText error={termErr} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={targetFieldLabel ?? 'Dokumen Tagihan / Target'} required>
              <LookupSelect
                path={lookupPath}
                value={targetDocId}
                label={(r) => `${r.docNo ?? '(Draft)'} — ${r.title} (${fmtMoney(r.totalAmount, r.currencyCode)})`}
                onChange={(v, r) => {
                  setTargetDocId(v ?? '')
                  setTargetRow(r ?? null)
                }}
              />
            </Field>

            <Field label="Rekening Bank Perusahaan (Sumber Dana)" required>
              <LookupSelect
                path="/company-banks"
                value={bankId}
                label={(r) => `${r.code} — ${r.name} (${r.accountNo})`}
                onChange={(v) => setBankId(v ? Number(v) : null)}
              />
            </Field>
          </div>

          <Field label="Skema Pembayaran Sesuai Ketentuan Perjanjian" required>
            <Select value={presetKey} onChange={(e) => setPresetKey(e.target.value)}>
              {PRESET_SCHEDULES.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>

          {targetRow && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200">
                <span className="font-semibold text-gray-800">
                  Target: {targetRow.docNo} — {targetRow.title}
                </span>
                <span className="font-mono font-bold text-brand-700">
                  Sisa Tagihan: {fmtMoney(targetRemaining, targetRow.currencyCode)}
                </span>
              </div>
              <table className="mt-2 w-full text-left text-xs">
                <thead>
                  <tr className="text-[11px] uppercase text-gray-500">
                    <th className="py-1">Tahap / Termin</th>
                    <th className="py-1">Rencana Bayar</th>
                    <th className="py-1 text-right">Porsi</th>
                    <th className="py-1 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activePreset.stages.map((s, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 font-medium text-gray-800">{s.label}</td>
                      <td className="py-1.5 text-gray-600">{fmtDate(addDays(s.offsetDays))}</td>
                      <td className="py-1.5 text-right tabular-nums text-gray-700">{s.percent}%</td>
                      <td className="py-1.5 text-right font-semibold tabular-nums text-gray-900">
                        {fmtMoney((targetRemaining * s.percent) / 100, targetRow.currencyCode)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="rounded-lg border border-brand-200 bg-brand-50/60 px-3.5 py-2.5 text-xs text-brand-900">
            Setiap termin dibuat sebagai dokumen pembayaran dan langsung diajukan ke approval (manager → direktur).
            Termin baru bisa dieksekusi lewat MUFG setelah disetujui.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setTermOpen(false)} disabled={termBusy}>
              Batal
            </Button>
            <Button type="submit" disabled={termBusy || !targetDocId || targetRemaining <= 0}>
              <Zap className="h-4 w-4" />
              <span>{termBusy ? 'Memproses…' : 'Buat Jadwal & Ajukan Approval'}</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
