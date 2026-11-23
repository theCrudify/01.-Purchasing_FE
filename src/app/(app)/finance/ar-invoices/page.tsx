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

type AriRow = {
  id: string
  docNo: string | null
  invoiceDate: string
  dueDate: string | null
  status: string
  title: string
  bpCode: string | null
  bpName: string | null
  invoiceKind: string
  customerPoNo: string | null
  commercialInvoiceNo: string | null
  taxInvoiceNo: string | null
  subtotalAmount: string
  vatAmount: string
  netReceivable: string
  currencyCode: string
  totalAmount: string
  ownerName: string
}

type AriLine = {
  itemId: number | null
  itemLabel?: string
  description: string
  uomId: number | null
  uomLabel?: string
  revenueCoaId: number | null
  coaLabel?: string
  quantity: string
  unitPrice: string
  discountPercent: string
}

const emptyLine = (): AriLine => ({
  itemId: null,
  description: '',
  uomId: null,
  revenueCoaId: null,
  quantity: '1',
  unitPrice: '0',
  discountPercent: '0',
})

export default function ArInvoicesPage() {
  const [status, setStatus] = useState('')
  const list = useList<AriRow>('/ar-invoices', 'createdAt:desc', { status: status || undefined })
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    bpId: '',
    invoiceKind: 'INVOICE',
    customerPoNo: '',
    commercialInvoiceNo: '',
    taxInvoiceNo: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    currencyCode: 'IDR',
    remarks: '',
  })
  const [lines, setLines] = useState<AriLine[]>([emptyLine()])

  const subtotal = lines.reduce((sum, l) => {
    const q = Number(l.quantity) || 0
    const p = Number(l.unitPrice) || 0
    const d = Number(l.discountPercent) || 0
    return sum + q * p * (1 - d / 100)
  }, 0)
  const vat = subtotal * 0.11
  const netRec = subtotal + vat

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.bpId) {
      setError('Please select a Customer / Business Partner.')
      return
    }
    if (lines.some((l) => !l.description.trim())) {
      setError('Each AR invoice line requires a description.')
      return
    }
    setBusy(true)
    try {
      await post('/ar-invoices', {
        title: form.title,
        bpId: form.bpId,
        invoiceKind: form.invoiceKind,
        customerPoNo: form.customerPoNo || null,
        commercialInvoiceNo: form.commercialInvoiceNo || null,
        taxInvoiceNo: form.taxInvoiceNo || null,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate || null,
        currencyCode: form.currencyCode,
        remarks: form.remarks || null,
        lines: lines.map((l) => ({
          itemId: l.itemId,
          description: l.description,
          uomId: l.uomId,
          revenueCoaId: l.revenueCoaId,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          discountPercent: Number(l.discountPercent || 0),
        })),
      })
      setOpen(false)
      setForm({ ...form, title: '', customerPoNo: '', commercialInvoiceNo: '', taxInvoiceNo: '', remarks: '' })
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
      await post(`/ar-invoices/${id}/submit`)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <PageHeader
        title="AR Invoices (ARI)"
        subtitle="Issue accounts receivable customer billing invoices, credit memos, and tax invoices."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>New AR Invoice</span>
          </Button>
        }
      />

      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          {
            key: 'docNo',
            header: 'ARI Number',
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
            header: 'Customer / Partner',
            render: (r) => (
              <div>
                <div className="font-medium text-gray-900">{r.bpName}</div>
                <div className="font-mono text-xs text-gray-500">{r.bpCode}</div>
              </div>
            ),
          },
          { key: 'customerPoNo', header: 'Customer PO', render: (r) => <span className="font-mono text-xs">{r.customerPoNo ?? '—'}</span> },
          { key: 'invoiceDate', header: 'Inv Date', sortable: true, render: (r) => fmtDate(r.invoiceDate) },
          { key: 'dueDate', header: 'Due Date', sortable: true, render: (r) => fmtDate(r.dueDate) },
          {
            key: 'totalAmount',
            header: 'Net Receivable',
            sortable: true,
            render: (r) => <span className="font-semibold text-gray-900">{fmtMoney(r.netReceivable, r.currencyCode)}</span>,
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
            {['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'RETURNED', 'REJECTED'].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
          </Select>
        }
      />

      <Modal open={open} title="Create AR Invoice (ARI)" onClose={() => setOpen(false)} wide>
        <form onSubmit={create} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="AR Invoice Title" required>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Penagihan Penjualan Produk Jadi & Jasa Teknis Q2"
                />
              </Field>
            </div>

            <Field label="Customer / Business Partner" required>
              <LookupSelect
                path="/vendors"
                value={form.bpId}
                label={(r) => `${r.bpCode ?? ''} — ${r.legalName}`}
                onChange={(v) => setForm({ ...form, bpId: v ?? '' })}
              />
            </Field>

            <Field label="Customer PO No.">
              <Input
                value={form.customerPoNo}
                onChange={(e) => setForm({ ...form, customerPoNo: e.target.value })}
                placeholder="e.g. CUST-PO-8821"
              />
            </Field>

            <Field label="Commercial Invoice No.">
              <Input
                value={form.commercialInvoiceNo}
                onChange={(e) => setForm({ ...form, commercialInvoiceNo: e.target.value })}
                placeholder="e.g. CI-2026-019"
              />
            </Field>

            <Field label="Tax Invoice No. (Faktur Pajak Keluaran)">
              <Input
                value={form.taxInvoiceNo}
                onChange={(e) => setForm({ ...form, taxInvoiceNo: e.target.value })}
                placeholder="e.g. 010.005-26.87654321"
              />
            </Field>

            <Field label="Invoice Date" required>
              <Input
                type="date"
                required
                value={form.invoiceDate}
                onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
              />
            </Field>

            <Field label="Due Date">
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </Field>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700">
              AR Billing Lines <span className="text-error-500">*</span>
            </label>
            <LinesEditor<AriLine>
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
                      value={row.itemId}
                      initialLabel={row.itemLabel}
                      label={(r) => `${r.code} — ${r.name}`}
                      onChange={(v, r) =>
                        set({
                          itemId: v,
                          itemLabel: r ? `${r.code} — ${r.name}` : '',
                          description: r ? r.name : row.description,
                          uomId: r?.uomId ?? row.uomId,
                        })
                      }
                    />
                  ),
                },
                {
                  key: 'description',
                  header: 'Description *',
                  width: '30%',
                  render: (row, set) => (
                    <Input
                      required
                      value={row.description}
                      onChange={(e) => set({ description: e.target.value })}
                    />
                  ),
                },
                {
                  key: 'coa',
                  header: 'Revenue Account (COA)',
                  width: '20%',
                  render: (row, set) => (
                    <LookupSelect
                      path="/coas"
                      value={row.revenueCoaId}
                      initialLabel={row.coaLabel}
                      label={(r) => `${r.code} — ${r.name}`}
                      onChange={(v, r) => set({ revenueCoaId: v, coaLabel: r ? `${r.code} — ${r.name}` : '' })}
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
                  width: '16%',
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
                <>
                  <tr>
                    <td colSpan={4} className="px-3 py-1.5 text-right text-xs text-gray-500">
                      Subtotal:
                    </td>
                    <td colSpan={2} className="px-3 py-1.5 text-xs font-semibold text-gray-800">
                      {fmtMoney(subtotal, form.currencyCode)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-3 py-1.5 text-right text-xs text-gray-500">
                      PPN (11%):
                    </td>
                    <td colSpan={2} className="px-3 py-1.5 text-xs font-semibold text-gray-800">
                      {fmtMoney(vat, form.currencyCode)}
                    </td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td colSpan={4} className="px-3 py-2 text-right text-xs font-bold text-gray-700">
                      Net Receivable Total:
                    </td>
                    <td colSpan={2} className="px-3 py-2 text-sm font-bold text-gray-900">
                      {fmtMoney(netRec, form.currencyCode)}
                    </td>
                  </tr>
                </>
              }
            />
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
              {busy ? 'Creating…' : 'Create AR Invoice'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
