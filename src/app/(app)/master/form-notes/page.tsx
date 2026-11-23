'use client'
import { CrudPage } from '@/components/crud-page'

export default function Page() {
  return (
    <CrudPage
      title="Form Notes"
      path="/form-notes"
      defaultSort="docType:asc"
      columns={[
        { key: 'docType', header: 'Document', sortable: true },
        { key: 'userName', header: 'User' },
        { key: 'body', header: 'Note' },
        { key: 'isActive', header: 'Active', sortable: true, render: (r: any) => (r.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'docType', label: 'Document type', type: 'select', required: true, options: ['PR', 'RFQ', 'CTR', 'PO'].map((v) => ({ value: v, label: v })) },
        { name: 'userId', label: 'Only for user (empty = everyone)', type: 'lookup', lookup: { path: '/user-lookup', label: (r) => `${r.displayName} <${r.email}>` } },
        { name: 'body', label: 'Note', type: 'textarea', required: true },
        { name: 'isActive', label: 'Active', type: 'checkbox' },
      ]}
    />
  )
}
