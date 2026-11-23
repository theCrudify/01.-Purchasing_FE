'use client'
import { CrudPage } from '@/components/crud-page'

export default function Page() {
  return (
    <CrudPage
      title="Payment Terms"
      path="/payment-terms"
      defaultSort="code:asc"
      columns={[
        { key: 'code', header: 'Code', sortable: true },
        { key: 'name', header: 'Name', sortable: true },
        { key: 'dueDays', header: 'Due days' },
        { key: 'isActive', header: 'Active', sortable: true, render: (r: any) => (r.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'code', label: 'Code', required: true, readOnlyOnEdit: true },
        { name: 'name', label: 'Name', required: true },
        { name: 'dueDays', label: 'Due days', type: 'number', required: true },
        { name: 'baselineDate', label: 'Baseline', type: 'select', options: [{ value: 'INVOICE_DATE', label: 'Invoice date' }, { value: 'RECEIPT_DATE', label: 'Receipt date' }] },
        { name: 'isActive', label: 'Active', type: 'checkbox' },
      ]}
    />
  )
}
