'use client'
import { CrudPage } from '@/components/crud-page'

export default function Page() {
  return (
    <CrudPage
      title="Currencies"
      path="/currencies"
      defaultSort="code:asc"
      keyField="code"
      allowCreate={false}
      softDelete={false}
      perms={{ manage: 'FX.MANAGE' }}
      columns={[
        { key: 'code', header: 'Code', sortable: true },
        { key: 'name', header: 'Name', sortable: true },
        { key: 'symbol', header: 'Symbol' },
        { key: 'decimals', header: 'Decimals' },
        { key: 'isActive', header: 'Active', sortable: true, render: (r: any) => (r.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'symbol', label: 'Symbol' },
        { name: 'isActive', label: 'Active', type: 'checkbox' },
      ]}
    />
  )
}
