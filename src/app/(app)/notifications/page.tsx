'use client'
import Link from 'next/link'
import { useState } from 'react'
import { DataTable } from '@/components/data-table'
import { Button, PageHeader, fmtDateTime } from '@/components/ui'
import { post } from '@/lib/api'
import { docHref } from '@/lib/doc-links'
import { useMe } from '@/lib/me'
import { useList } from '@/lib/use-list'

type N = { id: string; title: string; body: string | null; readAt: string | null; createdAt: string; documentId: string | null; docType: string | null }

/** Shared by the internal app and the portal (rendered from both route groups). */
export default function NotificationsPage() {
  const me = useMe()
  const [unread, setUnread] = useState(false)
  const list = useList<N>('/notifications', 'createdAt:desc', { unread: unread ? 'true' : undefined })
  return (
    <div>
      <PageHeader title="Notifications" actions={<Button variant="secondary" onClick={async () => { await post('/notifications/read-all'); list.reload() }}>Mark all read</Button>} />
      <DataTable list={list} columns={[
        { key: 'createdAt', header: 'When', sortable: true, render: (r) => fmtDateTime(r.createdAt) },
        { key: 'title', header: 'Notification', render: (r) => (
          <span className={r.readAt ? 'text-gray-500' : 'font-medium'}>
            {r.documentId && r.docType ? <Link className="underline" onClick={() => post(`/notifications/${r.id}/read`)} href={docHref(r.docType, r.documentId, me?.userType === 'BP')}>{r.title}</Link> : r.title}
            {r.body && <span className="block text-xs text-gray-500">{r.body}</span>}
          </span>) },
        { key: '_r', header: '', render: (r) => !r.readAt && <Button variant="ghost" onClick={async () => { await post(`/notifications/${r.id}/read`); list.reload() }}>Mark read</Button> },
      ]} actions={<label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={unread} onChange={(e) => setUnread(e.target.checked)} /> Unread only</label>} />
    </div>
  )
}
