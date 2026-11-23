'use client'
import { useState } from 'react'
import { DataTable, type Column } from '@/components/data-table'
import { Input, PageHeader, fmtDateTime } from '@/components/ui'
import { useList } from '@/lib/use-list'

const TABS = {
  logs: { label: 'Data changes', sort: 'occurredAt:desc', columns: [
    { key: 'occurredAt', header: 'When', sortable: true, render: (r: any) => fmtDateTime(r.occurredAt) },
    { key: 'tableName', header: 'Table', sortable: true }, { key: 'recordKey', header: 'Record' }, { key: 'action', header: 'Action' },
    { key: 'actorEmail', header: 'By' },
    { key: 'changes', header: 'Changes', render: (r: any) => <details><summary className="cursor-pointer text-xs">view</summary><pre className="max-w-xl overflow-x-auto whitespace-pre-wrap text-xs">{r.changes}</pre></details> },
  ] },
  activity: { label: 'Login activity', sort: 'occurredAt:desc', columns: [
    { key: 'occurredAt', header: 'When', sortable: true, render: (r: any) => fmtDateTime(r.occurredAt) },
    { key: 'email', header: 'User' }, { key: 'action', header: 'Action', sortable: true }, { key: 'ipAddress', header: 'IP' }, { key: 'detail', header: 'Detail' },
  ] },
  sessions: { label: 'Sessions', sort: 'startedAt:desc', columns: [
    { key: 'startedAt', header: 'Started', sortable: true, render: (r: any) => fmtDateTime(r.startedAt) },
    { key: 'email', header: 'User', sortable: true }, { key: 'authMethod', header: 'Method' }, { key: 'ipAddress', header: 'IP' },
    { key: 'endReason', header: 'Status', render: (r: any) => (r.isActive ? 'Active' : `${r.endReason ?? 'Expired'}${r.endedByEmail ? ` by ${r.endedByEmail}` : ''}`) },
  ] },
  access: { label: 'Sensitive access', sort: 'occurredAt:desc', columns: [
    { key: 'occurredAt', header: 'When', sortable: true, render: (r: any) => fmtDateTime(r.occurredAt) },
    { key: 'email', header: 'User' }, { key: 'action', header: 'Action', sortable: true }, { key: 'objectType', header: 'Object' }, { key: 'objectKey', header: 'Key' }, { key: 'detail', header: 'Detail' },
  ] },
} satisfies Record<string, { label: string; sort: string; columns: Column<any>[] }>

function Tab({ kind }: { kind: keyof typeof TABS }) {
  const [from, setFrom] = useState(''), [to, setTo] = useState('')
  const list = useList<any>(`/audit/${kind}`, TABS[kind].sort, { from: from || undefined, to: to || undefined })
  return <DataTable list={list} columns={TABS[kind].columns} actions={
    <div className="flex items-center gap-2 text-sm">
      <Input type="date" aria-label="From" value={from} onChange={(e) => setFrom(e.target.value)} /> – <Input type="date" aria-label="To" value={to} onChange={(e) => setTo(e.target.value)} />
    </div>} />
}

export default function AuditPage() {
  const [tab, setTab] = useState<keyof typeof TABS>('logs')
  return (
    <div>
      <PageHeader title="Audit trail" />
      <div role="tablist" className="mb-3 flex gap-1 border-b">
        {(Object.keys(TABS) as (keyof typeof TABS)[]).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`px-3 py-1.5 text-sm ${tab === k ? 'border-b-2 border-gray-900 font-medium' : 'text-gray-500'}`}>{TABS[k].label}</button>
        ))}
      </div>
      <Tab key={tab} kind={tab} />
    </div>
  )
}
