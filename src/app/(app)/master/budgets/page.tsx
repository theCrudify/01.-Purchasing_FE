'use client'
import { CrudPage } from '@/components/crud-page'
import { fmtMoney } from '@/components/ui'

export default function Page() {
  return (
    <CrudPage
      title="Budgets"
      path="/budgets"
      defaultSort="fiscalYear:desc"
      perms={{ manage: 'BUDGET.MANAGE', del: 'MASTER.DELETE', viewDeleted: 'MASTER.VIEW_DELETED' }}
      columns={[
        { key: 'fiscalYear', header: 'Year', sortable: true },
        { key: 'departmentName', header: 'Department', sortable: true },
        { key: 'purchaseClassName', header: 'Purchase class' },
        { key: 'amount', header: 'Amount (IDR)', render: (r: any) => fmtMoney(r.amount) },
        { key: 'available', header: 'Available', render: (r: any) => (r.consumption ? fmtMoney(r.consumption.available) : '—') },
        { key: 'controlMode', header: 'Mode' },
        { key: 'isActive', header: 'Active', sortable: true, render: (r: any) => (r.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'fiscalYear', label: 'Fiscal year', type: 'number', required: true },
        { name: 'departmentId', label: 'Department', type: 'lookup', required: true, lookup: { path: '/departments', label: (r) => `${r.code} — ${r.name}`, params: { isActive: 'true' } } },
        { name: 'purchaseClassId', label: 'Purchase class (empty = all)', type: 'lookup', lookup: { path: '/purchase-classes', label: (r) => `${r.code} — ${r.name}`, params: { isActive: 'true' } } },
        { name: 'amount', label: 'Amount (IDR, before VAT)', type: 'decimal', required: true },
        { name: 'controlMode', label: 'Control', type: 'select', options: [{ value: 'BLOCK', label: 'Block when exceeded' }, { value: 'WARN', label: 'Warn only' }] },
        { name: 'remarks', label: 'Remarks', type: 'textarea' },
        { name: 'isActive', label: 'Active', type: 'checkbox' },
      ]}
    />
  )
}
