'use client'
import Link from 'next/link'
import { DataTable } from '@/components/data-table'
import { Badge, PageHeader, fmtDate, fmtMoney } from '@/components/ui'
import { useList } from '@/lib/use-list'

type Row = {
  id: string
  docNo: string | null
  title: string
  status: string
  currencyCode: string
  totalAmount: string
  bpCode: string | null
  bpName: string | null
  contractType: string
  startDate: string
  endDate: string
}

export default function PortalContractsPage() {
  const list = useList<Row>('/contracts', 'createdAt:desc')

  return (
    <div className="space-y-5">
      <PageHeader
        title="Purchase Contracts"
        subtitle="Kontrak dan perjanjian pengadaan yang aktif bersama perusahaan Anda."
      />
      <DataTable
        list={list}
        columns={[
          {
            key: 'docNo',
            header: 'Contract No.',
            sortable: true,
            render: (r) => (
              <Link href={`/portal/documents/${r.id}`} className="font-mono text-xs font-semibold text-brand-600 hover:underline">
                {r.docNo ?? '(Draft)'}
              </Link>
            ),
          },
          {
            key: 'title',
            header: 'Title',
            sortable: true,
            render: (r) => (
              <Link href={`/portal/documents/${r.id}`} className="font-semibold text-gray-900 hover:text-brand-600">
                {r.title}
              </Link>
            ),
          },
          { key: 'contractType', header: 'Type', render: (r) => <Badge value={r.contractType} /> },
          {
            key: 'startDate',
            header: 'Validity Period',
            render: (r) => (
              <span className="text-xs text-gray-600">
                {fmtDate(r.startDate)} → {fmtDate(r.endDate)}
              </span>
            ),
          },
          {
            key: 'totalAmount',
            header: 'Value',
            sortable: true,
            render: (r) => <span className="font-semibold text-gray-900">{fmtMoney(r.totalAmount, r.currencyCode)}</span>,
          },
          { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge value={r.status} /> },
        ]}
      />
    </div>
  )
}
