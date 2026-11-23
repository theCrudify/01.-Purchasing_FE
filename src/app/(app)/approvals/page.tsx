'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Clock, CheckCircle2 } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { Badge, PageHeader, Select, fmtDate, fmtDateTime, fmtMoney } from '@/components/ui'
import { docHref } from '@/lib/doc-links'
import { useList } from '@/lib/use-list'

type T = {
  id: string
  documentId: string
  docType: string
  docNo: string
  title: string
  ownerName: string
  stepName: string
  startedAt: string
  currencyCode: string
  totalAmount: string
  status: string
  actedAt: string | null
  remarks: string | null
  docStatus: string
  docDate: string
}

function Inbox({ decided }: { decided: boolean }) {
  const [docType, setDocType] = useState('')
  const list = useList<T>(
    decided ? '/approvals/decided' : '/approvals/tasks',
    decided ? 'actedAt:desc' : 'startedAt:asc',
    { docType: docType || undefined }
  )

  return (
    <DataTable
      list={list}
      columns={[
        {
          key: 'docNo',
          header: 'Document',
          sortable: true,
          render: (r) => (
            <Link
              className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
              href={docHref(r.docType, r.documentId)}
            >
              {r.docType} {r.docNo}
            </Link>
          ),
        },
        { key: 'title', header: 'Title' },
        { key: 'ownerName', header: 'Requester' },
        { key: 'stepName', header: 'Approval Step' },
        {
          key: 'totalAmountBase',
          header: 'Amount',
          sortable: true,
          render: (r) => <span className="font-medium text-slate-800">{fmtMoney(r.totalAmount, r.currencyCode)}</span>,
        },
        decided
          ? {
              key: 'actedAt',
              header: 'Decision',
              sortable: true,
              render: (r) => (
                <div className="flex items-center gap-1.5">
                  <Badge value={r.status} />
                  <span className="text-xs text-slate-500">{fmtDateTime(r.actedAt)}</span>
                </div>
              ),
            }
          : {
              key: 'startedAt',
              header: 'Waiting Since',
              sortable: true,
              render: (r) => <span className="text-xs text-slate-500">{fmtDate(r.startedAt)}</span>,
            },
        {
          key: 'docStatus',
          header: 'Doc Status',
          render: (r) => <Badge value={r.docStatus} />,
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
          <option value="">All Types</option>
          {['PR', 'RFQ', 'QUO', 'CTR', 'PO', 'GR', 'SVR'].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
      }
    />
  )
}

export default function ApprovalsPage() {
  const [tab, setTab] = useState<'open' | 'done'>('open')

  return (
    <div className="space-y-4">
      <PageHeader title="My Approval Tasks" />

      <div role="tablist" className="flex gap-2 border-b border-slate-200">
        <button
          role="tab"
          aria-selected={tab === 'open'}
          onClick={() => setTab('open')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition cursor-pointer ${
            tab === 'open'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Waiting for My Approval</span>
        </button>
        <button
          role="tab"
          aria-selected={tab === 'done'}
          onClick={() => setTab('done')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition cursor-pointer ${
            tab === 'done'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Decided by Me</span>
        </button>
      </div>

      <Inbox key={tab} decided={tab === 'done'} />

      <p className="text-xs text-slate-400">
        Tasks delegated to you or where you are designated as a standing backup approver are automatically included in this inbox.
      </p>
    </div>
  )
}
