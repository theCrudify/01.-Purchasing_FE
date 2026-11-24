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
import { useAreaHref } from '@/lib/area-href'

type QuoRow = {
  id: string
  docNo: string | null
  docDate: string
  status: string
  title: string
  bpCode: string | null
  bpName: string | null
  rfqDocNo: string | null
  bpReference: string | null
  validUntil: string | null
  currencyCode: string
  totalAmount: string
  ownerName: string
  lineCount: number
}

type QuoLine = {
  quantity: string
  unitPrice: string
  discountPercent: string
  leadTimeDays: string
}

const emptyLine = (): QuoLine => ({
  quantity: '1',
  unitPrice: '0',
  discountPercent: '0',
  leadTimeDays: '7',
})

export default function QuotationsPage() {
  const [status, setStatus] = useState('')
  const to = useAreaHref()
  const list = useList<QuoRow>('/quotations', 'createdAt:desc', { status: status || undefined })
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    rfqId: '',
    bpId: '',
    bpReference: '',
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    currencyCode: 'IDR',
    paymentTermId: null as number | null,
    deliveryTerms: 'FOB Destination',
    remarks: '',
  })
  const [lines, setLines] = useState<QuoLine[]>([emptyLine()])

  const totalQuote = lines.reduce((sum, l) => {
    const qty = Number(l.quantity) || 0
    const price = Number(l.unitPrice) || 0
    const disc = Number(l.discountPercent) || 0
    return sum + qty * price * (1 - disc / 100)
  }, 0)

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.rfqId || !form.bpId) {
      setError('Please select both the source RFQ and the quoting Vendor.')
      return
    }
    setBusy(true)
    try {
      await post('/quotations', {
        ...form,
        lines: lines.map((l) => ({
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          discountPercent: Number(l.discountPercent || 0),
          leadTimeDays: l.leadTimeDays ? Number(l.leadTimeDays) : null,
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
      await post(`/quotations/${id}/submit`)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Vendor Quotations (QUO)"
        subtitle="Record, evaluate, and compare supplier price quotations submitted against RFQs."
        actions={
          <Link href={to('/purchasing/quotations/new')}><Button>
            <Plus className="h-4 w-4" />
            <span>New Quotation</span>
          </Button></Link>
        }
      />

      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          {
            key: 'docNo',
            header: 'Quotation No',
            sortable: true,
            render: (r) => (
              <Link className="font-semibold text-brand-600 hover:underline" href={to(`/purchasing/quotations/${r.id}`)}>
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
          { key: 'rfqDocNo', header: 'Ref. RFQ' },
          { key: 'validUntil', header: 'Valid Until', render: (r) => fmtDate(r.validUntil) },
          {
            key: 'totalAmountBase',
            header: 'Quoted Total',
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
                  href={to(`/purchasing/quotations/${r.id}`)}
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
            aria-label="Filter status"
          >
            <option value="">All Statuses</option>
            {['DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        }
      />

      <Modal open={open} title="Record Vendor Quotation (QUO)" onClose={() => setOpen(false)} wide>
        <form onSubmit={create} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Source RFQ" required>
              <LookupSelect
                path="/rfq"
                value={form.rfqId}
                label={(r) => `${r.docNo ?? 'Draft'} — ${r.title}`}
                onChange={(v, r) =>
                  setForm({
                    ...form,
                    rfqId: v ?? '',
                    title: form.title || (r ? `Quotation for ${r.docNo}` : ''),
                  })
                }
              />
            </Field>

            <Field label="Vendor / Supplier" required>
              <LookupSelect
                path="/vendors"
                value={form.bpId}
                label={(r) => `${r.bpCode ?? ''} — ${r.legalName}`}
                onChange={(v) => setForm({ ...form, bpId: v ?? '' })}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Quotation Title" required>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Vendor Bid for Industrial Containers"
                />
              </Field>
            </div>

            <Field label="Vendor Quote Reference No.">
              <Input
                value={form.bpReference}
                onChange={(e) => setForm({ ...form, bpReference: e.target.value })}
                placeholder="e.g. QUO-EXT-2026-09"
              />
            </Field>

            <Field label="Valid Until">
              <Input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              />
            </Field>

            <Field label="Payment Term">
              <LookupSelect
                path="/payment-terms"
                params={{ isActive: 'true' }}
                value={form.paymentTermId}
                label={(r) => `${r.code} — ${r.name}`}
                onChange={(v) => setForm({ ...form, paymentTermId: v })}
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
              Quotation Pricing Lines <span className="text-error-500">*</span>
            </label>
            <LinesEditor<QuoLine>
              lines={lines}
              onChange={setLines}
              newLine={emptyLine}
              columns={[
                {
                  key: 'qty',
                  header: 'Quoted Qty *',
                  width: '25%',
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
                  width: '30%',
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
                  header: 'Discount (%)',
                  width: '20%',
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
                {
                  key: 'lead',
                  header: 'Lead Time (Days)',
                  width: '25%',
                  render: (row, set) => (
                    <Input
                      type="number"
                      min="0"
                      value={row.leadTimeDays}
                      onChange={(e) => set({ leadTimeDays: e.target.value })}
                    />
                  ),
                },
              ]}
              footer={
                <tr>
                  <td colSpan={3} className="px-3 py-2.5 text-right text-xs font-semibold text-gray-600">
                    Total Quoted Amount:
                  </td>
                  <td colSpan={3} className="px-3 py-2.5 text-sm font-bold text-gray-900">
                    {fmtMoney(totalQuote, form.currencyCode)}
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
              {busy ? 'Saving Quotation…' : 'Create Quotation'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
