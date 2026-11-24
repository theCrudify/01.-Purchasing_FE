'use client'
import Link from 'next/link'
import { DataTable } from '@/components/data-table'
import { Badge, Button, PageHeader, fmtDate } from '@/components/ui'
import { useList } from '@/lib/use-list'

type Row = {
  id: string
  docNo: string | null
  title: string
  docDate: string
  status: string
  submissionDeadline: string | null
  quoteValidityDays: number | null
}

/** RFQs this vendor was invited to (the API scopes /rfq to the caller's company). */
export default function PortalRfqPage() {
  const list = useList<Row>('/rfq', 'createdAt:desc')
  const docLink = (r: Row, text: string, cls: string) => <Link href={`/portal/documents/${r.id}`} className={cls}>{text}</Link>

  return (
    <div className="space-y-5">
      <PageHeader
        title="RFQ Invitations"
        subtitle="Permintaan penawaran (RFQ) yang mengundang perusahaan Anda. Buka untuk melihat item & spesifikasi, lalu ajukan penawaran."
        actions={<Link href="/portal/quotations/new"><Button>Ajukan Penawaran</Button></Link>}
      />
      <DataTable
        list={list}
        columns={[
          { key: 'docNo', header: 'RFQ No.', sortable: true, render: (r) => docLink(r, r.docNo ?? '(Draft)', 'font-mono text-xs font-semibold text-brand-600 hover:underline') },
          { key: 'title', header: 'Title', render: (r) => docLink(r, r.title, 'font-semibold text-gray-900 hover:text-brand-600') },
          { key: 'docDate', header: 'RFQ Date', sortable: true, render: (r) => fmtDate(r.docDate) },
          { key: 'submissionDeadline', header: 'Submission Deadline', sortable: true, render: (r) => fmtDate(r.submissionDeadline) },
          { key: 'quoteValidityDays', header: 'Quote Validity', render: (r) => (r.quoteValidityDays ? `${r.quoteValidityDays} days` : '—') },
          { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge value={r.status} /> },
        ]}
      />
    </div>
  )
}
