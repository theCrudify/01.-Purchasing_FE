'use client'
import { CrudPage } from '@/components/crud-page'

export default function Page() {
  return (
    <CrudPage
      title="Items"
      path="/items"
      defaultSort="code:asc"
      columns={[
        { key: 'code', header: 'Code', sortable: true },
        { key: 'name', header: 'Name', sortable: true },
        { key: 'itemType', header: 'Type', sortable: true },
        { key: 'categoryName', header: 'Category', sortable: true },
        { key: 'uomCode', header: 'UoM', sortable: true },
        { key: 'isActive', header: 'Active', sortable: true, render: (r: any) => (r.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'code', label: 'Code', required: true, readOnlyOnEdit: true },
        { name: 'name', label: 'Name', required: true },
        { name: 'itemType', label: 'Type', type: 'select', required: true, options: [{ value: 'GOODS', label: 'Goods' }, { value: 'SERVICE', label: 'Service' }] },
        { name: 'categoryId', label: 'Category', type: 'lookup', required: true, lookup: { path: '/categories', label: (r) => `${r.code} — ${r.name}`, params: { isActive: 'true' } } },
        { name: 'uomId', label: 'UoM', type: 'lookup', required: true, lookup: { path: '/uoms', label: (r) => `${r.code} — ${r.name}`, params: { isActive: 'true' } } },
        { name: 'purchaseUomId', label: 'Purchase UoM', type: 'lookup', lookup: { path: '/uoms', label: (r) => `${r.code} — ${r.name}`, params: { isActive: 'true' } } },
        { name: 'packSize', label: 'Pack size (UoM per purchase UoM)', type: 'decimal' },
        { name: 'vatTaxCodeId', label: 'Default PPN', type: 'lookup', lookup: { path: '/tax-codes', label: (r) => `${r.code} — ${r.name}`, params: { isActive: 'true' } } },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'isActive', label: 'Active', type: 'checkbox' },
      ]}
    />
  )
}
