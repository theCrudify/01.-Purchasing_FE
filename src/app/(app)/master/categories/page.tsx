'use client'
import { CrudPage } from '@/components/crud-page'

export default function Page() {
  return (
    <CrudPage
      title="Categories"
      path="/categories"
      defaultSort="code:asc"
      columns={[
        { key: 'code', header: 'Code', sortable: true },
        { key: 'name', header: 'Name', sortable: true },
        { key: 'parentCode', header: 'Parent' },
        { key: 'isActive', header: 'Active', sortable: true, render: (r: any) => (r.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'code', label: 'Code', required: true, readOnlyOnEdit: true },
        { name: 'name', label: 'Name', required: true },
        { name: 'parentId', label: 'Parent', type: 'lookup', lookup: { path: '/categories', label: (r) => `${r.code} — ${r.name}` } },
        { name: 'isActive', label: 'Active', type: 'checkbox' },
      ]}
    />
  )
}
