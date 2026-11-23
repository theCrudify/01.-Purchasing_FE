'use client'
import Link from 'next/link'
import { CrudPage } from '@/components/crud-page'

export default function RolesPage() {
  return (
    <CrudPage
      title="Roles"
      path="/roles"
      defaultSort="code:asc"
      perms={{ manage: 'ROLE.MANAGE', del: 'ROLE.MANAGE', viewDeleted: 'MASTER.VIEW_DELETED' }}
      columns={[
        { key: 'code', header: 'Code', sortable: true, render: (r: any) => <Link className="underline" href={`/admin/roles/${r.id}`}>{r.code}</Link> },
        { key: 'name', header: 'Name', sortable: true },
        { key: 'scope', header: 'Scope', sortable: true },
        { key: 'isActive', header: 'Active', render: (r: any) => (r.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'code', label: 'Code', required: true, createOnly: true },
        { name: 'name', label: 'Name', required: true },
        { name: 'scope', label: 'Scope', type: 'select', required: true, createOnly: true, options: [{ value: 'INTERNAL', label: 'Internal staff' }, { value: 'BP', label: 'Vendor portal' }] },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'isActive', label: 'Active', type: 'checkbox' },
      ]}
    />
  )
}
