'use client'
import { useState } from 'react'
import { DataTable } from '@/components/data-table'
import { AutoForm, type FieldDef } from '@/components/form'
import { Button, Modal, PageHeader, fmtDate } from '@/components/ui'
import { patch, post } from '@/lib/api'
import { useCan } from '@/lib/me'
import { useList } from '@/lib/use-list'

type E = { id: string; displayName: string; email: string; employeeNo: string; departmentId: number; departmentName: string; jobTitle: string | null; superiorId: string | null; superiorName: string | null; joinDate: string | null; endDate: string | null; endReason: string | null; isActive: boolean }

const userLookup = { path: '/user-lookup', label: (r: any) => `${r.displayName} <${r.email}>`, params: { userType: 'INTERNAL' } }
const fields: FieldDef[] = [
  { name: 'userId', label: 'User', type: 'lookup', required: true, createOnly: true, lookup: userLookup },
  { name: 'employeeNo', label: 'Employee no. (NIK)', required: true },
  { name: 'departmentId', label: 'Department', type: 'lookup', required: true, lookup: { path: '/departments', label: (r) => `${r.code} — ${r.name}`, params: { isActive: 'true' } } },
  { name: 'jobTitle', label: 'Job title' },
  { name: 'superiorId', label: 'Superior (approval chain)', type: 'lookup', lookup: userLookup },
  { name: 'joinDate', label: 'Join date', type: 'date' },
  { name: 'endDate', label: 'End date', type: 'date' },
  { name: 'endReason', label: 'End reason', type: 'select', options: ['RESIGNED', 'TERMINATED', 'RETIRED', 'TRANSFERRED', 'DECEASED'].map((v) => ({ value: v, label: v })) },
  { name: 'isActive', label: 'Active', type: 'checkbox' },
]

export default function EmployeesPage() {
  const can = useCan()
  const list = useList<E>('/employees', 'displayName:asc')
  const [editing, setEditing] = useState<E | 'new' | null>(null)
  return (
    <div>
      <PageHeader title="Employees" actions={can('USER.MANAGE') && <Button onClick={() => setEditing('new')}>Add</Button>} />
      <DataTable list={list} columns={[
        { key: 'employeeNo', header: 'NIK', sortable: true },
        { key: 'displayName', header: 'Name', sortable: true },
        { key: 'departmentName', header: 'Department', sortable: true },
        { key: 'jobTitle', header: 'Job title' },
        { key: 'superiorName', header: 'Superior' },
        { key: 'joinDate', header: 'Joined', sortable: true, render: (r) => fmtDate(r.joinDate) },
        { key: 'isActive', header: 'Active', sortable: true, render: (r) => (r.isActive ? 'Yes' : 'No') },
        { key: '_a', header: '', render: (r) => can('USER.MANAGE') && <Button variant="ghost" onClick={() => setEditing(r)}>Edit</Button> },
      ]} />
      <Modal open={editing !== null} title={editing === 'new' ? 'New employee' : 'Edit employee'} onClose={() => setEditing(null)}>
        <AutoForm fields={fields} editing={editing !== 'new'} initial={editing && editing !== 'new' ? editing : { isActive: true }}
          onSubmit={async (v) => {
            if (editing === 'new') await post('/employees', v); else await patch(`/employees/${(editing as E).id}`, v)
            setEditing(null); list.reload()
          }} />
      </Modal>
    </div>
  )
}
