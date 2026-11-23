'use client'
import Link from 'next/link'
import { useState } from 'react'
import { DataTable } from '@/components/data-table'
import { Badge, PageHeader, Select, fmtDate, fmtDateTime, fmtMoney } from '@/components/ui'
import { docHref } from '@/lib/doc-links'
import { useList } from '@/lib/use-list'

type T = { id: string; documentId: string; docType: string; docNo: string; title: string; ownerName: string; stepName: string; startedAt: string; currencyCode: string; totalAmount: string; status: string; actedAt: string | null; remarks: string | null; docStatus: string; docDate: string }

function Inbox({ decided }: { decided: boolean }) {
  const [docType, setDocType] = useState('')
  const list = useList<T>(decided ? '/approvals/decided' : '/approvals/tasks', decided ? 'actedAt:desc' : 'startedAt:asc', { docType: docType || undefined })
  return <DataTable list={list} columns={[
    { key: 'docNo', header: 'Document', sortable: true, render: (r) => <Link className="underline" href={docHref(r.docType, r.documentId)}>{r.docType} {r.docNo}</Link> },
    { key: 'title', header: 'Title' },
    { key: 'ownerName', header: 'Requester' },
    { key: 'stepName', header: 'Step' },
    { key: 'totalAmountBase', header: 'Amount', sortable: true, render: (r) => fmtMoney(r.totalAmount, r.currencyCode) },
    decided
      ? { key: 'actedAt', header: 'Decided', sortable: true, render: (r) => <span><Badge value={r.status} /> {fmtDateTime(r.actedAt)}</span> }
      : { key: 'startedAt', header: 'Waiting since', sortable: true, render: (r) => fmtDate(r.startedAt) },
    { key: 'docStatus', header: 'Doc status', render: (r) => <Badge value={r.docStatus} /> },
  ]} actions={
    <Select className="w-36" aria-label="Document type" value={docType} onChange={(e) => { setDocType(e.target.value); list.setPage(1) }}>
      <option value="">All types</option>{['PR', 'RFQ', 'QUO', 'CTR', 'PO', 'GR', 'SVR'].map((t) => <option key={t}>{t}</option>)}
    </Select>} />
}

export default function ApprovalsPage() {
  const [tab, setTab] = useState<'open' | 'done'>('open')
  return (
    <div>
      <PageHeader title="My approvals" />
      <div role="tablist" className="mb-3 flex gap-1 border-b">
        {(['open', 'done'] as const).map((k) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`px-3 py-1.5 text-sm ${tab === k ? 'border-b-2 border-gray-900 font-medium' : 'text-gray-500'}`}>{k === 'open' ? 'Waiting for me' : 'Decided by me'}</button>)}
      </div>
      <Inbox key={tab} decided={tab === 'done'} />
      <p className="mt-2 text-xs text-gray-500">Tasks delegated to you or where you are the backup approver are included. Open a document to approve, return or reject it.</p>
    </div>
  )
}
