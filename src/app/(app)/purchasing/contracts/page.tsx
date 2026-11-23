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

type CtrRow = {
  id: string
  docNo: string | null
  docDate: string
  status: string
  title: string
  bpCode: string | null
  bpName: string | null
  agreementType: string
  startDate: string
  endDate: string
  targetAmount: string | null
  purchaseClassName: string | null
  paymentTermName: string | null
  currencyCode: string
  totalAmount: string
  ownerName: string
  lineCount: number
}

type CtrLine = {
  itemId: number | null
  itemLabel?: string
  description: string
  uomId: number | null
  uomLabel?: string
  targetQty: string
  unitPrice: string
  discountPercent: string
}

const emptyLine = (): CtrLine => ({
  itemId: null,
  description: '',
  uomId: null,
  targetQty: '100',
  unitPrice: '0',
  discountPercent: '0',
})

export default function ContractsPage() {
  const [status, setStatus] = useState('')
  const list = useList<CtrRow>('/contracts', 'createdAt:desc', { status: status || undefined })
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    bpId: '',
    agreementType: 'QUANTITY',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    purchaseClassId: null as number | null,
    paymentTermId: null as number | null,
    currencyCode: 'IDR',
    bpReference: '',
    terms: '',
    remarks: '',
  })
  const [lines, setLines] = useState<CtrLine[]>([emptyLine()])

  const totalCtr = lines.reduce((sum, l) => {
    const qty = Number(l.targetQty) || 0
    const price = Number(l.unitPrice) || 0
    const disc = Number(l.discountPercent) || 0
    return sum + qty * price * (1 - disc / 100)
  }, 0)

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.bpId || !form.purchaseClassId || !form.paymentTermId) {
      setError('Please select Vendor, Purchase Class, and Payment Term.')
      return
    }
    if (lines.some((l) => !l.description.trim() || !l.uomId)) {
      setError('Each contract line requires Description and UoM.')
      return
    }
    setBusy(true)
    try {
      await post('/contracts', {
        ...form,
        targetAmount: totalCtr,
        lines: lines.map((l) => ({
          itemId: l.itemId,
          description: l.description,
          uomId: Number(l.uomId),
          targetQty: Number(l.targetQty),
          unitPrice: Number(l.unitPrice),
          discountPercent: Number(l.discountPercent || 0),
        })),
      })
      setOpen(false)
      setForm({ ...form, title: '', bpReference: '', terms: '', remarks: '' })
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
      await post(`/contracts/${id}/submit`)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Purchase Contracts (CTR)"
        subtitle="Manage long-term blanket quantity and value agreements with approved vendors."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>New Contract</span>
          </Button>
        }
      />

      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          {
            key: 'docNo',
            header: 'Contract No',
            sortable: true,
            render: (r) => (
              <Link className="font-semibold text-brand-600 hover:underline" href={`/documents/${r.id}`}>
                {r.docNo ?? '(Draft)'}
              </Link>
            ),
          },
          { key: 'title', header: 'Title' },
          {
            key: 'bpName',
            header: 'Vendor',
            render: (r) => (
              <div>
                <div className="font-medium text-gray-900">{r.bpName ?? '—'}</div>
                <div className="font-mono text-xs text-gray-500">{r.bpCode}</div>
              </div>
            ),
          },
          { key: 'agreementType', header: 'Type', render: (r) => <Badge value={r.agreementType} /> },
          {
            key: 'startDate',
            header: 'Validity Period',
            sortable: true,
            render: (r) => `${fmtDate(r.startDate)} – ${fmtDate(r.endDate)}`,
          },
          {
            key: 'totalAmount',
            header: 'Contract Value',
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
            aria-label="Filter status"
          >
            <option value="">All Statuses</option>
            {['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'EXPIRED', 'CANCELLED'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        }
      />

      <Modal open={open} title="Create Purchase Contract (CTR)" onClose={() => setOpen(false)} wide>
        <form onSubmit={create} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Contract Title" required>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Annual Blanket Supply Contract for Chemical Resin 2026"
                />
              </Field>
            </div>

            <Field label="Vendor / Supplier" required>
              <LookupSelect
                path="/vendors"
                value={form.bpId}
                label={(r) => `${r.bpCode ?? ''} — ${r.legalName}`}
                onChange={(v) => setForm({ ...form, bpId: v ?? '' })}
              />
            </Field>

            <Field label="Agreement Type">
              <Select value={form.agreementType} onChange={(e) => setForm({ ...form, agreementType: e.target.value })}>
                <option value="QUANTITY">QUANTITY (Blanket Quantity Contract)</option>
                <option value="AMOUNT">AMOUNT (Value Limit Contract)</option>
              </Select>
            </Field>

            <Field label="Start Date" required>
              <Input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </Field>

            <Field label="End Date" required>
              <Input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </Field>

            <Field label="Purchase Class" required>
              <LookupSelect
                path="/purchase-classes"
                params={{ isActive: 'true' }}
                value={form.purchaseClassId}
                label={(r) => `${r.code} — ${r.name}`}
                onChange={(v) => setForm({ ...form, purchaseClassId: v })}
              />
            </Field>

            <Field label="Payment Term" required>
              <LookupSelect
                path="/payment-terms"
                params={{ isActive: 'true' }}
                value={form.paymentTermId}
                label={(r) => `${r.code} — ${r.name}`}
                onChange={(v) => setForm({ ...form, paymentTermId: v })}
              />
            </Field>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700">
              Contract Items & Agreed Pricing <span className="text-error-500">*</span>
            </label>
            <LinesEditor<CtrLine>
              lines={lines}
              onChange={setLines}
              newLine={emptyLine}
              columns={[
                {
                  key: 'item',
                  header: 'Catalog Item',
                  width: '24%',
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
                  header: 'Target Qty *',
                  width: '14%',
                  render: (row, set) => (
                    <Input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={row.targetQty}
                      onChange={(e) => set({ targetQty: e.target.value })}
                    />
                  ),
                },
                {
                  key: 'price',
                  header: 'Agreed Price *',
                  width: '18%',
                  render: (row, set) => (
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={row.unitPrice}
                      onChange={(e) => set({ unitPrice: e.target.value })}
                    />
                  ),
                },
              ]}
              footer={
                <tr>
                  <td colSpan={4} className="px-3 py-2.5 text-right text-xs font-semibold text-gray-600">
                    Target Contract Amount:
                  </td>
                  <td colSpan={3} className="px-3 py-2.5 text-sm font-bold text-gray-900">
                    {fmtMoney(totalCtr, form.currencyCode)}
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
              {busy ? 'Creating Contract…' : 'Create Contract'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
