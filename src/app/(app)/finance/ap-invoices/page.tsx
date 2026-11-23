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

type InvRow = {
  id: string
  docNo: string | null
  invoiceDate: string
  dueDate: string | null
  status: string
  title: string
  bpCode: string | null
  bpName: string | null
  invoiceKind: string
  poDocNo: string | null
  bpInvoiceNo: string
  taxInvoiceNo: string | null
  transactionAmount: string
  vatAmount: string
  whtAmount: string
  netPayable: string
  currencyCode: string
  totalAmount: string
  ownerName: string
}

type InvLine = {
  description: string
  coaId: number | null
  coaLabel?: string
  quantity: string
  unitPrice: string
  discountPercent: string
}

const emptyLine = (): InvLine => ({
  description: '',
  coaId: null,
  quantity: '1',
  unitPrice: '0',
  discountPercent: '0',
})

export default function ApInvoicesPage() {
  const [status, setStatus] = useState('')
  const list = useList<InvRow>('/ap-invoices', 'createdAt:desc', { status: status || undefined })
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    bpId: '',
    poId: '',
    invoiceKind: 'INVOICE',
    bpInvoiceNo: '',
    taxInvoiceNo: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    currencyCode: 'IDR',
    whtAmount: '0',
    remarks: '',
  })
  const [lines, setLines] = useState<InvLine[]>([emptyLine()])

  const subtotal = lines.reduce((sum, l) => {
    const q = Number(l.quantity) || 0
    const p = Number(l.unitPrice) || 0
    const d = Number(l.discountPercent) || 0
    return sum + q * p * (1 - d / 100)
  }, 0)
  const vat = subtotal * 0.11
  const wht = Number(form.whtAmount) || 0
  const netPayable = subtotal + vat - wht

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.bpId || !form.bpInvoiceNo.trim()) {
      setError('Please select Vendor and enter Vendor Invoice No.')
      return
    }
    if (lines.some((l) => !l.description.trim())) {
      setError('Each invoice line requires a description.')
      return
    }
    setBusy(true)
    try {
      await post('/ap-invoices', {
        title: form.title,
        bpId: form.bpId,
        poId: form.poId || null,
        invoiceKind: form.invoiceKind,
        bpInvoiceNo: form.bpInvoiceNo,
        taxInvoiceNo: form.taxInvoiceNo || null,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate || null,
        currencyCode: form.currencyCode,
        whtAmount: Number(form.whtAmount || 0),
        remarks: form.remarks || null,
        lines: lines.map((l) => ({
          description: l.description,
          coaId: l.coaId,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          discountPercent: Number(l.discountPercent || 0),
        })),
      })
      setOpen(false)
      setForm({ ...form, title: '', bpInvoiceNo: '', taxInvoiceNo: '', remarks: '' })
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
      await post(`/ap-invoices/${id}/submit`)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <PageHeader
        title="AP Invoices (INV)"
        subtitle="Record and verify supplier accounts payable invoices, down payment invoices, and tax invoices (Faktur Pajak) for OPAP disbursement."
        actions={
          <Link href="/finance/ap-invoices/new"><Button>
            <Plus className="h-4 w-4" />
            <span>New AP Invoice</span>
          </Button></Link>
        }
      />

      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          {
            key: 'docNo',
            header: 'INV Number',
            sortable: true,
            render: (r) => (
              <Link className="font-semibold text-brand-600 hover:underline" href={`/finance/ap-invoices/${r.id}`}>
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
                <div className="font-medium text-gray-900">{r.bpName}</div>
                <div className="font-mono text-xs text-gray-500">{r.bpCode}</div>
              </div>
            ),
          },
          { key: 'bpInvoiceNo', header: 'Vendor Inv No.', render: (r) => <span className="font-mono text-xs">{r.bpInvoiceNo}</span> },
          { key: 'poDocNo', header: 'PO Ref.', render: (r) => <span className="font-mono text-xs">{r.poDocNo ?? '—'}</span> },
          { key: 'invoiceDate', header: 'Inv Date', sortable: true, render: (r) => fmtDate(r.invoiceDate) },
          { key: 'dueDate', header: 'Due Date', sortable: true, render: (r) => fmtDate(r.dueDate) },
          {
            key: 'totalAmount',
            header: 'Net Payable',
            sortable: true,
            render: (r) => <span className="font-semibold text-gray-900">{fmtMoney(r.netPayable, r.currencyCode)}</span>,
          },
          { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge value={r.status} /> },
          {
            key: '_a',
            header: 'Actions',
            render: (r) => (
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/finance/ap-invoices/${r.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Detail / Edit</span>
                </Link>
                {['DRAFT', 'SUBMITTED', 'RETURNED'].includes(r.status) && (
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
            {['DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'PAYMENT_PROCESSING', 'PARTIALLY_PAID', 'PAID', 'RETURNED', 'REJECTED'].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
          </Select>
        }
      />

      <Modal open={open} title="Create AP Invoice (INV)" onClose={() => setOpen(false)} wide>
        <form onSubmit={create} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Invoice Title / Description" required>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Tagihan Pembelian Bahan Baku Resin & Solvent Batch April"
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

            <Field label="Reference Purchase Order (Optional)">
              <LookupSelect
                path="/po"
                value={form.poId}
                label={(r) => `${r.docNo ?? '(Draft)'} — ${r.title}`}
                onChange={(v) => setForm({ ...form, poId: v ?? '' })}
              />
            </Field>

            <Field label="Vendor Invoice Number" required>
              <Input
                required
                value={form.bpInvoiceNo}
                onChange={(e) => setForm({ ...form, bpInvoiceNo: e.target.value })}
                placeholder="e.g. INV/KIN/2026/0482"
              />
            </Field>

            <Field label="Tax Invoice No. (Nomor Faktur Pajak)">
              <Input
                value={form.taxInvoiceNo}
                onChange={(e) => setForm({ ...form, taxInvoiceNo: e.target.value })}
                placeholder="e.g. 010.004-26.12345678"
              />
            </Field>

            <Field label="Invoice Kind">
              <Select value={form.invoiceKind} onChange={(e) => setForm({ ...form, invoiceKind: e.target.value })}>
                <option value="INVOICE">INVOICE (Standard AP Invoice)</option>
                <option value="DOWN_PAYMENT">DOWN_PAYMENT (AP Down Payment Invoice)</option>
                <option value="CREDIT_MEMO">CREDIT_MEMO (Vendor Credit Memo)</option>
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
              Invoice Line Items <span className="text-error-500">*</span>
            </label>
            <LinesEditor<InvLine>
              lines={lines}
              onChange={setLines}
              newLine={emptyLine}
              columns={[
                {
                  key: 'description',
                  header: 'Description *',
                  width: '36%',
                  render: (row, set) => (
                    <Input
                      required
                      value={row.description}
                      onChange={(e) => set({ description: e.target.value })}
                      placeholder="Billed item or service description"
                    />
                  ),
                },
                {
                  key: 'coa',
                  header: 'G/L Account (COA)',
                  width: '24%',
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
                  key: 'qty',
                  header: 'Qty *',
                  width: '14%',
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
                    <td colSpan={4} className="px-3 py-1.5 text-right text-xs text-gray-500">
                      Subtotal (DPP):
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
                      Net Payable Total:
                    </td>
                    <td colSpan={2} className="px-3 py-2 text-sm font-bold text-gray-900">
                      {fmtMoney(netPayable, form.currencyCode)}
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
              {busy ? 'Creating…' : 'Create AP Invoice'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
