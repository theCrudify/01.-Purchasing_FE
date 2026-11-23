'use client'
import { useState } from 'react'
import { DataTable } from '@/components/data-table'
import { LookupSelect } from '@/components/form'
import { Badge, Button, ErrorText, Field, Input, Modal, PageHeader, Select, Textarea, fmtDateTime } from '@/components/ui'
import { del, post } from '@/lib/api'
import { useCan, useMe } from '@/lib/me'
import { useList } from '@/lib/use-list'

type Delegation = {
  id: number
  fromId: string
  fromName: string
  toId: string
  toName: string
  docType: string | null
  startsAt: string
  endsAt: string
  reason: string | null
  revokedAt: string | null
  isCurrent: boolean
}

type Backup = {
  id: number
  approverId: string
  approverName: string
  backupId: string
  backupName: string
  notes: string | null
  isActive: boolean
}

const userLookup = { path: '/user-lookup', label: (r: any) => `${r.displayName} <${r.email}>`, params: { userType: 'INTERNAL' } }

function DelegationsTab() {
  const me = useMe()
  const can = useCan()
  const list = useList<Delegation>('/approvals/delegations', 'startsAt:desc')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    fromId: '',
    toId: '',
    docType: '',
    startsAt: new Date().toISOString().slice(0, 16),
    endsAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    reason: '',
  })

  const revoke = async (id: number) => {
    if (!confirm('Revoke this delegation immediately?')) return
    try {
      await post(`/approvals/delegations/${id}/revoke`)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.toId) {
      setError('Please select a delegate.')
      return
    }
    try {
      await post('/approvals/delegations', {
        fromId: form.fromId || undefined,
        toId: form.toId,
        docType: form.docType || null,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        reason: form.reason || undefined,
      })
      setOpen(false)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Temporary delegations forward pending approval tasks during leave or unavailability.
        </p>
        <Button onClick={() => setOpen(true)}>Delegate Approvals</Button>
      </div>
      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          { key: 'fromName', header: 'From (Approver)', sortable: true },
          { key: 'toName', header: 'Delegated To', sortable: true },
          { key: 'docType', header: 'Scope', render: (r) => (r.docType ? <Badge value={r.docType} /> : 'All Types') },
          { key: 'startsAt', header: 'Starts', sortable: true, render: (r) => fmtDateTime(r.startsAt) },
          { key: 'endsAt', header: 'Ends', sortable: true, render: (r) => fmtDateTime(r.endsAt) },
          {
            key: 'status',
            header: 'Status',
            render: (r) =>
              r.revokedAt ? (
                <Badge value="REVOKED" />
              ) : r.isCurrent ? (
                <Badge value="ACTIVE" />
              ) : (
                <Badge value="SCHEDULED" />
              ),
          },
          { key: 'reason', header: 'Reason' },
          {
            key: '_a',
            header: '',
            render: (r) =>
              !r.revokedAt &&
              r.isCurrent && (
                <Button variant="ghost" className="text-red-600" onClick={() => revoke(r.id)}>
                  Revoke
                </Button>
              ),
          },
        ]}
      />

      <Modal open={open} title="Create Approval Delegation" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-3">
          {can('APPROVAL.CONFIG') && (
            <Field label="Delegate From (Admin Override)">
              <LookupSelect
                path={userLookup.path}
                params={userLookup.params}
                label={userLookup.label}
                value={form.fromId}
                initialLabel={me?.displayName ?? undefined}
                onChange={(v) => setForm({ ...form, fromId: v ?? '' })}
              />
            </Field>
          )}

          <Field label="Delegate To" required>
            <LookupSelect
              path={userLookup.path}
              params={userLookup.params}
              label={userLookup.label}
              value={form.toId}
              onChange={(v) => setForm({ ...form, toId: v ?? '' })}
            />
          </Field>

          <Field label="Document Type Scope">
            <Select value={form.docType} onChange={(e) => setForm({ ...form, docType: e.target.value })}>
              <option value="">All Document Types</option>
              {['PR', 'RFQ', 'QUO', 'CTR', 'PO', 'GR', 'SVR'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts At" required>
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                required
              />
            </Field>
            <Field label="Ends At" required>
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                required
              />
            </Field>
          </div>

          <Field label="Reason / Remarks">
            <Textarea
              rows={2}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Annual leave, out of office"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Activate Delegation</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function BackupsTab() {
  const can = useCan()
  const list = useList<Backup>('/approvals/backups', 'approverName:asc')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ approverId: '', backupId: '', notes: '' })

  const remove = async (id: number) => {
    if (!confirm('Remove this backup approver?')) return
    try {
      await del(`/approvals/backups/${id}`)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.approverId || !form.backupId) {
      setError('Select both approver and backup user.')
      return
    }
    try {
      await post('/approvals/backups', form)
      setOpen(false)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Permanent standing backup approvers who can act on approval tasks when the primary approver is away.
        </p>
        <Button onClick={() => setOpen(true)}>Add Backup</Button>
      </div>
      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          { key: 'approverName', header: 'Approver', sortable: true },
          { key: 'backupName', header: 'Backup Approver', sortable: true },
          { key: 'notes', header: 'Notes' },
          { key: 'isActive', header: 'Active', render: (r) => (r.isActive ? 'Yes' : 'No') },
          {
            key: '_a',
            header: '',
            render: (r) => (
              <Button variant="ghost" className="text-red-600" onClick={() => remove(r.id)}>
                Remove
              </Button>
            ),
          },
        ]}
      />

      <Modal open={open} title="Add Backup Approver" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Primary Approver" required>
            <LookupSelect
              path={userLookup.path}
              params={userLookup.params}
              label={userLookup.label}
              value={form.approverId}
              onChange={(v) => setForm({ ...form, approverId: v ?? '' })}
            />
          </Field>

          <Field label="Backup Approver" required>
            <LookupSelect
              path={userLookup.path}
              params={userLookup.params}
              label={userLookup.label}
              value={form.backupId}
              onChange={(v) => setForm({ ...form, backupId: v ?? '' })}
            />
          </Field>

          <Field label="Notes">
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Co-lead backup"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Backup</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default function DelegationsPage() {
  const [tab, setTab] = useState<'delegations' | 'backups'>('delegations')

  return (
    <div className="space-y-4">
      <PageHeader title="Approval Delegations & Backups" />
      <div role="tablist" className="flex gap-1 border-b">
        <button
          role="tab"
          aria-selected={tab === 'delegations'}
          onClick={() => setTab('delegations')}
          className={`px-3 py-1.5 text-sm ${tab === 'delegations' ? 'border-b-2 border-gray-900 font-medium' : 'text-gray-500'}`}
        >
          Active Delegations
        </button>
        <button
          role="tab"
          aria-selected={tab === 'backups'}
          onClick={() => setTab('backups')}
          className={`px-3 py-1.5 text-sm ${tab === 'backups' ? 'border-b-2 border-gray-900 font-medium' : 'text-gray-500'}`}
        >
          Standing Backups
        </button>
      </div>

      {tab === 'delegations' ? <DelegationsTab /> : <BackupsTab />}
    </div>
  )
}
