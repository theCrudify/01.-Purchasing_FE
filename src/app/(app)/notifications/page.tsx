'use client'
import Link from 'next/link'
import { useState } from 'react'
import { CheckCheck } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { Button, PageHeader, fmtDateTime } from '@/components/ui'
import { post } from '@/lib/api'
import { docHref } from '@/lib/doc-links'
import { useMe } from '@/lib/me'
import { useList } from '@/lib/use-list'

type N = {
  id: string
  title: string
  body: string | null
  readAt: string | null
  createdAt: string
  documentId: string | null
  docType: string | null
}

export default function NotificationsPage() {
  const me = useMe()
  const [unread, setUnread] = useState(false)
  const list = useList<N>('/notifications', 'createdAt:desc', { unread: unread ? 'true' : undefined })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notifications"
        actions={
          <Button
            variant="secondary"
            onClick={async () => {
              await post('/notifications/read-all')
              list.reload()
            }}
          >
            <CheckCheck className="h-4 w-4" />
            <span>Mark all read</span>
          </Button>
        }
      />

      <DataTable
        list={list}
        columns={[
          {
            key: 'createdAt',
            header: 'Timestamp',
            sortable: true,
            render: (r) => <span className="text-xs text-slate-500">{fmtDateTime(r.createdAt)}</span>,
          },
          {
            key: 'title',
            header: 'Message',
            render: (r) => (
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {!r.readAt && <span className="h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-indigo-200" />}
                  {r.documentId && r.docType ? (
                    <Link
                      className={`hover:text-indigo-600 hover:underline ${
                        r.readAt ? 'text-slate-600' : 'font-semibold text-slate-900'
                      }`}
                      onClick={() => post(`/notifications/${r.id}/read`)}
                      href={docHref(r.docType, r.documentId, me?.userType === 'BP')}
                    >
                      {r.title}
                    </Link>
                  ) : (
                    <span className={r.readAt ? 'text-slate-600' : 'font-semibold text-slate-900'}>
                      {r.title}
                    </span>
                  )}
                </div>
                {r.body && <p className="text-xs text-slate-500 pl-4">{r.body}</p>}
              </div>
            ),
          },
          {
            key: '_r',
            header: '',
            render: (r) =>
              !r.readAt && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      await post(`/notifications/${r.id}/read`)
                      list.reload()
                    }}
                  >
                    Mark read
                  </Button>
                </div>
              ),
          },
        ]}
        actions={
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={unread}
              onChange={(e) => setUnread(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Unread only</span>
          </label>
        }
      />
    </div>
  )
}
