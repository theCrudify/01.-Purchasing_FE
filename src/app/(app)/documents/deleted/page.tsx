'use client'
import { useState } from 'react'
import { DataTable } from '@/components/data-table'
import { Badge, Button, ErrorText, PageHeader, Select, fmtDate, fmtDateTime, fmtMoney } from '@/components/ui'
import { post } from '@/lib/api'
import { useCan } from '@/lib/me'
import { useList } from '@/lib/use-list'

type DeletedDoc = {
  id: string
  docType: string
  docNo: string | null
  title: string
  docDate: string
  currencyCode: string
  totalAmount: string
  totalAmountBase: string
  ownerName: string
  deletedAt: string
  deletedByName: string
  deleteReason: string | null
}

export default function DeletedDocumentsPage() {
  const can = useCan()
  const [docType, setDocType] = useState('')
  const list = useList<DeletedDoc>('/documents/deleted', 'deletedAt:desc', { docType: docType || undefined })
  const [error, setError] = useState<string | null>(null)

  const restore = async (publicId: string) => {
    if (!confirm('Restore this document from trash?')) return
    setError(null)
    try {
      await post(`/documents/${publicId}/restore`)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Deleted Documents (Trash)" />

      <p className="text-sm text-gray-600">
        Draft, returned, and rejected documents that were soft-deleted. Internal administrators can restore them back to their previous status.
      </p>

      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          { key: 'docType', header: 'Type', sortable: true, render: (r) => <Badge value={r.docType} /> },
          { key: 'docNo', header: 'Doc No', sortable: true, render: (r) => r.docNo ?? '(draft)' },
          { key: 'title', header: 'Title' },
          { key: 'ownerName', header: 'Owner', sortable: true },
          {
            key: 'totalAmountBase',
            header: 'Amount',
            sortable: true,
            render: (r) => fmtMoney(r.totalAmount, r.currencyCode),
          },
          { key: 'deletedAt', header: 'Deleted At', sortable: true, render: (r) => fmtDateTime(r.deletedAt) },
          { key: 'deletedByName', header: 'Deleted By' },
          { key: 'deleteReason', header: 'Reason' },
          {
            key: '_a',
            header: '',
            render: (r) => (
              <div className="flex justify-end">
                <Button variant="secondary" onClick={() => restore(r.id)}>
                  Restore
                </Button>
              </div>
            ),
          },
        ]}
        actions={
          <Select
            className="w-36"
            aria-label="Filter document type"
            value={docType}
            onChange={(e) => {
              setDocType(e.target.value)
              list.setPage(1)
            }}
          >
            <option value="">All Doc Types</option>
            {['PR', 'RFQ', 'QUO', 'CTR', 'PO', 'GR', 'SVR'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        }
      />
    </div>
  )
}
