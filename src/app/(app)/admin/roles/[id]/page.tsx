'use client'
import { use, useEffect, useMemo, useState } from 'react'
import { Button, Card, ErrorText, Input, PageHeader } from '@/components/ui'
import { api, type Paged } from '@/lib/api'
import { useCan } from '@/lib/me'

type P = { id: number; code: string; module: string; name: string }

/** Role ↔ permission matrix, grouped by module. */
export default function RolePermissions({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const can = useCan()
  const [role, setRole] = useState<any>(null)
  const [perms, setPerms] = useState<P[]>([])
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState('')
  const [msg, setMsg] = useState<string | null>(null), [error, setError] = useState<string | null>(null)
  useEffect(() => {
    api(`/roles/${id}`).then((r) => setRole(r.data)).catch((e) => setError(e.message))
    api(`/roles/${id}/permissions`).then((r) => setPicked(new Set(r.data))).catch(() => {})
    ;(async () => { // permissions are few (< 200): page through them once
      const all: P[] = []
      for (let page = 1; ; page++) { const r = await api<Paged<P>>(`/permissions?pageSize=100&page=${page}&sort=module:asc,code:asc`); all.push(...r.data); if (page >= r.meta.totalPages) break }
      setPerms(all)
    })().catch((e) => setError(e.message))
  }, [id])
  const groups = useMemo(() => {
    const f = filter.toLowerCase()
    const m = new Map<string, P[]>()
    for (const p of perms) if (!f || p.code.toLowerCase().includes(f) || p.name.toLowerCase().includes(f)) m.set(p.module, [...(m.get(p.module) ?? []), p])
    return [...m]
  }, [perms, filter])
  const toggle = (pid: number, on: boolean) => setPicked((s) => { const n = new Set(s); on ? n.add(pid) : n.delete(pid); return n })
  const save = async () => {
    setError(null); setMsg(null)
    try { await api(`/roles/${id}/permissions`, { method: 'PUT', body: JSON.stringify({ permissionIds: [...picked] }) }); setMsg('Saved') } catch (e) { setError((e as Error).message) }
  }
  const manage = can('ROLE.MANAGE')
  return (
    <div className="space-y-4">
      <PageHeader title={role ? `Role ${role.code} — permissions` : 'Role'} actions={manage && <Button onClick={save}>Save</Button>} />
      {msg && <p className="text-sm text-green-700">{msg}</p>}
      <ErrorText error={error} />
      <Input className="max-w-xs" placeholder="Filter permissions…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter permissions" />
      {groups.map(([mod, list]) => (
        <Card key={mod} title={mod}>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {list.map((p) => (
              <label key={p.id} className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" disabled={!manage} checked={picked.has(p.id)} onChange={(e) => toggle(p.id, e.target.checked)} />
                <span><span className="font-mono text-xs">{p.code}</span><br /><span className="text-gray-600">{p.name}</span></span>
              </label>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
