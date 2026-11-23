'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Eye, Plus, Send } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { LinesEditor } from '@/components/document'
import { LookupSelect } from '@/components/form'
import { Badge, Button, ErrorText, Field, Input, Modal, PageHeader, Select, Textarea, fmtDate, fmtMoney } from '@/components/ui'
import { post } from '@/lib/api'
import { useList } from '@/lib/use-list'

type RmbRow = {
  id: string
  docNo: string | null
  docDate: string
  status: string
  title: string
  departmentName: string | null
  payeeType: string
  employeeName: string | null
  bpName: string | null
  transactionTypeName: string | null
  referenceNo: string | null
  currencyCode: string
  totalAmount: string
  ownerName: string
  lineCount: number
}

type ExpLine = {
  coaId: number | null
  coaLabel?: string
  costCenterId: number | null
  costCenterLabel?: string
  description: string
  expenseDate: string
  amount: string
}

const emptyLine = (): ExpLine => ({
  coaId: null,
  costCenterId: null,
  description: '',
  expenseDate: new Date().toISOString().slice(0, 10),
  amount: '0',
})

export default function ReimbursementsPage() {
  const [status, setStatus] = useState('')
  const list = useList<RmbRow>('/reimbursements', 'createdAt:desc', { status: status || undefined })
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    departmentId: null as number | null,
    payeeType: 'EMPLOYEE',
    bpId: '',
    transactionTypeId: null as number | null,
    referenceNo: '',
    currencyCode: 'IDR',
    remarks: '',
  })
  const [lines, setLines] = useState<ExpLine[]>([emptyLine()])

  const totalAmt = lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0)

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.transactionTypeId) {
      setError('Please select a Reimbursement Transaction Type.')
      return
    }
    if (lines.some((l) => !l.description.trim() || !l.coaId || Number(l.amount) <= 0)) {
      setError('Each reimbursement line requires Expense Account (COA), Description, and Amount > 0.')
      return
    }
    setBusy(true)
    try {
      await post('/reimbursements', {
        title: form.title,
        departmentId: form.departmentId,
        payeeType: form.payeeType,
        bpId: form.payeeType === 'BP' && form.bpId ? form.bpId : null,
        transactionTypeId: form.transactionTypeId,
        referenceNo: form.referenceNo || null,
        currencyCode: form.currencyCode,
        remarks: form.remarks || null,
        lines: lines.map((l) => ({
          coaId: Number(l.coaId),
          costCenterId: l.costCenterId,
          description: l.description,
          expenseDate: l.expenseDate || null,
          amount: Number(l.amount),
        })),
      })
      setOpen(false)
      setForm({ ...form, title: '', referenceNo: '', remarks: '' })
      setLines([emptyLine()])
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
      await post(`/reimbursements/${id}/submit`)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Reimbursements (RMB)"
        subtitle="Submit employee or operational expense reimbursement claims with receipt breakdown for approval and Outgoing Reimbursement payment."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>New Reimbursement</span>
          </Button>
        }
      />

      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          {
            key: 'docNo',
            header: 'RMB Number',
            sortable: true,
            render: (r) => (
              <Link className="font-semibold text-brand-600 hover:underline" href={`/documents/${r.id}`}>
                {r.docNo ?? '(Draft)'}
              </Link>
            ),
          },
          { key: 'title', header: 'Claim Title' },
          {
            key: 'employeeName',
            header: 'Claimant / Payee',
            render: (r) => <span>{r.payeeType === 'BP' ? r.bpName : r.employeeName}</span>,
          },
          { key: 'departmentName', header: 'Department' },
          { key: 'transactionTypeName', header: 'Transaction Type' },
          { key: 'docDate', header: 'Claim Date', sortable: true, render: (r) => fmtDate(r.docDate) },
          {
            key: 'totalAmountBase',
            header: 'Claim Total',
            sortable: true,
            render: (r) => <span className="font-semibold">{fmtMoney(r.totalAmount, r.currencyCode)}</span>,
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
            {['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAYMENT_PROCESSING', 'PAID', 'RETURNED', 'REJECTED'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        }
      />

      <Modal open={open} title="Create Reimbursement Claim (RMB)" onClose={() => setOpen(false)} wide>
        <form onSubmit={create} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Reimbursement Title" required>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Klaim Reimbursement Operasional & Transportasi Kunjungan Pabrik"
                />
              </Field>
            </div>

            <Field label="Transaction Type" required>
              <LookupSelect
                path="/transaction-types"
                params={{ module: 'RMB' }}
                value={form.transactionTypeId}
                label={(r) => `${r.code} — ${r.name}`}
                onChange={(v) => setForm({ ...form, transactionTypeId: v })}
              />
            </Field>

            <Field label="Department">
              <LookupSelect
                path="/departments"
                params={{ isActive: 'true' }}
                value={form.departmentId}
                label={(r) => `${r.code} — ${r.name}`}
                onChange={(v) => setForm({ ...form, departmentId: v })}
              />
            </Field>

            <Field label="Receipt / Claim Reference No.">
              <Input
                value={form.referenceNo}
                onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
                placeholder="e.g. CLM-2026-009"
              />
            </Field>

            <Field label="Currency">
              <Select value={form.currencyCode} onChange={(e) => setForm({ ...form, currencyCode: e.target.value })}>
                {['IDR', 'USD', 'JPY', 'EUR', 'SGD'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700">
              Reimbursement Expense Lines <span className="text-error-500">*</span>
            </label>
            <LinesEditor<ExpLine>
              lines={lines}
              onChange={setLines}
              newLine={emptyLine}
              columns={[
                {
                  key: 'coa',
                  header: 'Expense Account (COA) *',
                  width: '28%',
                  render: (row, set) => (
                    <LookupSelect
                      path="/coas"
                      value={row.coaId}
                      initialLabel={row.coaLabel}
                      label={(r) => `${r.code} — ${r.name}`}
                      onChange={(v, r) => set({ coaId: v, coaLabel: r ? `${r.code} — ${r.name}` : '' })}
                    />
                  ),
                },
                {
                  key: 'description',
                  header: 'Receipt / Expense Description *',
                  width: '34%',
                  render: (row, set) => (
                    <Input
                      required
                      value={row.description}
                      onChange={(e) => set({ description: e.target.value })}
                      placeholder="e.g. BBM, Tol, & Parkir Operasional"
                    />
                  ),
                },
                {
                  key: 'date',
                  header: 'Receipt Date',
                  width: '18%',
                  render: (row, set) => (
                    <Input
                      type="date"
                      value={row.expenseDate}
                      onChange={(e) => set({ expenseDate: e.target.value })}
                    />
                  ),
                },
                {
                  key: 'amount',
                  header: 'Claim Amount *',
                  width: '20%',
                  render: (row, set) => (
                    <Input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={row.amount}
                      onChange={(e) => set({ amount: e.target.value })}
                    />
                  ),
                },
              ]}
              footer={
                <tr>
                  <td colSpan={3} className="px-3 py-2.5 text-right text-xs font-semibold text-gray-600">
                    Total Reimbursement Claim:
                  </td>
                  <td colSpan={2} className="px-3 py-2.5 text-sm font-bold text-gray-900">
                    {fmtMoney(totalAmt, form.currencyCode)}
                  </td>
                </tr>
              }
            />
          </div>

          <Field label="Remarks / Notes">
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
              {busy ? 'Creating…' : 'Create Reimbursement'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
