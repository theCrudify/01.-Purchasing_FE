'use client'
import { CrudPage } from '@/components/crud-page'

export default function Page() {
  return (
    <CrudPage
      title="Tax Codes"
      path="/tax-codes"
      defaultSort="code:asc"
      columns={[
        { key: 'code', header: 'Code', sortable: true },
        { key: 'name', header: 'Name', sortable: true },
        { key: 'taxType', header: 'Type' },
        { key: 'ratePercent', header: 'Rate %' },
        { key: 'effectiveFrom', header: 'From', render: (r: any) => String(r.effectiveFrom ?? '').slice(0, 10) },
        { key: 'isActive', header: 'Active', sortable: true, render: (r: any) => (r.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'code', label: 'Code', required: true, readOnlyOnEdit: true },
        { name: 'name', label: 'Name', required: true },
        { name: 'taxType', label: 'Type', type: 'select', required: true, options: [{ value: 'VAT', label: 'PPN (VAT)' }, { value: 'WHT', label: 'PPh (WHT)' }] },
        { name: 'ratePercent', label: 'Rate %', type: 'decimal', required: true },
        { name: 'effectiveFrom', label: 'Effective from', type: 'date', required: true },
        { name: 'effectiveTo', label: 'Effective to', type: 'date' },
        { name: 'isActive', label: 'Active', type: 'checkbox' },
      ]}
    />
  )
}
