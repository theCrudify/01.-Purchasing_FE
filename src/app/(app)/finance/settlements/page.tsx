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

type StlRow = {
  id: string
  docNo: string | null
  docDate: string
  status: string
  title: string
  caId: string
  caDocNo: string | null
  caTitle: string | null
  advanceAmount: string
  spentAmount: string
  differenceAmount: string
  currencyCode: string
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

export default function SettlementsPage() {
  const [status, setStatus] = useState('')
  const list = useList<StlRow>('/settlements', 'createdAt:desc', { status: status || undefined })
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    caId: '',
    caAmount: 0,
    referenceNo: '',
    purpose: '',
    remarks: '',
  })
  const [lines, setLines] = useState<ExpLine[]>([emptyLine()])

  const totalSpent = lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0)
  const diff = form.caAmount - totalSpent

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.caId) {
      setError('Please select the Cash Advance (CA) document to settle.')
      return
    }
    if (lines.some((l) => !l.description.trim() || !l.coaId || Number(l.amount) <= 0)) {
      setError('Each actual expense line requires Expense Account (COA), Description, and Amount > 0.')
      return
    }
    setBusy(true)
    try {
      await post('/settlements', {
        title: form.title,
        caId: form.caId,
        referenceNo: form.referenceNo || null,
        purpose: form.purpose || null,
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
      setForm({ title: '', caId: '', caAmount: 0, referenceNo: '', purpose: '', remarks: '' })
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
      await post(`/settlements/${id}/submit`)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Cash Advance Settlements (STL)"
        subtitle="Account for actual realizations against disbursed Cash Advances, calculate refund or top-up differences, and route for approval."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>New Settlement</span>
          </Button>
        }
      />

      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          {
            key: 'docNo',
            header: 'STL Number',
            sortable: true,
            render: (r) => (
              <Link className="font-semibold text-brand-600 hover:underline" href={`/documents/${r.id}`}>
                {r.docNo ?? '(Draft)'}
              </Link>
            ),
          },
          { key: 'title', header: 'Title' },
          {
            key: 'caDocNo',
            header: 'Cash Advance Ref.',
            render: (r) => (
              <Link href={`/documents/${r.caId}`} className="font-mono text-xs font-semibold text-brand-600 hover:underline">
                {r.caDocNo ?? r.caTitle}
              </Link>
            ),
          },
          { key: 'docDate', header: 'Date', sortable: true, render: (r) => fmtDate(r.docDate) },
          {
            key: 'advanceAmount',
            header: 'Advance Amount',
            render: (r) => fmtMoney(r.advanceAmount, r.currencyCode),
          },
          {
            key: 'spentAmount',
            header: 'Actual Spent',
            sortable: true,
            render: (r) => <span className="font-semibold text-gray-900">{fmtMoney(r.spentAmount, r.currencyCode)}</span>,
          },
          {
            key: 'differenceAmount',
            header: 'Difference (Refund / Top-up)',
            render: (r) => {
              const d = Number(r.differenceAmount)
              return (
                <span className={`font-semibold ${d < 0 ? 'text-error-600' : 'text-emerald-700'}`}>
                  {fmtMoney(r.differenceAmount, r.currencyCode)}
                </span>
              )
            },
          },
          { key: 'ownerName', header: 'Submitted By' },
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
            {['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'CLOSED', 'RETURNED', 'REJECTED'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        }
      />

      <Modal open={open} title="Create Cash Advance Settlement (STL)" onClose={() => setOpen(false)} wide>
        <form onSubmit={create} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Settlement Title" required>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Pertanggungjawaban Kasbon Perjalanan Dinas Surabaya"
                />
              </Field>
            </div>

            <Field label="Cash Advance Document (CA)" required>
              <LookupSelect
                path="/cash-advances"
                value={form.caId}
                label={(r) => `${r.docNo ?? '(Draft)'} — ${r.title} (${fmtMoney(r.totalAmount, r.currencyCode)})`}
                onChange={(v, r) =>
                  setForm({
                    ...form,
                    caId: v ?? '',
                    caAmount: Number(r?.totalAmount ?? 0),
                    title: form.title || (r ? `Settlement — ${r.title}` : ''),
                  })
                }
              />
            </Field>

            <Field label="Receipt / Voucher Reference No.">
              <Input
                value={form.referenceNo}
                onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
                placeholder="e.g. BKK-2026-041"
              />
            </Field>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700">
              Actual Realized Expenses <span className="text-error-500">*</span>
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
                      placeholder="Actual receipt item"
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
                  header: 'Actual Amount *',
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
                <>
                  <tr>
                    <td colSpan={3} className="px-3 py-1.5 text-right text-xs text-gray-500">
                      Original Cash Advance:
                    </td>
                    <td colSpan={2} className="px-3 py-1.5 text-xs font-semibold text-gray-800">
                      {fmtMoney(form.caAmount, 'IDR')}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-3 py-1.5 text-right text-xs text-gray-500">
                      Actual Spent Total:
                    </td>
                    <td colSpan={2} className="px-3 py-1.5 text-xs font-semibold text-gray-900">
                      {fmtMoney(totalSpent, 'IDR')}
                    </td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td colSpan={3} className="px-3 py-2 text-right text-xs font-bold text-gray-700">
                      Difference ({diff >= 0 ? 'Employee Refund to Company' : 'Company Top-up to Employee'}):
                    </td>
                    <td colSpan={2} className="px-3 py-2 text-sm font-bold text-gray-900">
                      {fmtMoney(diff, 'IDR')}
                    </td>
                  </tr>
                </>
              }
            />
          </div>

          <Field label="Settlement Remarks">
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
              {busy ? 'Creating…' : 'Create Settlement'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
