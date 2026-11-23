'use client'
import { CrudPage } from '@/components/crud-page'

export default function Page() {
  return (
    <CrudPage
      title="BP Document Types"
      path="/bp-document-types"
      defaultSort="code:asc"
      columns={[
        { key: 'code', header: 'Code', sortable: true },
        { key: 'name', header: 'Name', sortable: true },
        { key: 'appliesTo', header: 'Applies to' },
        { key: 'isMandatory', header: 'Mandatory', render: (r: any) => (r.isMandatory ? 'Yes' : 'No') },
        { key: 'isActive', header: 'Active', sortable: true, render: (r: any) => (r.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'code', label: 'Code', required: true, readOnlyOnEdit: true },
        { name: 'name', label: 'Name', required: true },
        { name: 'appliesTo', label: 'Applies to', type: 'select', options: [{ value: 'ALL', label: 'All' }, { value: 'COMPANY', label: 'Company' }, { value: 'INDIVIDUAL', label: 'Individual' }] },
        { name: 'isMandatory', label: 'Mandatory', type: 'checkbox' },
        { name: 'hasExpiry', label: 'Has expiry date', type: 'checkbox' },
        { name: 'allowMultiple', label: 'Allow multiple', type: 'checkbox' },
        { name: 'isActive', label: 'Active', type: 'checkbox' },
      ]}
    />
  )
}
