'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Eye, Plus, Send } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { LookupSelect } from '@/components/form'
import { Badge, Button, ErrorText, Field, Input, Modal, PageHeader, Select, Textarea, fmtDate, fmtMoney } from '@/components/ui'
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
  targetLookupPath: string
  targetFieldLabel: string
}) {
  const [status, setStatus] = useState('')
  const list = useList<PayRow>('/payments', 'createdAt:desc', {
    status: status || undefined,
    purpose,
  })
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    targetDocId: '',
    companyBankAccountId: null as number | null,
    paymentMethod: 'TRANSFER',
    plannedDate: new Date().toISOString().slice(0, 10),
    amountApplied: '0',
    bankReference: '',
    remarks: '',
  })

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.targetDocId || !form.companyBankAccountId || Number(form.amountApplied) <= 0) {
      setError(`Please select ${targetFieldLabel}, Company Bank Account, and enter Payment Amount > 0.`)
      return
    }
    setBusy(true)
    try {
      await post('/payments', {
        title: form.title,
        purpose,
        targetDocId: form.targetDocId,
        companyBankAccountId: Number(form.companyBankAccountId),
        paymentMethod: form.paymentMethod,
        plannedDate: form.plannedDate,
        amountApplied: Number(form.amountApplied),
        bankReference: form.bankReference || null,
        remarks: form.remarks || null,
      })
      setOpen(false)
      setForm({
        title: '',
        targetDocId: '',
        companyBankAccountId: null,
        paymentMethod: 'TRANSFER',
        plannedDate: new Date().toISOString().slice(0, 10),
        amountApplied: '0',
        bankReference: '',
        remarks: '',
      })
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const submitDoc = async (id: string) => {
    setError(null)
    try {
      await post(`/payments/${id}/submit`)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>{buttonLabel}</span>
          </Button>
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
              <Link className="font-semibold text-brand-600 hover:underline" href={`/documents/${r.id}`}>
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
            render: (r) => <span className="font-semibold text-gray-900">{fmtMoney(r.totalAmount, r.currencyCode)}</span>,
          },
          { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge value={r.status} /> },
          {
            key: '_a',
            header: 'Actions',
            render: (r) => (
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/documents/${r.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Open</span>
                </Link>
                {['DRAFT', 'RETURNED'].includes(r.status) && (
                  <button
                    type="button"
                    onClick={() => submitDoc(r.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-100"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Submit</span>
                  </button>
                )}
              </div>
            ),
          },
        ]}
        actions={
          <Select
            className="h-[40px] w-44"
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

      <Modal open={open} title={buttonLabel} onClose={() => setOpen(false)}>
        <form onSubmit={create} className="space-y-4">
          <Field label={targetFieldLabel} required>
            <LookupSelect
              path={targetLookupPath}
              value={form.targetDocId}
              label={(r) => `${r.docNo ?? '(Draft)'} — ${r.title} (${fmtMoney(r.totalAmount, r.currencyCode)})`}
              onChange={(v, r) =>
                setForm({
                  ...form,
                  targetDocId: v ?? '',
                  amountApplied: r?.totalAmount ? String(r.totalAmount) : form.amountApplied,
                  title: form.title || (r ? `Outgoing Payment — ${r.docNo ?? ''} ${r.title}` : ''),
                })
              }
            />
          </Field>

          <Field label="Outgoing Payment Title" required>
            <Input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Payment description"
            />
          </Field>

          <Field label="Company Bank / Cash Account" required>
            <LookupSelect
              path="/company-banks"
              value={form.companyBankAccountId}
              label={(r) => `${r.code} — ${r.name} (${r.accountNo})`}
              onChange={(v) => setForm({ ...form, companyBankAccountId: v })}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Payment Method">
              <Select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="TRANSFER">TRANSFER (Bank Transfer / MUFG)</option>
                <option value="CASH">CASH (Petty Cash Disbursement)</option>
                <option value="GIRO">GIRO / Cheque</option>
              </Select>
            </Field>

            <Field label="Planned Payment Date" required>
              <Input
                type="date"
                required
                value={form.plannedDate}
                onChange={(e) => setForm({ ...form, plannedDate: e.target.value })}
              />
            </Field>

            <Field label="Payment Amount (IDR)" required>
              <Input
                type="number"
                min="1"
                step="any"
                required
                value={form.amountApplied}
                onChange={(e) => setForm({ ...form, amountApplied: e.target.value })}
              />
            </Field>

            <Field label="Bank / Transfer Reference No.">
              <Input
                value={form.bankReference}
                onChange={(e) => setForm({ ...form, bankReference: e.target.value })}
                placeholder="e.g. MUFG-BATCH-001"
              />
            </Field>
          </div>

          <Field label="Remarks">
            <Textarea
              rows={2}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            />
          </Field>

          <ErrorText error={error} />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating…' : buttonLabel}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
