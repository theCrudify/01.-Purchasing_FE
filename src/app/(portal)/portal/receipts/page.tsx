'use client'
import Link from 'next/link'
import { DataTable } from '@/components/data-table'
import { Badge, PageHeader, fmtDate } from '@/components/ui'
import { useList } from '@/lib/use-list'

type Row = {
  id: string
  docNo: string | null
  title: string
  status: string
  bpCode: string | null
  bpName: string | null
  receivedDate: string
  deliveryNoteNo: string | null
}

export default function PortalReceiptsPage() {
  const list = useList<Row>('/gr', 'createdAt:desc')

  return (
    <div className="space-y-5">
      <PageHeader
        title="Goods Receipts"
        subtitle="Bukti penerimaan barang (GR) atas pengiriman Purchase Order Anda."
      />
      <DataTable
        list={list}
        columns={[
          {
            key: 'docNo',
            header: 'GR No.',
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
          {
            key: 'deliveryNoteNo',
            header: 'Delivery Note (SJ)',
            render: (r) => <span className="font-mono text-xs text-gray-700">{r.deliveryNoteNo ?? '—'}</span>,
          },
          { key: 'receivedDate', header: 'Received Date', sortable: true, render: (r) => fmtDate(r.receivedDate) },
          { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge value={r.status} /> },
        ]}
      />
    </div>
  )
}
