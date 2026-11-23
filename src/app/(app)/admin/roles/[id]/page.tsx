'use client'
import Link from 'next/link'
import { use, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, Search, ShieldCheck } from 'lucide-react'
import { Badge, Button, Card, ErrorText, Input, PageHeader } from '@/components/ui'
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
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api(`/roles/${id}`)
      .then((r) => setRole(r.data))
      .catch((e) => setError(e.message))
    api(`/roles/${id}/permissions`)
      .then((r) => setPicked(new Set(r.data)))
      .catch(() => {})
    ;(async () => {
      const all: P[] = []
      for (let page = 1; ; page++) {
        const r = await api<Paged<P>>(`/permissions?pageSize=100&page=${page}&sort=module:asc,code:asc`)
        all.push(...r.data)
        if (page >= r.meta.totalPages) break
      }
      setPerms(all)
    })().catch((e) => setError(e.message))
  }, [id])

  const groups = useMemo(() => {
    const f = filter.toLowerCase()
    const m = new Map<string, P[]>()
    for (const p of perms)
      if (!f || p.code.toLowerCase().includes(f) || p.name.toLowerCase().includes(f))
        m.set(p.module, [...(m.get(p.module) ?? []), p])
    return [...m]
  }, [perms, filter])

  const toggle = (pid: number, on: boolean) =>
    setPicked((s) => {
      const n = new Set(s)
      on ? n.add(pid) : n.delete(pid)
      return n
    })

  const toggleGroup = (list: P[], on: boolean) =>
    setPicked((s) => {
      const n = new Set(s)
      for (const p of list) on ? n.add(p.id) : n.delete(p.id)
      return n
    })

  const save = async () => {
    setError(null)
    setMsg(null)
    try {
      await api(`/roles/${id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissionIds: [...picked] }),
      })
      setMsg('Matriks hak akses berhasil disimpan.')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const manage = can('ROLE.MANAGE')

  return (
    <div className="space-y-6">
      <PageHeader
        title={role ? `Role ${role.code} — ${role.name}` : 'Matriks Hak Akses Role'}
        subtitle="Konfigurasi daftar izin (permissions) per modul untuk role ini."
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/roles"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali</span>
            </Link>
            {manage && (
              <Button onClick={save}>
                <ShieldCheck className="h-4 w-4" />
                <span>Simpan Permissions ({picked.size})</span>
              </Button>
            )}
          </div>
        }
      />

      {msg && (
        <div className="flex items-center gap-2 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm font-semibold text-success-700">
          <CheckCircle2 className="h-4 w-4" />
          <span>{msg}</span>
        </div>
      )}
      <ErrorText error={error} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Cari kode atau nama permission…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter permissions"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
          <span>Terpilih:</span>
          <Badge value={`${picked.size} / ${perms.length} PERMISSIONS`} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {groups.map(([mod, list]) => {
          const allSelected = list.every((p) => picked.has(p.id))
          return (
            <Card
              key={mod}
              title={`Modul: ${mod}`}
              actions={
                manage && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(list, !allSelected)}
                    className="text-xs font-semibold text-brand-600 hover:underline"
                  >
                    {allSelected ? 'Hapus Semua' : 'Pilih Semua'}
                  </button>
                )
              }
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {list.map((p) => {
                  const checked = picked.has(p.id)
                  return (
                    <label
                      key={p.id}
                      className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-sm transition-all cursor-pointer ${
                        checked ? 'border-brand-200 bg-brand-50/50' : 'border-gray-100 bg-gray-50/40 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        disabled={!manage}
                        checked={checked}
                        onChange={(e) => toggle(p.id, e.target.checked)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-xs font-bold text-gray-900">{p.code}</span>
                        <span className="block text-xs text-gray-500">{p.name}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
