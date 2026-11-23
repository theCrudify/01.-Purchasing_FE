'use client'
import { useState } from 'react'
import { DataTable } from '@/components/data-table'
import { LookupSelect } from '@/components/form'
import { Badge, Button, ErrorText, Field, Modal, PageHeader, Select } from '@/components/ui'
import { del, post } from '@/lib/api'
import { useCan } from '@/lib/me'
import { useList } from '@/lib/use-list'

type Mapping = {
  id: number
  docType: string
  stepCode: string
  preparerId: string
  preparerName: string
  approverId: string
  approverName: string
  isActive: boolean
}

const userLookup = { path: '/user-lookup', label: (r: any) => `${r.displayName} <${r.email}>`, params: { userType: 'INTERNAL' } }

export default function ApproverMappingsPage() {
  const can = useCan()
  const [docType, setDocType] = useState('')
  const list = useList<Mapping>('/approvals/mappings', 'preparerName:asc', { docType: docType || undefined })
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<{
    preparerId: string
    approverId: string
    docType: string
    stepCode: string
  }>({
    preparerId: '',
    approverId: '',
    docType: 'PR',
    stepCode: 'AP',
  })

  const manage = can('APPROVAL.CONFIG')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.preparerId || !form.approverId) {
      setError('Please select both preparer and approver.')
      return
    }
    try {
      await post('/approvals/mappings', form)
      setOpen(false)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Remove this mapping?')) return
    setError(null)
    try {
      await del(`/approvals/mappings/${id}`)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Approver Mappings"
        actions={manage && <Button onClick={() => setOpen(true)}>Add Mapping</Button>}
      />
      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          { key: 'preparerName', header: 'Preparer', sortable: true },
          { key: 'approverName', header: 'Approver', sortable: true },
          { key: 'docType', header: 'Doc Type', sortable: true, render: (r) => <Badge value={r.docType} /> },
          { key: 'stepCode', header: 'Step Code', sortable: true, render: (r) => <Badge value={r.stepCode} /> },
          { key: 'isActive', header: 'Active', render: (r) => (r.isActive ? 'Yes' : 'No') },
          {
            key: '_a',
            header: '',
            render: (r) =>
              manage && (
                <div className="flex justify-end">
                  <Button variant="ghost" className="text-red-600" onClick={() => remove(r.id)}>
                    Remove
                  </Button>
                </div>
              ),
          },
        ]}
        actions={
          <Select
            className="w-36"
            aria-label="Filter document type"
            value={docType}
            onChange={(e) => {
              setDocType(e.target.value)
              list.setPage(1)
            }}
          >
            <option value="">All Doc Types</option>
            {['PR', 'RFQ', 'QUO', 'CTR', 'PO', 'GR', 'SVR'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        }
      />

      <Modal open={open} title="Add Approver Mapping" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Preparer (Requester)" required>
            <LookupSelect
              path={userLookup.path}
              params={userLookup.params}
              label={userLookup.label}
              value={form.preparerId}
              onChange={(v) => setForm({ ...form, preparerId: v ?? '' })}
            />
          </Field>

          <Field label="Designated Approver" required>
            <LookupSelect
              path={userLookup.path}
              params={userLookup.params}
              label={userLookup.label}
              value={form.approverId}
              onChange={(v) => setForm({ ...form, approverId: v ?? '' })}
            />
          </Field>

          <Field label="Document Type" required>
            <Select value={form.docType} onChange={(e) => setForm({ ...form, docType: e.target.value })}>
              {['PR', 'RFQ', 'QUO', 'CTR', 'PO', 'GR', 'SVR'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>

          <Field label="Step Code" required>
            <Select value={form.stepCode} onChange={(e) => setForm({ ...form, stepCode: e.target.value })}>
              <option value="CH">Check (CH)</option>
              <option value="AC">Acknowledge (AC)</option>
              <option value="AP">Approve (AP)</option>
              <option value="RE">Review (RE)</option>
              <option value="CL">Close / Settle (CL)</option>
            </Select>
          </Field>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Mapping</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
