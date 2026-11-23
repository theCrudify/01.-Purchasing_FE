'use client'
import { use, useEffect, useState } from 'react'
import { DataTable } from '@/components/data-table'
import { Badge, Button, Card, ErrorText, PageHeader, fmtDateTime } from '@/components/ui'
import { api, post, type Paged } from '@/lib/api'
import { useCan } from '@/lib/me'
import { useList } from '@/lib/use-list'

export default function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const can = useCan()
  const [u, setU] = useState<any>(null)
  const [roles, setRoles] = useState<any[]>([])
  const [picked, setPicked] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const sessions = useList<any>(`/users/${id}/sessions`, 'startedAt:desc')
  const load = () => api(`/users/${id}`).then((r) => { setU(r.data); setPicked(r.data.roles.map((x: any) => x.id)) }).catch((e) => setError(e.message))
  useEffect(() => { load(); api<Paged<any>>('/roles?pageSize=100&isActive=true').then((r) => setRoles(r.data)).catch(() => {}) }, [id])
  const act = async (fn: () => Promise<unknown>) => { setError(null); try { await fn(); await load(); sessions.reload() } catch (e) { setError((e as Error).message) } }
  if (!u) return <ErrorText error={error} />
  const manage = can('USER.MANAGE')
  return (
    <div className="space-y-4">
      <PageHeader title={u.displayName} actions={manage && <>
        {u.status === 'DISABLED'
          ? <Button variant="secondary" onClick={() => act(() => post(`/users/${id}/enable`))}>Enable</Button>
          : <Button variant="danger" onClick={() => { const reason = prompt('Reason for disabling?'); if (reason !== null) act(() => post(`/users/${id}/disable`, { reason })) }}>Disable</Button>}
        {u.credential?.lockoutUntil && <Button variant="secondary" onClick={() => act(() => post(`/users/${id}/unlock`))}>Unlock</Button>}
        <Button variant="secondary" onClick={() => act(() => post(`/users/${id}/send-reset`))}>Send reset code</Button>
        <Button variant="secondary" onClick={() => confirm('End all sessions of this user?') && act(() => post(`/users/${id}/force-logout`))}>Force logout</Button>
      </>} />
      <ErrorText error={error} />
      <Card title="Account">
        <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <dt className="text-gray-500">Email</dt><dd>{u.email}</dd>
          <dt className="text-gray-500">Status</dt><dd><Badge value={u.status} /> {u.statusReason}</dd>
          <dt className="text-gray-500">Type</dt><dd>{u.userType}</dd>
          <dt className="text-gray-500">Sign-in</dt><dd>{u.credential?.authProvider}{u.credential?.ssoBound ? ' (SSO bound)' : ''}</dd>
          <dt className="text-gray-500">Last login</dt><dd>{fmtDateTime(u.lastLoginAt)}</dd>
          <dt className="text-gray-500">Active sessions</dt><dd>{u.activeSessions}</dd>
        </dl>
      </Card>
      <Card title="Roles" actions={manage && <Button onClick={() => act(() => api(`/users/${id}/roles`, { method: 'PUT', body: JSON.stringify({ roleIds: picked }) }))}>Save roles</Button>}>
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
          {roles.filter((r) => r.scope === u.userType).map((r) => (
            <label key={r.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" disabled={!manage} checked={picked.includes(r.id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, r.id] : p.filter((x) => x !== r.id)))} />
              {r.code} — {r.name}
            </label>
          ))}
        </div>
      </Card>
      <Card title="Sessions">
        <DataTable list={sessions} columns={[
          { key: 'startedAt', header: 'Started', sortable: true, render: (r) => fmtDateTime(r.startedAt) },
          { key: 'lastSeenAt', header: 'Last seen', sortable: true, render: (r) => fmtDateTime(r.lastSeenAt) },
          { key: 'authMethod', header: 'Method' }, { key: 'ipAddress', header: 'IP' },
          { key: 'endReason', header: 'Ended', render: (r) => (r.isActive ? <Badge value="ACTIVE" /> : `${r.endReason ?? ''} ${fmtDateTime(r.endedAt)}`) },
        ]} />
      </Card>
    </div>
  )
}
