'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Eye, Plus, Send } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { LinesEditor } from '@/components/document'
import { LookupSelect } from '@/components/form'
import { Badge, Button, ErrorText, Field, Input, Modal, PageHeader, Select, Textarea, fmtDate } from '@/components/ui'
import { post } from '@/lib/api'
import { useList } from '@/lib/use-list'

type GrRow = {
  id: string
  docNo: string | null
  docDate: string
  receivedDate: string
  status: string
  title: string
  bpCode: string | null
  bpName: string | null
  receiptKind: string
  poDocNo: string | null
  deliveryNoteNo: string | null
  vehiclePlateNo: string | null
  location: string | null
  ownerName: string
  lineCount: number
}

type GrLine = {
  receivedQty: string
  acceptedQty: string
  rejectedQty: string
  rejectReason: string
}

const emptyLine = (): GrLine => ({
  receivedQty: '1',
  acceptedQty: '1',
  rejectedQty: '0',
  rejectReason: '',
})

export default function GoodsReceiptsPage() {
  const [status, setStatus] = useState('')
  const list = useList<GrRow>('/gr', 'createdAt:desc', { status: status || undefined })
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    poId: '',
    receiptKind: 'RECEIPT',
    receivedDate: new Date().toISOString().slice(0, 10),
    deliveryNoteNo: '',
    vehiclePlateNo: '',
    driverName: '',
    carrierName: '',
    location: 'Main Receiving Warehouse Gate 1',
    returnReason: '',
    remarks: '',
  })
  const [lines, setLines] = useState<GrLine[]>([emptyLine()])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.poId) {
      setError('Please select a Purchase Order (PO).')
      return
    }
    setBusy(true)
    try {
      await post('/gr', {
        ...form,
        lines: lines.map((l) => ({
          receivedQty: Number(l.receivedQty),
          acceptedQty: Number(l.acceptedQty),
          rejectedQty: Number(l.rejectedQty || 0),
          rejectReason: l.rejectReason || null,
        })),
      })
      setOpen(false)
      setForm({ ...form, title: '', deliveryNoteNo: '', vehiclePlateNo: '', driverName: '', remarks: '' })
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
      await post(`/gr/${id}/submit`)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Goods Receipts & Returns (GR)"
        subtitle="Record physical material arrivals, QC inspection quantities, delivery notes (Surat Jalan), and vendor returns."
        actions={
          <Link href="/purchasing/gr/new"><Button>
            <Plus className="h-4 w-4" />
            <span>New Goods Receipt</span>
          </Button></Link>
        }
      />

      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          {
            key: 'docNo',
            header: 'GR Number',
            sortable: true,
            render: (r) => (
              <Link className="font-semibold text-brand-600 hover:underline" href={`/purchasing/gr/${r.id}`}>
                {r.docNo ?? '(Draft)'}
              </Link>
            ),
          },
          { key: 'title', header: 'Title' },
          { key: 'receiptKind', header: 'Type', render: (r) => <Badge value={r.receiptKind} /> },
          { key: 'poDocNo', header: 'Ref. PO' },
          { key: 'bpName', header: 'Vendor' },
          { key: 'deliveryNoteNo', header: 'Delivery Note (SJ)' },
          { key: 'receivedDate', header: 'Received Date', sortable: true, render: (r) => fmtDate(r.receivedDate) },
          { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge value={r.status} /> },
          {
            key: '_a',
            header: 'Actions',
            render: (r) => (
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/purchasing/gr/${r.id}`}
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
                    <span>Post / Submit</span>
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
            {['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'POSTED', 'CANCELLED'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        }
      />

      <Modal open={open} title="Record Goods Receipt (GR)" onClose={() => setOpen(false)} wide>
        <form onSubmit={create} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Reference Purchase Order (PO)" required>
              <LookupSelect
                path="/po"
                value={form.poId}
                label={(r) => `${r.docNo ?? 'Draft'} — ${r.bpName ?? ''} (${r.title})`}
                onChange={(v, r) =>
                  setForm({
                    ...form,
                    poId: v ?? '',
                    title: form.title || (r ? `Goods Receipt for ${r.docNo}` : ''),
                  })
                }
              />
            </Field>

            <Field label="Transaction Type">
              <Select value={form.receiptKind} onChange={(e) => setForm({ ...form, receiptKind: e.target.value })}>
                <option value="RECEIPT">RECEIPT (Inbound Delivery Receipt)</option>
                <option value="RETURN">RETURN (Return to Vendor)</option>
              </Select>
            </Field>

            <div className="sm:col-span-2">
              <Field label="GR Title / Description" required>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Partial / Full Delivery Receipt for PO"
                />
              </Field>
            </div>

            <Field label="Received Date" required>
              <Input
                type="date"
                required
                value={form.receivedDate}
                onChange={(e) => setForm({ ...form, receivedDate: e.target.value })}
              />
            </Field>

            <Field label="Vendor Delivery Note No. (Surat Jalan)">
              <Input
                value={form.deliveryNoteNo}
                onChange={(e) => setForm({ ...form, deliveryNoteNo: e.target.value })}
                placeholder="e.g. SJ-2026-11-0082"
              />
            </Field>

            <Field label="Vehicle Plate No.">
              <Input
                value={form.vehiclePlateNo}
                onChange={(e) => setForm({ ...form, vehiclePlateNo: e.target.value })}
                placeholder="e.g. B 9421 KXA"
              />
            </Field>

            <Field label="Driver Name">
              <Input
                value={form.driverName}
                onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                placeholder="Driver full name"
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Receiving Warehouse Location">
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </Field>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700">
              Received & QC Inspected Quantities <span className="text-error-500">*</span>
            </label>
            <LinesEditor<GrLine>
              lines={lines}
              onChange={setLines}
              newLine={emptyLine}
              columns={[
                {
                  key: 'rec',
                  header: 'Received Qty *',
                  width: '22%',
                  render: (row, set) => (
                    <Input
                      type="number"
                      min="0.0001"
                      step="any"
                      required
                      value={row.receivedQty}
                      onChange={(e) => set({ receivedQty: e.target.value, acceptedQty: e.target.value })}
                    />
                  ),
                },
                {
                  key: 'acc',
                  header: 'QC Accepted Qty *',
                  width: '22%',
                  render: (row, set) => (
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={row.acceptedQty}
                      onChange={(e) => set({ acceptedQty: e.target.value })}
                    />
                  ),
                },
                {
                  key: 'rej',
                  header: 'Rejected Qty',
                  width: '20%',
                  render: (row, set) => (
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={row.rejectedQty}
                      onChange={(e) => set({ rejectedQty: e.target.value })}
                    />
                  ),
                },
                {
                  key: 'reason',
                  header: 'QC Reject Reason (if any)',
                  width: '36%',
                  render: (row, set) => (
                    <Input
                      value={row.rejectReason}
                      onChange={(e) => set({ rejectReason: e.target.value })}
                      placeholder="Optional defect notes"
                    />
                  ),
                },
              ]}
            />
          </div>

          <ErrorText error={error} />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Recording GR…' : 'Create Goods Receipt'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
