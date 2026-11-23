'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Eye, Plus, Send } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { LinesEditor } from '@/components/document'
import { LookupSelect } from '@/components/form'
import { Badge, Button, ErrorText, Field, Input, Modal, PageHeader, Select, Textarea, fmtDate, fmtDateTime } from '@/components/ui'
import { post } from '@/lib/api'
import { useList } from '@/lib/use-list'

type RfqRow = {
  id: string
  docNo: string | null
  docDate: string
  status: string
  title: string
  departmentName: string | null
  submissionDeadline: string
  quoteValidityDays: number
  evaluationMethod: string
  ownerName: string
  lineCount: number
  vendorCount: number
}

type RfqLine = {
  itemId: number | null
  itemLabel?: string
  description: string
  categoryId: number | null
  categoryLabel?: string
  uomId: number | null
  uomLabel?: string
  quantity: string
  specification: string
}

const emptyLine = (): RfqLine => ({
  itemId: null,
  description: '',
  categoryId: null,
  uomId: null,
  quantity: '1',
  specification: '',
})

export default function RfqPage() {
  const [status, setStatus] = useState('')
  const list = useList<RfqRow>('/rfq', 'createdAt:desc', { status: status || undefined })
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    departmentId: null as number | null,
    submissionDeadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    quoteValidityDays: 30,
    evaluationMethod: 'LOWEST_PRICE',
    currencyCode: 'IDR',
    vendorId: '' as string,
    terms: '',
    remarks: '',
  })
  const [lines, setLines] = useState<RfqLine[]>([emptyLine()])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (lines.some((l) => !l.description.trim() || !l.categoryId || !l.uomId)) {
      setError('Each line item requires Description, Category, and UoM.')
      return
    }
    setBusy(true)
    try {
      await post('/rfq', {
        title: form.title,
        departmentId: form.departmentId,
        submissionDeadline: new Date(form.submissionDeadline).toISOString(),
        quoteValidityDays: Number(form.quoteValidityDays),
        evaluationMethod: form.evaluationMethod,
        currencyCode: form.currencyCode,
        terms: form.terms || null,
        remarks: form.remarks || null,
        vendorIds: form.vendorId ? [form.vendorId] : [],
        lines: lines.map((l) => ({
          itemId: l.itemId,
          description: l.description,
          categoryId: Number(l.categoryId),
          uomId: Number(l.uomId),
          quantity: Number(l.quantity),
          specification: l.specification || null,
        })),
      })
      setOpen(false)
      setForm({ ...form, title: '', terms: '', remarks: '' })
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
      await post(`/rfq/${id}/submit`)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Requests for Quotation (RFQ)"
        subtitle="Manage competitive bidding invitations, item specifications, vendor participants, and quotation deadlines."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>New RFQ</span>
          </Button>
        }
      />

      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          {
            key: 'docNo',
            header: 'RFQ Number',
            sortable: true,
            render: (r) => (
              <Link className="font-semibold text-brand-600 hover:underline" href={`/documents/${r.id}`}>
                {r.docNo ?? '(Draft)'}
              </Link>
            ),
          },
          { key: 'title', header: 'Title' },
          { key: 'departmentName', header: 'Department' },
          {
            key: 'submissionDeadline',
            header: 'Submission Deadline',
            sortable: true,
            render: (r) => fmtDateTime(r.submissionDeadline),
          },
          { key: 'evaluationMethod', header: 'Evaluation', render: (r) => <Badge value={r.evaluationMethod} /> },
          { key: 'lineCount', header: 'Items', render: (r) => `${r.lineCount} item(s)` },
          { key: 'vendorCount', header: 'Invited Vendors', render: (r) => `${r.vendorCount} vendor(s)` },
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
                    <span>Publish / Submit</span>
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
            aria-label="Filter status"
          >
            <option value="">All Statuses</option>
            {['DRAFT', 'PUBLISHED', 'PENDING_APPROVAL', 'AWARDED', 'CLOSED', 'CANCELLED'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        }
      />

      <Modal open={open} title="Create Request for Quotation (RFQ)" onClose={() => setOpen(false)} wide>
        <form onSubmit={create} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="RFQ Title" required>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Tender for Industrial Packaging & Containers Q4"
                />
              </Field>
            </div>

            <Field label="Department">
              <LookupSelect
                path="/departments"
                params={{ isActive: 'true' }}
                value={form.departmentId}
                label={(r) => `${r.code} — ${r.name}`}
                onChange={(v) => setForm({ ...form, departmentId: v })}
              />
            </Field>

            <Field label="Submission Deadline" required>
              <Input
                type="datetime-local"
                required
                value={form.submissionDeadline}
                onChange={(e) => setForm({ ...form, submissionDeadline: e.target.value })}
              />
            </Field>

            <Field label="Evaluation Method">
              <Select
                value={form.evaluationMethod}
                onChange={(e) => setForm({ ...form, evaluationMethod: e.target.value })}
              >
                <option value="LOWEST_PRICE">LOWEST_PRICE (Lowest Compliant Bid)</option>
                <option value="WEIGHTED">WEIGHTED (Price + Technical Score)</option>
                <option value="MANUAL">MANUAL (Committee Evaluation)</option>
              </Select>
            </Field>

            <Field label="Invite Primary Vendor (Optional)">
              <LookupSelect
                path="/vendors"
                value={form.vendorId}
                label={(r) => `${r.bpCode ?? ''} — ${r.legalName}`}
                onChange={(v) => setForm({ ...form, vendorId: v ?? '' })}
              />
            </Field>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700">
              RFQ Line Items <span className="text-error-500">*</span>
            </label>
            <LinesEditor<RfqLine>
              lines={lines}
              onChange={setLines}
              newLine={emptyLine}
              columns={[
                {
                  key: 'item',
                  header: 'Item (Optional)',
                  width: '20%',
                  render: (row, set) => (
                    <LookupSelect
                      path="/items"
                      params={{ isActive: 'true' }}
                      value={row.itemId}
                      initialLabel={row.itemLabel}
                      label={(r) => `${r.code} — ${r.name}`}
                      onChange={(v, r) =>
                        set({
                          itemId: v,
                          itemLabel: r ? `${r.code} — ${r.name}` : '',
                          description: r ? r.name : row.description,
                          categoryId: r?.categoryId ?? row.categoryId,
                          categoryLabel: r?.categoryName ?? row.categoryLabel,
                          uomId: r?.uomId ?? row.uomId,
                          uomLabel: r?.uomCode ?? row.uomLabel,
                        })
                      }
                    />
                  ),
                },
                {
                  key: 'description',
                  header: 'Description *',
                  width: '28%',
                  render: (row, set) => (
                    <Input
                      required
                      value={row.description}
                      onChange={(e) => set({ description: e.target.value })}
                      placeholder="Requested item"
                    />
                  ),
                },
                {
                  key: 'category',
                  header: 'Category *',
                  width: '20%',
                  render: (row, set) => (
                    <LookupSelect
                      path="/categories"
                      params={{ isActive: 'true' }}
                      value={row.categoryId}
                      initialLabel={row.categoryLabel}
                      label={(r) => `${r.code} — ${r.name}`}
                      onChange={(v, r) => set({ categoryId: v, categoryLabel: r?.name })}
                    />
                  ),
                },
                {
                  key: 'uom',
                  header: 'UoM *',
                  width: '16%',
                  render: (row, set) => (
                    <LookupSelect
                      path="/uoms"
                      params={{ isActive: 'true' }}
                      value={row.uomId}
                      initialLabel={row.uomLabel}
                      label={(r) => `${r.code} — ${r.name}`}
                      onChange={(v, r) => set({ uomId: v, uomLabel: r?.code })}
                    />
                  ),
                },
                {
                  key: 'qty',
                  header: 'Qty *',
                  width: '16%',
                  render: (row, set) => (
                    <Input
                      type="number"
                      min="0.0001"
                      step="any"
                      required
                      value={row.quantity}
                      onChange={(e) => set({ quantity: e.target.value })}
                    />
                  ),
                },
              ]}
            />
          </div>

          <Field label="Terms & Conditions">
            <Textarea
              rows={2}
              value={form.terms}
              onChange={(e) => setForm({ ...form, terms: e.target.value })}
              placeholder="Delivery terms, warranty, and bidding requirements..."
            />
          </Field>

          <ErrorText error={error} />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating RFQ…' : 'Create RFQ'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
