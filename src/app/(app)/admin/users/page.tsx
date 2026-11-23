'use client'
import Link from 'next/link'
import { useState } from 'react'
import { DataTable } from '@/components/data-table'
import { AutoForm } from '@/components/form'
import { Badge, Button, Modal, PageHeader, Select, fmtDateTime } from '@/components/ui'
import { post } from '@/lib/api'
import { useCan } from '@/lib/me'
import { useList } from '@/lib/use-list'

type U = { id: string; email: string; displayName: string; userType: string; status: string; roles: string | null; departmentName: string | null; lastLoginAt: string | null }

export default function UsersPage() {
  const can = useCan()
  const [userType, setUserType] = useState(''), [status, setStatus] = useState('')
  const list = useList<U>('/users', 'displayName:asc', { userType: userType || undefined, status: status || undefined })
  const [open, setOpen] = useState(false)
  return (
    <div>
      <PageHeader title="Users" actions={can('USER.MANAGE') && <Button onClick={() => setOpen(true)}>Invite user</Button>} />
      <DataTable list={list} columns={[
        { key: 'displayName', header: 'Name', sortable: true, render: (r) => <Link className="underline" href={`/admin/users/${r.id}`}>{r.displayName}</Link> },
        { key: 'email', header: 'Email', sortable: true },
        { key: 'userType', header: 'Type', sortable: true },
        { key: 'departmentName', header: 'Department' },
        { key: 'roles', header: 'Roles' },
        { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge value={r.status} /> },
        { key: 'lastLoginAt', header: 'Last login', sortable: true, render: (r) => fmtDateTime(r.lastLoginAt) },
      ]} actions={<div className="flex gap-2">
        <Select className="w-32" aria-label="User type" value={userType} onChange={(e) => { setUserType(e.target.value); list.setPage(1) }}><option value="">All types</option><option>INTERNAL</option><option>BP</option></Select>
        <Select className="w-44" aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); list.setPage(1) }}><option value="">All statuses</option>{['ACTIVE', 'PENDING_ACTIVATION', 'LOCKED', 'DISABLED'].map((s) => <option key={s}>{s}</option>)}</Select>
      </div>} />
      <Modal open={open} title="Invite internal user" onClose={() => setOpen(false)}>
        <p className="mb-3 text-sm text-gray-600">The user receives an e-mail with a code to set their own password.</p>
        <AutoForm fields={[
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'displayName', label: 'Name', required: true },
          { name: 'phone', label: 'Phone' },
        ]} onSubmit={async (v) => { await post('/users', v); setOpen(false); list.reload() }} submitLabel="Send invitation" />
      </Modal>
    </div>
  )
}
