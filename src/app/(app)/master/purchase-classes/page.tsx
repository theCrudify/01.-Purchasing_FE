'use client'
import { CrudPage } from '@/components/crud-page'

export default function Page() {
  return (
    <CrudPage
      title="Purchase Classes"
      path="/purchase-classes"
      defaultSort="code:asc"
      columns={[
        { key: 'code', header: 'Code', sortable: true },
        { key: 'name', header: 'Name', sortable: true },
        { key: 'isAsset', header: 'Asset', render: (r: any) => (r.isAsset ? 'Yes' : 'No') },
        { key: 'invoicePriceTolerancePct', header: 'Price tolerance %' },
        { key: 'isActive', header: 'Active', sortable: true, render: (r: any) => (r.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'code', label: 'Code', required: true, readOnlyOnEdit: true },
        { name: 'name', label: 'Name', required: true },
        { name: 'isAsset', label: 'Fixed asset purchase', type: 'checkbox' },
        { name: 'invoicePriceTolerancePct', label: 'Invoice price tolerance %', type: 'decimal' },
        { name: 'isActive', label: 'Active', type: 'checkbox' },
      ]}
    />
  )
}
