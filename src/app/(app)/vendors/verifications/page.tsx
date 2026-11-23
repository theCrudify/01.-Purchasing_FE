'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Eye, Plus, Send } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { LookupSelect } from '@/components/form'
import { Badge, Button, ErrorText, Field, Input, Modal, PageHeader, Select, Textarea, fmtDate } from '@/components/ui'
import { post } from '@/lib/api'
import { useList } from '@/lib/use-list'

type SvrRow = {
  id: string
  docNo: string | null
  docDate: string
  status: string
  title: string
  bpCode: string | null
  bpName: string
  requestType: string
  ownerName: string
}

export default function SupplierVerificationsPage() {
  const [status, setStatus] = useState('')
  const list = useList<SvrRow>('/verifications', 'createdAt:desc', { status: status || undefined })
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    bpId: '',
    requestType: 'ONBOARDING',
    title: '',
    remarks: '',
  })

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.bpId) {
      setError('Please select a vendor / business partner.')
      return
    }
    try {
      await post('/verifications', form)
      setOpen(false)
      setForm({ bpId: '', requestType: 'ONBOARDING', title: '', remarks: '' })
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const submitDoc = async (id: string) => {
    setError(null)
    try {
      await post(`/verifications/${id}/submit`)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Supplier Verifications (SVR)"
        subtitle="Onboarding, legal document review, and compliance verification workflows for business partners."
        actions={
          <Link href="/vendors/verifications/new"><Button>
            <Plus className="h-4 w-4" />
            <span>New Verification (SVR)</span>
          </Button></Link>
        }
      />

      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          {
            key: 'docNo',
            header: 'Document No',
            sortable: true,
            render: (r) => (
              <Link className="font-semibold text-brand-600 hover:underline" href={`/vendors/verifications/${r.id}`}>
                {r.docNo ?? '(Draft)'}
              </Link>
            ),
          },
          { key: 'title', header: 'Title' },
          {
            key: 'bpName',
            header: 'Vendor',
            sortable: true,
            render: (r) => (
              <div>
                <div className="font-medium text-gray-900">{r.bpName}</div>
                <div className="font-mono text-xs text-gray-500">{r.bpCode}</div>
              </div>
            ),
          },
          { key: 'requestType', header: 'Request Type', render: (r) => <Badge value={r.requestType} /> },
          { key: 'docDate', header: 'Date', sortable: true, render: (r) => fmtDate(r.docDate) },
          { key: 'ownerName', header: 'Created By' },
          { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge value={r.status} /> },
          {
            key: '_a',
            header: 'Actions',
            render: (r) => (
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/vendors/verifications/${r.id}`}
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
            {['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REVISION_REQUIRED', 'REJECTED'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        }
      />

      <Modal open={open} title="Create Supplier Verification (SVR)" onClose={() => setOpen(false)}>
        <form onSubmit={create} className="space-y-4">
          <Field label="Vendor / Business Partner" required>
            <LookupSelect
              path="/vendors"
              value={form.bpId}
              label={(r) => `${r.bpCode ?? ''} — ${r.legalName}`}
              onChange={(v, r) =>
                setForm({
                  ...form,
                  bpId: v ?? '',
                  title: form.title || (r ? `Onboarding Verification — ${r.legalName}` : ''),
                })
              }
            />
          </Field>

          <Field label="Verification Type" required>
            <Select value={form.requestType} onChange={(e) => setForm({ ...form, requestType: e.target.value })}>
              <option value="ONBOARDING">ONBOARDING (New Vendor Registration)</option>
              <option value="REVERIFICATION">REVERIFICATION (Periodic Audit)</option>
              <option value="PROFILE_UPDATE">PROFILE_UPDATE (Legal / Tax Data Change)</option>
              <option value="BANK_CHANGE">BANK_CHANGE (Bank Account Verification)</option>
            </Select>
          </Field>

          <Field label="Document Title" required>
            <Input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Onboarding Verification — PT Mitra Abadi"
            />
          </Field>

          <Field label="Remarks / Scope of Review">
            <Textarea
              rows={3}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Notes on NPWP, NIB, SPPKP, and bank account verification..."
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create SVR Document</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
