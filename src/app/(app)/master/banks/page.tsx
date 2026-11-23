'use client'
import { CrudPage } from '@/components/crud-page'

export default function Page() {
  return (
    <CrudPage
      title="Banks"
      path="/banks"
      defaultSort="code:asc"
      columns={[
        { key: 'code', header: 'Code', sortable: true },
        { key: 'name', header: 'Name', sortable: true },
        { key: 'swiftCode', header: 'SWIFT', sortable: true },
        { key: 'isActive', header: 'Active', sortable: true, render: (r: any) => (r.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'code', label: 'Code', required: true, readOnlyOnEdit: true },
        { name: 'name', label: 'Name', required: true },
        { name: 'swiftCode', label: 'SWIFT / BIC' },
        { name: 'isActive', label: 'Active', type: 'checkbox' },
      ]}
    />
  )
}
