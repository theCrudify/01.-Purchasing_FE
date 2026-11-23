'use client'
import { useState } from 'react'
import { DataTable } from '@/components/data-table'
import { LookupSelect } from '@/components/form'
import { Badge, Button, ErrorText, Field, Input, Modal, PageHeader, Select, Textarea, fmtDate, fmtDateTime } from '@/components/ui'
import { api, post } from '@/lib/api'
import { useCan } from '@/lib/me'
import { useList } from '@/lib/use-list'

type Handover = {
  id: number
  reason: string
  effectiveDate: string
  status: string
  remarks: string | null
  executedAt: string
  executedByName: string
  fromName: string
  toName: string
  documentsTransferred: number
  mappingsTransferred: number
  picRolesTransferred: number
  orgRolesTransferred: number
}

const userLookup = { path: '/user-lookup', label: (r: any) => `${r.displayName} <${r.email}>`, params: { userType: 'INTERNAL' } }

const REASONS = [
  { value: 'RESIGNED', label: 'Resigned' },
  { value: 'TERMINATED', label: 'Terminated' },
  { value: 'RETIRED', label: 'Retired' },
  { value: 'TRANSFERRED', label: 'Transferred Department/Unit' },
  { value: 'LEAVE', label: 'Extended Sabbatical / Leave' },
]

export default function HandoversPage() {
  const can = useCan()
  const list = useList<Handover>('/handovers', 'executedAt:desc')
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<Handover | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    fromId: '',
    toId: '',
    reason: 'TRANSFERRED',
    effectiveDate: new Date().toISOString().slice(0, 10),
    remarks: '',
    approverId: '',
  })

  const manage = can('HANDOVER.MANAGE')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.fromId || !form.toId) {
      setError('Please select both the outgoing employee and the successor.')
      return
    }
    if (form.fromId === form.toId) {
      setError('Origin and target user must be different.')
      return
    }
    try {
      await post('/handovers', {
        ...form,
        approverId: form.approverId || undefined,
        remarks: form.remarks || undefined,
      })
      setOpen(false)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="User Work Handover"
        actions={manage && <Button onClick={() => setOpen(true)}>Execute Handover</Button>}
      />

      <p className="text-sm text-gray-600">
        Executes complete transfer of ownership: draft/open documents, approver mappings, and business partner PIC roles
        from an outgoing user to their designated replacement.
      </p>

      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          { key: 'fromName', header: 'Outgoing User (From)', sortable: true },
          { key: 'toName', header: 'Successor (To)', sortable: true },
          { key: 'reason', header: 'Reason', render: (r) => <Badge value={r.reason} /> },
          { key: 'effectiveDate', header: 'Effective Date', sortable: true, render: (r) => fmtDate(r.effectiveDate) },
          { key: 'executedByName', header: 'Executed By' },
          { key: 'executedAt', header: 'Executed At', sortable: true, render: (r) => fmtDateTime(r.executedAt) },
          {
            key: '_summary',
            header: 'Transferred',
            render: (r) => (
              <span className="text-xs text-gray-600">
                Docs: <strong>{r.documentsTransferred}</strong>, Maps: <strong>{r.mappingsTransferred}</strong>, PICs:{' '}
                <strong>{r.picRolesTransferred}</strong>
              </span>
            ),
          },
          {
            key: '_a',
            header: '',
            render: (r) => (
              <div className="flex justify-end">
                <Button variant="ghost" onClick={() => setDetail(r)}>
                  Details
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Modal open={open} title="Execute User Handover" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Outgoing User (From)" required>
            <LookupSelect
              path={userLookup.path}
              params={userLookup.params}
              label={userLookup.label}
              value={form.fromId}
              onChange={(v) => setForm({ ...form, fromId: v ?? '' })}
            />
          </Field>

          <Field label="Successor (To)" required>
            <LookupSelect
              path={userLookup.path}
              params={userLookup.params}
              label={userLookup.label}
              value={form.toId}
              onChange={(v) => setForm({ ...form, toId: v ?? '' })}
            />
          </Field>

          <Field label="Reason" required>
            <Select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Effective Date" required>
            <Input
              type="date"
              value={form.effectiveDate}
              onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
              required
            />
          </Field>

          <Field label="Superior for Pending Approvals (Optional)">
            <LookupSelect
              path={userLookup.path}
              params={userLookup.params}
              label={userLookup.label}
              value={form.approverId}
              onChange={(v) => setForm({ ...form, approverId: v ?? '' })}
            />
            <p className="mt-1 text-xs text-gray-500">
              If the outgoing user has open pending approvals, this superior will approve reassigning them.
            </p>
          </Field>

          <Field label="Handover Remarks">
            <Textarea
              rows={2}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="e.g. Handover reference doc #102..."
            />
          </Field>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Run Handover</Button>
          </div>
        </form>
      </Modal>

      <Modal open={detail !== null} title="Handover Summary" onClose={() => setDetail(null)}>
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="rounded border bg-gray-50 p-3">
              <p className="text-gray-500">Transfer Execution</p>
              <p className="font-semibold text-gray-900">
                {detail.fromName} → {detail.toName}
              </p>
              <p className="text-xs text-gray-600">
                Reason: {detail.reason} • Effective: {fmtDate(detail.effectiveDate)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded border p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{detail.documentsTransferred}</p>
                <p className="text-xs text-gray-500">Documents Transferred</p>
              </div>
              <div className="rounded border p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{detail.mappingsTransferred}</p>
                <p className="text-xs text-gray-500">Approver Mappings</p>
              </div>
              <div className="rounded border p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{detail.picRolesTransferred}</p>
                <p className="text-xs text-gray-500">BP PIC Roles</p>
              </div>
              <div className="rounded border p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{detail.orgRolesTransferred}</p>
                <p className="text-xs text-gray-500">Org Roles Transferred</p>
              </div>
            </div>

            {detail.remarks && (
              <p className="text-xs text-gray-600">
                <strong>Remarks:</strong> {detail.remarks}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setDetail(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
