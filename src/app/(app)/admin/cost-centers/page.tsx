'use client'
import { CrudPage } from '@/components/crud-page'

export default function CostCentersPage() {
  return (
    <CrudPage
      title="Cost Centers"
      path="/cost-centers"
      defaultSort="code:asc"
      columns={[
        { key: 'code', header: 'Code', sortable: true },
        { key: 'name', header: 'Name', sortable: true },
        { key: 'isActive', header: 'Active', sortable: true, render: (r: any) => (r.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'code', label: 'Code', required: true, readOnlyOnEdit: true },
        { name: 'name', label: 'Name', required: true },
        { name: 'departmentId', label: 'Department', type: 'lookup', lookup: { path: '/departments', label: (r) => `${r.code} — ${r.name}` } },
        { name: 'isActive', label: 'Active', type: 'checkbox' },
      ]}
    />
  )
}
