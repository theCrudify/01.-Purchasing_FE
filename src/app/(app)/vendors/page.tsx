'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Eye, FileCheck2, Pencil, Plus } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { Badge, Button, ErrorText, PageHeader, Select } from '@/components/ui'
import { post } from '@/lib/api'
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

export default function VendorsPage() {
  const router = useRouter()
  const [opStatus, setOpStatus] = useState('')
  const list = useList<BpRow>('/vendors', 'legalName:asc', { operationalStatus: opStatus || undefined })
  const [error, setError] = useState<string | null>(null)

  const createVerification = async (bp: BpRow) => {
    setError(null)
    try {
      const res = await post<{ data: { id: string } }>('/verifications', {
        bpId: bp.id,
        requestType: 'PERIODIC_REVIEW',
        title: `Vendor Verification — ${bp.legalName}`,
        remarks: `Periodic compliance verification for ${bp.bpCode ?? bp.legalName}`,
      })
      router.push(`/vendors/verifications/${res.data.id}`)
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
          <Link href="/vendors/new">
            <Button>
              <Plus className="h-4 w-4" />
              <span>New Vendor</span>
            </Button>
          </Link>
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
              <Link
                href={`/vendors/${r.id}`}
                className="inline-flex items-center rounded border border-gray-200 bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-brand-600 hover:underline"
              >
                {r.bpCode ?? '—'}
              </Link>
            ),
          },
          {
            key: 'legalName',
            header: 'Legal Name',
            sortable: true,
            render: (r) => (
              <div>
                <Link href={`/vendors/${r.id}`} className="font-semibold text-gray-900 hover:text-brand-600 hover:underline">
                  {r.legalName}
                </Link>
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
                <Link
                  href={`/vendors/${r.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Detail / Edit</span>
                </Link>
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
            {['ACTIVE', 'INACTIVE', 'ON_HOLD', 'BLACKLISTED'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        }
      />
    </div>
  )
}
