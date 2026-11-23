'use client'
import Link from 'next/link'
import { CrudPage } from '@/components/crud-page'
import type { Column } from '@/components/data-table'
import type { FieldDef } from '@/components/form'
import { Badge, fmtDate, fmtMoney } from '@/components/ui'

type Tpl = {
  id: number
  code: string
  name: string
  docType: string
  priority: number
  minAmountBase: string | null
  maxAmountBase: string | null
  departmentId: number | null
  purchaseClassId: number | null
  effectiveFrom: string
  effectiveTo: string | null
  isActive: boolean
}

const columns: Column<Tpl>[] = [
  {
    key: 'code',
    header: 'Code',
    sortable: true,
    render: (r) => (
      <Link className="font-medium underline hover:text-blue-600" href={`/settings/approval-templates/${r.id}`}>
        {r.code}
      </Link>
    ),
  },
  { key: 'name', header: 'Name', sortable: true },
  { key: 'docType', header: 'Doc Type', sortable: true, render: (r) => <Badge value={r.docType} /> },
  { key: 'priority', header: 'Priority', sortable: true },
  {
    key: 'range',
    header: 'Amount Range',
    render: (r) =>
      r.minAmountBase || r.maxAmountBase
        ? `${r.minAmountBase ? fmtMoney(r.minAmountBase, 'IDR') : '0'} – ${r.maxAmountBase ? fmtMoney(r.maxAmountBase, 'IDR') : '∞'}`
        : 'Any',
  },
  {
    key: 'validity',
    header: 'Validity',
    render: (r) => `${fmtDate(r.effectiveFrom)}${r.effectiveTo ? ` – ${fmtDate(r.effectiveTo)}` : ''}`,
  },
  { key: 'isActive', header: 'Active', sortable: true, render: (r) => (r.isActive ? 'Yes' : 'No') },
]

const fields: FieldDef[] = [
  { name: 'code', label: 'Code', required: true, createOnly: true },
  { name: 'name', label: 'Name', required: true },
  {
    name: 'docType',
    label: 'Document Type',
    type: 'select',
    required: true,
    options: ['PR', 'RFQ', 'QUO', 'CTR', 'PO', 'GR', 'SVR'].map((v) => ({ value: v, label: v })),
  },
  { name: 'priority', label: 'Priority (lower runs first)', type: 'number' },
  { name: 'minAmountBase', label: 'Min Amount (IDR Base)', type: 'decimal' },
  { name: 'maxAmountBase', label: 'Max Amount (IDR Base)', type: 'decimal' },
  {
    name: 'departmentId',
    label: 'Department (optional filter)',
    type: 'lookup',
    lookup: { path: '/departments', label: (r) => `${r.code} — ${r.name}`, params: { isActive: 'true' } },
  },
  {
    name: 'purchaseClassId',
    label: 'Purchase Class (optional filter)',
    type: 'lookup',
    lookup: { path: '/purchase-classes', label: (r) => `${r.code} — ${r.name}`, params: { isActive: 'true' } },
  },
  { name: 'effectiveFrom', label: 'Effective From', type: 'date', required: true },
  { name: 'effectiveTo', label: 'Effective To', type: 'date' },
  { name: 'isActive', label: 'Active', type: 'checkbox' },
]

export default function ApprovalTemplatesPage() {
  return (
    <CrudPage<Tpl>
      title="Approval Templates"
      path="/approval-templates"
      columns={columns}
      fields={fields}
      defaultSort="docType:asc,priority:asc"
      perms={{ manage: 'APPROVAL.CONFIG', del: 'APPROVAL.CONFIG', viewDeleted: 'APPROVAL.CONFIG' }}
    />
  )
}
