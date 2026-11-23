'use client'
import { useState } from 'react'
import { DataTable } from '@/components/data-table'
import { LookupSelect } from '@/components/form'
import { Badge, Button, ErrorText, Field, Modal, PageHeader, Select, Textarea, fmtDateTime } from '@/components/ui'
import { post } from '@/lib/api'
import { useCan } from '@/lib/me'
import { useList } from '@/lib/use-list'

type Reassignment = {
  id: string
  status: string
  reason: string
  remarks: string
  requestedAt: string
  decidedAt: string | null
  decisionRemarks: string | null
  fromName: string
  toName: string
  approverName: string
  requestedByName: string
  taskCount: number
}

const userLookup = { path: '/user-lookup', label: (r: any) => `${r.displayName} <${r.email}>`, params: { userType: 'INTERNAL' } }

const REASONS = [
  { value: 'RESIGNED', label: 'Resigned' },
  { value: 'TRANSFERRED', label: 'Transferred Department/Role' },
  { value: 'LEAVE', label: 'Extended Leave' },
  { value: 'WORKLOAD', label: 'Workload Rebalancing' },
  { value: 'WRONG_ASSIGNEE', label: 'Wrong Assignee' },
  { value: 'OTHER', label: 'Other Reason' },
]

export default function ReassignmentsPage() {
  const can = useCan()
  const [box, setBox] = useState<'mine' | 'to-decide' | 'all'>('mine')
  const list = useList<Reassignment>('/reassignments', 'requestedAt:desc', { box })
  const [open, setOpen] = useState(false)
  const [deciding, setDeciding] = useState<Reassignment | null>(null)
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE')
  const [decRemarks, setDecRemarks] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    fromId: '',
    toId: '',
    approverId: '',
    reason: 'WORKLOAD',
    remarks: '',
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.fromId || !form.toId || !form.approverId) {
      setError('Please select origin approver, target approver, and superior.')
      return
    }
    try {
      await post('/reassignments', form)
      setOpen(false)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const submitDecision = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deciding) return
    setError(null)
    try {
      await post(`/reassignments/${deciding.id}/decide`, {
        decision,
        remarks: decRemarks || undefined,
      })
      setDeciding(null)
      setDecRemarks('')
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Task Reassignments"
        actions={<Button onClick={() => setOpen(true)}>Request Reassignment</Button>}
      />

      <div role="tablist" className="flex gap-1 border-b">
        <button
          role="tab"
          aria-selected={box === 'to-decide'}
          onClick={() => {
            setBox('to-decide')
            list.setPage(1)
          }}
          className={`px-3 py-1.5 text-sm ${box === 'to-decide' ? 'border-b-2 border-gray-900 font-medium' : 'text-gray-500'}`}
        >
          Waiting for My Approval
        </button>
        <button
          role="tab"
          aria-selected={box === 'mine'}
          onClick={() => {
            setBox('mine')
            list.setPage(1)
          }}
          className={`px-3 py-1.5 text-sm ${box === 'mine' ? 'border-b-2 border-gray-900 font-medium' : 'text-gray-500'}`}
        >
          My Requests
        </button>
        <button
          role="tab"
          aria-selected={box === 'all'}
          onClick={() => {
            setBox('all')
            list.setPage(1)
          }}
          className={`px-3 py-1.5 text-sm ${box === 'all' ? 'border-b-2 border-gray-900 font-medium' : 'text-gray-500'}`}
        >
          All Requests
        </button>
      </div>

      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          { key: 'fromName', header: 'Current Assignee', sortable: true },
          { key: 'toName', header: 'Reassign To', sortable: true },
          { key: 'approverName', header: 'Superior', sortable: true },
          { key: 'reason', header: 'Reason', render: (r) => <Badge value={r.reason} /> },
          { key: 'taskCount', header: 'Tasks', render: (r) => r.taskCount ?? 'All' },
          { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge value={r.status} /> },
          { key: 'requestedAt', header: 'Requested', sortable: true, render: (r) => fmtDateTime(r.requestedAt) },
          {
            key: '_a',
            header: '',
            render: (r) =>
              r.status === 'PENDING' && (
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setDeciding(r)
                      setDecision('APPROVE')
                    }}
                  >
                    Decide
                  </Button>
                </div>
              ),
          },
        ]}
      />

      <Modal open={open} title="Request Task Reassignment" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Current Assignee (From)" required>
            <LookupSelect
              path={userLookup.path}
              params={userLookup.params}
              label={userLookup.label}
              value={form.fromId}
              onChange={(v) => setForm({ ...form, fromId: v ?? '' })}
            />
          </Field>

          <Field label="Target Assignee (To)" required>
            <LookupSelect
              path={userLookup.path}
              params={userLookup.params}
              label={userLookup.label}
              value={form.toId}
              onChange={(v) => setForm({ ...form, toId: v ?? '' })}
            />
          </Field>

          <Field label="Superior (Must Approve)" required>
            <LookupSelect
              path={userLookup.path}
              params={userLookup.params}
              label={userLookup.label}
              value={form.approverId}
              onChange={(v) => setForm({ ...form, approverId: v ?? '' })}
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

          <Field label="Remarks / Details" required>
            <Textarea
              rows={3}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Explain the background for moving these approval tasks..."
              required
            />
          </Field>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit Request</Button>
          </div>
        </form>
      </Modal>

      <Modal open={deciding !== null} title="Decide Reassignment Request" onClose={() => setDeciding(null)}>
        {deciding && (
          <form onSubmit={submitDecision} className="space-y-3">
            <p className="text-sm text-gray-700">
              Reassign tasks from <span className="font-semibold">{deciding.fromName}</span> to{' '}
              <span className="font-semibold">{deciding.toName}</span>.
            </p>
            <p className="text-xs text-gray-500">Remarks: {deciding.remarks}</p>

            <Field label="Decision" required>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    name="decision"
                    checked={decision === 'APPROVE'}
                    onChange={() => setDecision('APPROVE')}
                  />
                  Approve Reassignment
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    name="decision"
                    checked={decision === 'REJECT'}
                    onChange={() => setDecision('REJECT')}
                  />
                  Reject
                </label>
              </div>
            </Field>

            <Field label="Decision Remarks">
              <Textarea
                rows={2}
                value={decRemarks}
                onChange={(e) => setDecRemarks(e.target.value)}
                placeholder="Optional remarks..."
              />
            </Field>

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="secondary" onClick={() => setDeciding(null)}>
                Cancel
              </Button>
              <Button type="submit" variant={decision === 'APPROVE' ? 'primary' : 'danger'}>
                Submit Decision
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
