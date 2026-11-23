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

type PoRow = {
  id: string
  docNo: string | null
  docDate: string
  deliveryDate: string | null
  status: string
  title: string
  bpCode: string | null
  bpName: string | null
  purchaseClassName: string | null
  paymentTermName: string | null
  poType: string | null
  currencyCode: string
  subtotalAmount: string
  vatAmount: string
  grandTotal: string
  totalAmount: string
  ownerName: string
  lineCount: number
}

type PoLine = {
  itemId: number | null
  itemLabel?: string
  description: string
  uomId: number | null
  uomLabel?: string
  quantity: string
  unitPrice: string
  discountPercent: string
}

const emptyLine = (): PoLine => ({
  itemId: null,
  description: '',
  uomId: null,
  quantity: '1',
  unitPrice: '0',
  discountPercent: '0',
})

export default function PurchaseOrdersPage() {
  const [status, setStatus] = useState('')
  const list = useList<PoRow>('/po', 'createdAt:desc', { status: status || undefined })
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    bpId: '',
    purchaseClassId: null as number | null,
    paymentTermId: null as number | null,
    currencyCode: 'IDR',
    poType: 'STANDARD',
    bpReference: '',
    shippingMethod: 'Land Freight',
    deliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    deliveryAddress: 'Central Receiving Warehouse — Cikarang Industrial Estate',
    freightAmount: '0',
    remarks: '',
  })
  const [lines, setLines] = useState<PoLine[]>([emptyLine()])

  const subtotal = lines.reduce((sum, l) => {
    const qty = Number(l.quantity) || 0
    const price = Number(l.unitPrice) || 0
    const disc = Number(l.discountPercent) || 0
    return sum + qty * price * (1 - disc / 100)
  }, 0)
  const vat = subtotal * 0.11
  const freight = Number(form.freightAmount) || 0
  const grandTotal = subtotal + vat + freight

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.bpId || !form.purchaseClassId || !form.paymentTermId) {
      setError('Please select Vendor, Purchase Class, and Payment Term.')
      return
    }
    if (lines.some((l) => !l.description.trim() || !l.uomId)) {
      setError('Each PO line requires Description and UoM.')
      return
    }
    setBusy(true)
    try {
      await post('/po', {
        ...form,
        freightAmount: Number(form.freightAmount || 0),
        lines: lines.map((l) => ({
          itemId: l.itemId,
          description: l.description,
          uomId: Number(l.uomId),
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          discountPercent: Number(l.discountPercent || 0),
        })),
      })
      setOpen(false)
      setForm({ ...form, title: '', bpReference: '', remarks: '' })
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
      await post(`/po/${id}/submit`)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Purchase Orders (PO)"
        subtitle="Issue official purchase orders to suppliers, track approval status, and monitor delivery fulfillment."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>New Purchase Order</span>
          </Button>
        }
      />

      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          {
            key: 'docNo',
            header: 'PO Number',
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
          { key: 'purchaseClassName', header: 'Purchase Class' },
          { key: 'paymentTermName', header: 'Payment Term' },
          { key: 'deliveryDate', header: 'Delivery Date', sortable: true, render: (r) => fmtDate(r.deliveryDate) },
          {
            key: 'totalAmountBase',
            header: 'Grand Total',
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
            {['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ISSUED', 'RETURNED', 'REJECTED', 'CANCELLED'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        }
      />

      <Modal open={open} title="Create New Purchase Order (PO)" onClose={() => setOpen(false)} wide>
        <form onSubmit={create} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="PO Title / Order Subject" required>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Purchase Order for Chemical Resin & Containers Batch Q4"
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

            <Field label="Expected Delivery Date" required>
              <Input
                type="date"
                required
                value={form.deliveryDate}
                onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
              />
            </Field>

            <Field label="PO Type">
              <Select value={form.poType} onChange={(e) => setForm({ ...form, poType: e.target.value })}>
                <option value="STANDARD">STANDARD (Direct Purchase Order)</option>
                <option value="BLANKET">BLANKET (Contract Release Order)</option>
                <option value="SERVICE">SERVICE (Service Work Order)</option>
              </Select>
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
              <Field label="Delivery Address">
                <Input
                  value={form.deliveryAddress}
                  onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                />
              </Field>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700">
              PO Line Items <span className="text-error-500">*</span>
            </label>
            <LinesEditor<PoLine>
              lines={lines}
              onChange={setLines}
              newLine={emptyLine}
              columns={[
                {
                  key: 'item',
                  header: 'Catalog Item',
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
                  width: '15%',
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
                  header: 'Unit Price *',
                  width: '15%',
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
                {
                  key: 'disc',
                  header: 'Disc %',
                  width: '8%',
                  render: (row, set) => (
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={row.discountPercent}
                      onChange={(e) => set({ discountPercent: e.target.value })}
                    />
                  ),
                },
              ]}
              footer={
                <>
                  <tr>
                    <td colSpan={5} className="px-3 py-1.5 text-right text-xs text-gray-500">
                      Subtotal:
                    </td>
                    <td colSpan={3} className="px-3 py-1.5 text-xs font-semibold text-gray-800">
                      {fmtMoney(subtotal, form.currencyCode)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="px-3 py-1.5 text-right text-xs text-gray-500">
                      VAT (11%):
                    </td>
                    <td colSpan={3} className="px-3 py-1.5 text-xs font-semibold text-gray-800">
                      {fmtMoney(vat, form.currencyCode)}
                    </td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td colSpan={5} className="px-3 py-2 text-right text-xs font-bold text-gray-700">
                      Grand Total:
                    </td>
                    <td colSpan={3} className="px-3 py-2 text-sm font-bold text-gray-900">
                      {fmtMoney(grandTotal, form.currencyCode)}
                    </td>
                  </tr>
                </>
              }
            />
          </div>

          <Field label="Remarks / Special Instructions">
            <Textarea
              rows={2}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Packing, COA certificate requirement, or delivery notes..."
            />
          </Field>

          <ErrorText error={error} />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating PO…' : 'Create Purchase Order'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
