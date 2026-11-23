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

type PrRow = {
  id: string
  docNo: string | null
  docDate: string
  requiredDate: string
  status: string
  title: string
  departmentName: string | null
  purchaseClassName: string | null
  sourcingMethod: string
  currencyCode: string
  totalAmount: string
  ownerName: string
  lineCount: number
}

type PrLine = {
  itemId: number | null
  itemLabel?: string
  description: string
  uomId: number | null
  uomLabel?: string
  quantity: string
  estimatedUnitPrice: string
}

const emptyLine = (): PrLine => ({
  itemId: null,
  description: '',
  uomId: null,
  quantity: '1',
  estimatedUnitPrice: '0',
})

export default function PurchaseRequestsPage() {
  const [status, setStatus] = useState('')
  const list = useList<PrRow>('/pr', 'createdAt:desc', { status: status || undefined })
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    requiredDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    departmentId: null as number | null,
    purchaseClassId: null as number | null,
    costCenterId: null as number | null,
    currencyCode: 'IDR',
    sourcingMethod: 'DIRECT',
    justification: '',
    remarks: '',
  })
  const [lines, setLines] = useState<PrLine[]>([emptyLine()])

  const totalEst = lines.reduce(
    (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.estimatedUnitPrice) || 0),
    0
  )

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.departmentId || !form.purchaseClassId) {
      setError('Please select Department and Purchase Class.')
      return
    }
    if (lines.some((l) => !l.description.trim() || !l.uomId)) {
      setError('Each line item requires a description and Unit of Measure (UoM).')
      return
    }
    setBusy(true)
    try {
      await post('/pr', {
        ...form,
        lines: lines.map((l) => ({
          itemId: l.itemId,
          description: l.description,
          uomId: l.uomId,
          quantity: Number(l.quantity),
          estimatedUnitPrice: Number(l.estimatedUnitPrice || 0),
        })),
      })
      setOpen(false)
      setForm({ ...form, title: '', justification: '', remarks: '' })
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
      await post(`/pr/${id}/submit`)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Purchase Requests (PR)"
        subtitle="Create internal requisitions for materials, equipment, or services and submit them through the approval workflow."
        actions={
          <Link href="/purchasing/pr/new"><Button>
            <Plus className="h-4 w-4" />
            <span>New Purchase Request</span>
          </Button></Link>
        }
      />

      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          {
            key: 'docNo',
            header: 'PR Number',
            sortable: true,
            render: (r) => (
              <Link className="font-semibold text-brand-600 hover:underline" href={`/purchasing/pr/${r.id}`}>
                {r.docNo ?? '(Draft)'}
              </Link>
            ),
          },
          { key: 'title', header: 'Title' },
          { key: 'departmentName', header: 'Department' },
          { key: 'purchaseClassName', header: 'Purchase Class' },
          { key: 'requiredDate', header: 'Required Date', sortable: true, render: (r) => fmtDate(r.requiredDate) },
          { key: 'lineCount', header: 'Items', render: (r) => `${r.lineCount} item(s)` },
          {
            key: 'totalAmountBase',
            header: 'Est. Total',
            sortable: true,
            render: (r) => <span className="font-semibold">{fmtMoney(r.totalAmount, r.currencyCode)}</span>,
          },
          { key: 'ownerName', header: 'Requester' },
          { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge value={r.status} /> },
          {
            key: '_a',
            header: 'Actions',
            render: (r) => (
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/purchasing/pr/${r.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Detail / Edit</span>
                </Link>
                {['DRAFT', 'RETURNED', 'REVISION_REQUIRED'].includes(r.status) && (
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
            {['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'RETURNED', 'REJECTED', 'CANCELLED'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        }
      />

      <Modal open={open} title="Create New Purchase Request (PR)" onClose={() => setOpen(false)} wide>
        <form onSubmit={create} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="PR Title / Subject" required>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Q4 Raw Material & Laboratory Equipment Requisition"
                />
              </Field>
            </div>

            <Field label="Requesting Department" required>
              <LookupSelect
                path="/departments"
                params={{ isActive: 'true' }}
                value={form.departmentId}
                label={(r) => `${r.code} — ${r.name}`}
                onChange={(v) => setForm({ ...form, departmentId: v })}
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

            <Field label="Required Delivery Date" required>
              <Input
                type="date"
                required
                value={form.requiredDate}
                onChange={(e) => setForm({ ...form, requiredDate: e.target.value })}
              />
            </Field>

            <Field label="Sourcing Method">
              <Select value={form.sourcingMethod} onChange={(e) => setForm({ ...form, sourcingMethod: e.target.value })}>
                <option value="DIRECT">DIRECT (Direct PO to Approved Vendor)</option>
                <option value="RFQ">RFQ (Competitive Bidding / Quotation)</option>
                <option value="CONTRACT">CONTRACT (Release against Blanket Contract)</option>
              </Select>
            </Field>

            <Field label="Cost Center (Optional)">
              <LookupSelect
                path="/cost-centers"
                params={{ isActive: 'true' }}
                value={form.costCenterId}
                label={(r) => `${r.code} — ${r.name}`}
                onChange={(v) => setForm({ ...form, costCenterId: v })}
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
              Line Items <span className="text-error-500">*</span>
            </label>
            <LinesEditor<PrLine>
              lines={lines}
              onChange={setLines}
              newLine={emptyLine}
              columns={[
                {
                  key: 'item',
                  header: 'Catalog Item (Optional)',
                  width: '22%',
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
                  header: 'Description / Specification *',
                  width: '30%',
                  render: (row, set) => (
                    <Input
                      required
                      value={row.description}
                      onChange={(e) => set({ description: e.target.value })}
                      placeholder="Item description"
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
                  width: '12%',
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
                {
                  key: 'price',
                  header: 'Est. Unit Price',
                  width: '20%',
                  render: (row, set) => (
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={row.estimatedUnitPrice}
                      onChange={(e) => set({ estimatedUnitPrice: e.target.value })}
                    />
                  ),
                },
              ]}
              footer={
                <tr>
                  <td colSpan={4} className="px-3 py-2.5 text-right text-xs font-semibold text-gray-600">
                    Estimated Total:
                  </td>
                  <td colSpan={3} className="px-3 py-2.5 text-sm font-bold text-gray-900">
                    {fmtMoney(totalEst, form.currencyCode)}
                  </td>
                </tr>
              }
            />
          </div>

          <Field label="Business Justification / Purpose">
            <Textarea
              rows={2}
              value={form.justification}
              onChange={(e) => setForm({ ...form, justification: e.target.value })}
              placeholder="Explain why this purchase is required..."
            />
          </Field>

          <ErrorText error={error} />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating PR…' : 'Create Purchase Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
