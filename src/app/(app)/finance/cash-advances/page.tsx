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

type CaRow = {
  id: string
  docNo: string | null
  docDate: string
  requiredDate: string | null
  status: string
  title: string
  departmentName: string | null
  employeeNo: string | null
  employeeName: string | null
  transactionTypeName: string | null
  purpose: string
  currencyCode: string
  totalAmount: string
  appliedAmount: string
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

export default function CashAdvancesPage() {
  const [status, setStatus] = useState('')
  const list = useList<CaRow>('/cash-advances', 'createdAt:desc', { status: status || undefined })
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    departmentId: null as number | null,
    transactionTypeId: null as number | null,
    purpose: '',
    requiredDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    currencyCode: 'IDR',
    remarks: '',
  })
  const [lines, setLines] = useState<ExpLine[]>([emptyLine()])

  const totalAmt = lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0)

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.transactionTypeId) {
      setError('Please select a Cash Advance Transaction Type.')
      return
    }
    if (lines.some((l) => !l.description.trim() || !l.coaId || Number(l.amount) <= 0)) {
      setError('Each expense line requires Expense Account (COA), Description, and Amount > 0.')
      return
    }
    setBusy(true)
    try {
      await post('/cash-advances', {
        ...form,
        lines: lines.map((l) => ({
          coaId: Number(l.coaId),
          costCenterId: l.costCenterId,
          description: l.description,
          expenseDate: l.expenseDate || null,
          amount: Number(l.amount),
        })),
      })
      setOpen(false)
      setForm({ ...form, title: '', purpose: '', remarks: '' })
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
      await post(`/cash-advances/${id}/submit`)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Cash Advances (CA)"
        subtitle="Request operational cash advances or business trip allowances prior to disbursement (OPCA) and settlement (STL)."
        actions={
          <Link href="/finance/cash-advances/new"><Button>
            <Plus className="h-4 w-4" />
            <span>New Cash Advance</span>
          </Button></Link>
        }
      />

      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          {
            key: 'docNo',
            header: 'CA Number',
            sortable: true,
            render: (r) => (
              <Link className="font-semibold text-brand-600 hover:underline" href={`/finance/cash-advances/${r.id}`}>
                {r.docNo ?? '(Draft)'}
              </Link>
            ),
          },
          { key: 'title', header: 'Title' },
          { key: 'employeeName', header: 'Employee' },
          { key: 'departmentName', header: 'Department' },
          { key: 'transactionTypeName', header: 'Transaction Type' },
          { key: 'requiredDate', header: 'Required Date', sortable: true, render: (r) => fmtDate(r.requiredDate) },
          {
            key: 'totalAmountBase',
            header: 'Advance Amount',
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
                  href={`/finance/cash-advances/${r.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Detail / Edit</span>
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
            {['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAYMENT_PROCESSING', 'DISBURSED', 'SETTLED', 'CLOSED', 'RETURNED', 'REJECTED'].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
          </Select>
        }
      />

      <Modal open={open} title="Create Cash Advance (CA)" onClose={() => setOpen(false)} wide>
        <form onSubmit={create} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Cash Advance Title" required>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Kasbon Perjalanan Dinas & Audit Supplier Surabaya"
                />
              </Field>
            </div>

            <Field label="Transaction Type" required>
              <LookupSelect
                path="/transaction-types"
                params={{ module: 'CA' }}
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

            <Field label="Required Disbursement Date" required>
              <Input
                type="date"
                required
                value={form.requiredDate}
                onChange={(e) => setForm({ ...form, requiredDate: e.target.value })}
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

            <div className="sm:col-span-2">
              <Field label="Business Purpose / Activity Details" required>
                <Textarea
                  rows={2}
                  required
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  placeholder="Detailed purpose of the cash advance..."
                />
              </Field>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700">
              Estimated Expense Breakdown <span className="text-error-500">*</span>
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
                  header: 'Expense Description *',
                  width: '32%',
                  render: (row, set) => (
                    <Input
                      required
                      value={row.description}
                      onChange={(e) => set({ description: e.target.value })}
                      placeholder="e.g. Tiket pesawat, akomodasi hotel 3 malam"
                    />
                  ),
                },
                {
                  key: 'cc',
                  header: 'Cost Center',
                  width: '20%',
                  render: (row, set) => (
                    <LookupSelect
                      path="/cost-centers"
                      value={row.costCenterId}
                      initialLabel={row.costCenterLabel}
                      label={(r) => `${r.code} — ${r.name}`}
                      onChange={(v, r) => set({ costCenterId: v, costCenterLabel: r?.code })}
                    />
                  ),
                },
                {
                  key: 'amount',
                  header: 'Amount *',
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
                    Total Cash Advance:
                  </td>
                  <td colSpan={2} className="px-3 py-2.5 text-sm font-bold text-gray-900">
                    {fmtMoney(totalAmt, form.currencyCode)}
                  </td>
                </tr>
              }
            />
          </div>

          <ErrorText error={error} />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create Cash Advance'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
