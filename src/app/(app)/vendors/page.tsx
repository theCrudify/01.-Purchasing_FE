'use client'
import { useState } from 'react'
import { FileCheck2, Pencil, Plus } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { AutoForm, type FieldDef } from '@/components/form'
import { Badge, Button, ErrorText, Modal, PageHeader, Select } from '@/components/ui'
import { patch, post } from '@/lib/api'
import { useList } from '@/lib/use-list'

type BpRow = {
  id: string
  bpCode: string | null
  entityType: string
  legalName: string
  tradeName: string | null
  taxId: string | null
  email: string | null
  phone: string | null
  defaultCurrencyCode: string
  paymentTermId: number | null
  paymentTermName: string | null
  onboardingStatus: string
  operationalStatus: string
}

const fields: FieldDef[] = [
  { name: 'bpCode', label: 'Vendor Code (Optional — auto-generated if empty)', createOnly: true },
  {
    name: 'entityType',
    label: 'Entity Type',
    type: 'select',
    required: true,
    options: [
      { value: 'COMPANY', label: 'Company (PT / CV / Corp)' },
      { value: 'INDIVIDUAL', label: 'Individual' },
    ],
  },
  { name: 'legalName', label: 'Legal Company Name', required: true },
  { name: 'tradeName', label: 'Trade / Brand Name' },
  { name: 'taxId', label: 'Tax ID / NPWP (16 digits)' },
  { name: 'businessRegNo', label: 'Business Reg. No. (NIB)' },
  { name: 'email', label: 'Official Email', type: 'email' },
  { name: 'phone', label: 'Phone Number' },
  {
    name: 'defaultCurrencyCode',
    label: 'Default Currency',
    type: 'select',
    options: ['IDR', 'USD', 'JPY', 'EUR', 'SGD'].map((c) => ({ value: c, label: c })),
  },
  {
    name: 'paymentTermId',
    label: 'Default Payment Term',
    type: 'lookup',
    lookup: { path: '/payment-terms', label: (r) => `${r.code} — ${r.name}`, params: { isActive: 'true' } },
  },
  {
    name: 'operationalStatus',
    label: 'Operational Status',
    type: 'select',
    options: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED'].map((s) => ({ value: s, label: s })),
  },
]

export default function VendorsPage() {
  const [opStatus, setOpStatus] = useState('')
  const list = useList<BpRow>('/vendors', 'legalName:asc', { operationalStatus: opStatus || undefined })
  const [editing, setEditing] = useState<BpRow | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const createVerification = async (bp: BpRow) => {
    setError(null)
    try {
      await post('/verifications', {
        bpId: bp.id,
        requestType: 'REVERIFICATION',
        title: `Vendor Verification — ${bp.legalName}`,
        remarks: `Periodic compliance verification for ${bp.bpCode ?? bp.legalName}`,
      })
      alert(`Supplier Verification (SVR) created for ${bp.legalName}. View it under Supplier Verifications.`)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Vendors / Business Partners"
        subtitle="Manage registered suppliers, legal tax identifiers, default payment terms, and operational status."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" />
            <span>New Vendor</span>
          </Button>
        }
      />

      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          {
            key: 'bpCode',
            header: 'Vendor Code',
            sortable: true,
            render: (r) => (
              <span className="inline-flex items-center rounded border border-gray-200 bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-800">
                {r.bpCode ?? '—'}
              </span>
            ),
          },
          {
            key: 'legalName',
            header: 'Legal Name',
            sortable: true,
            render: (r) => (
              <div>
                <div className="font-semibold text-gray-900">{r.legalName}</div>
                {r.email && <div className="text-xs text-gray-500">{r.email}</div>}
              </div>
            ),
          },
          { key: 'entityType', header: 'Type' },
          { key: 'taxId', header: 'NPWP / Tax ID' },
          { key: 'defaultCurrencyCode', header: 'Currency' },
          { key: 'paymentTermName', header: 'Payment Term' },
          {
            key: 'operationalStatus',
            header: 'Status',
            sortable: true,
            render: (r) => <Badge value={r.operationalStatus} />,
          },
          {
            key: '_a',
            header: 'Actions',
            render: (r) => (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditing(r)}
                  className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => createVerification(r)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  title="Create SVR Verification Document"
                >
                  <FileCheck2 className="h-3.5 w-3.5 text-brand-600" />
                  <span>New SVR</span>
                </button>
              </div>
            ),
          },
        ]}
        actions={
          <Select
            className="h-[40px] w-44"
            value={opStatus}
            onChange={(e) => {
              setOpStatus(e.target.value)
              list.setPage(1)
            }}
            aria-label="Operational status filter"
          >
            <option value="">All Statuses</option>
            {['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        }
      />

      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Register New Vendor / Business Partner' : 'Edit Vendor'}
        onClose={() => setEditing(null)}
      >
        <AutoForm
          fields={fields}
          editing={editing !== 'new'}
          initial={
            editing && editing !== 'new'
              ? editing
              : { entityType: 'COMPANY', defaultCurrencyCode: 'IDR', operationalStatus: 'ACTIVE', isSupplier: true }
          }
          onSubmit={async (v) => {
            if (editing === 'new') await post('/vendors', v)
            else await patch(`/vendors/${(editing as BpRow).id}`, v)
            setEditing(null)
            list.reload()
          }}
        />
      </Modal>
    </div>
  )
}
