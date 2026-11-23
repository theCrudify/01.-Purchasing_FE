'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Badge, Card, ErrorText, PageHeader, fmtDateTime } from '@/components/ui'
import { api } from '@/lib/api'
import { useMe } from '@/lib/me'

type D = { pendingApprovals: number; unreadNotifications: number; myDocuments: { docType: string; status: string; n: number }[]; recentNotifications: { id: string; title: string; readAt: string | null; createdAt: string }[] }

export default function Dashboard() {
  const me = useMe()
  const [d, setD] = useState<D | null>(null), [error, setError] = useState<string | null>(null)
  useEffect(() => { api<{ data: D }>('/dashboard').then((r) => setD(r.data)).catch((e) => setError(e.message)) }, [])
  const types = d ? [...new Set(d.myDocuments.map((x) => x.docType))] : []
  return (
    <div className="space-y-4">
      <PageHeader title={`Welcome${me ? `, ${me.displayName}` : ''}`} />
      <ErrorText error={error} />
      {d && <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/approvals" className="rounded border bg-white p-4 hover:bg-gray-50"><p className="text-sm text-gray-500">Waiting for my approval</p><p className="text-3xl font-semibold">{d.pendingApprovals}</p></Link>
          <Link href="/notifications" className="rounded border bg-white p-4 hover:bg-gray-50"><p className="text-sm text-gray-500">Unread notifications</p><p className="text-3xl font-semibold">{d.unreadNotifications}</p></Link>
        </div>
        <Card title="My documents">
          {!types.length && <p className="text-sm text-gray-500">No documents yet.</p>}
          {types.map((t) => (
            <div key={t} className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="w-12 font-medium">{t}</span>
              {d.myDocuments.filter((x) => x.docType === t).map((x) => <span key={x.status} className="flex items-center gap-1"><Badge value={x.status} /> {x.n}</span>)}
            </div>
          ))}
        </Card>
        <Card title="Recent notifications">
          <ul className="space-y-1 text-sm">{d.recentNotifications.map((n) => <li key={n.id} className={n.readAt ? 'text-gray-500' : 'font-medium'}>{fmtDateTime(n.createdAt)} — {n.title}</li>)}</ul>
        </Card>
      </>}
    </div>
  )
}
