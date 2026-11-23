'use client'
import Link from 'next/link'
import { useState } from 'react'
import { DataTable } from '@/components/data-table'
import { Badge, PageHeader, Select, fmtDate, fmtMoney } from '@/components/ui'
import { useList } from '@/lib/use-list'

type Row = {
  id: string
  docNo: string | null
  title: string
  docDate: string
  status: string
  currencyCode: string
  totalAmount: string
  bpCode: string | null
  bpName: string | null
  deliveryDate: string | null
}

export default function PortalPurchaseOrdersPage() {
  const [filterStatus, setFilterStatus] = useState('')
  const list = useList<Row>('/po', 'createdAt:desc', { status: filterStatus || undefined })

  return (
    <div className="space-y-5">
      <PageHeader
        title="Purchase Orders"
        subtitle="Daftar Purchase Order (PO) yang diterbitkan kepada perusahaan Anda."
      />
      <DataTable
        list={list}
        actions={
          <Select
            className="h-[40px] w-44"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value)
              list.setPage(1)
            }}
          >
            <option value="">All Statuses</option>
            <option value="APPROVED">APPROVED</option>
            <option value="ISSUED">ISSUED</option>
            <option value="CLOSED">CLOSED</option>
          </Select>
        }
        columns={[
          {
            key: 'docNo',
            header: 'PO No.',
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
          { key: 'docDate', header: 'Order Date', sortable: true, render: (r) => fmtDate(r.docDate) },
          { key: 'deliveryDate', header: 'Delivery Date', render: (r) => fmtDate(r.deliveryDate) },
          {
            key: 'totalAmount',
            header: 'Total Amount',
            sortable: true,
            render: (r) => <span className="font-semibold text-gray-900">{fmtMoney(r.totalAmount, r.currencyCode)}</span>,
          },
          { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge value={r.status} /> },
        ]}
      />
    </div>
  )
}
