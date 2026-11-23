'use client'
import Link from 'next/link'
import { use, useEffect, useState } from 'react'
import { ArrowLeft, KeyRound, LockOpen, LogOut, Shield, ShieldAlert, ShieldCheck, UserCheck } from 'lucide-react'
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
  const [msg, setMsg] = useState<string | null>(null)
  const sessions = useList<any>(`/users/${id}/sessions`, 'startedAt:desc')

  const load = () =>
    api(`/users/${id}`)
      .then((r) => {
        setU(r.data)
        setPicked(r.data.roles.map((x: any) => x.id))
      })
      .catch((e) => setError(e.message))

  useEffect(() => {
    load()
    api<Paged<any>>('/roles?pageSize=100&isActive=true')
      .then((r) => setRoles(r.data))
      .catch(() => {})
  }, [id])

  const act = async (fn: () => Promise<unknown>, successText?: string) => {
    setError(null)
    setMsg(null)
    try {
      await fn()
      if (successText) setMsg(successText)
      await load()
      sessions.reload()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (!u) return <ErrorText error={error} />
  const manage = can('USER.MANAGE')

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Detail Pengguna — ${u.displayName}`}
        subtitle={`Kelola status akun, penetapan role, dan riwayat sesi aktif untuk ${u.email}.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali</span>
            </Link>
            {manage && (
              <>
                {u.status === 'DISABLED' ? (
                  <Button variant="secondary" onClick={() => act(() => post(`/users/${id}/enable`), 'Akun diaktifkan.')}>
                    <UserCheck className="h-4 w-4" />
                    <span>Enable</span>
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    onClick={() => {
                      const reason = prompt('Alasan menonaktifkan akun ini?')
                      if (reason !== null) act(() => post(`/users/${id}/disable`, { reason }), 'Akun dinonaktifkan.')
                    }}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <span>Disable</span>
                  </Button>
                )}
                {u.credential?.lockoutUntil && (
                  <Button variant="secondary" onClick={() => act(() => post(`/users/${id}/unlock`), 'Lockout dibuka.')}>
                    <LockOpen className="h-4 w-4" />
                    <span>Unlock</span>
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => act(() => post(`/users/${id}/send-reset`), 'Kode reset kata sandi telah dikirim.')}
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Kirim Kode Reset</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    confirm('Akhiri seluruh sesi aktif pengguna ini?') &&
                    act(() => post(`/users/${id}/force-logout`), 'Seluruh sesi dihentikan.')
                  }
                >
                  <LogOut className="h-4 w-4" />
                  <span>Force Logout</span>
                </Button>
              </>
            )}
          </div>
        }
      />

      {msg && (
        <div className="rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm font-semibold text-success-700">
          {msg}
        </div>
      )}
      <ErrorText error={error} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card title="Informasi Akun" desc="Metadata autentikasi dan status keamanan akun.">
            <dl className="divide-y divide-gray-100 text-sm">
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-gray-500">Email</dt>
                <dd className="font-semibold text-gray-900">{u.email}</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-gray-500">Status Akun</dt>
                <dd className="flex items-center gap-2">
                  <Badge value={u.status} />
                  {u.statusReason && <span className="text-xs text-gray-500">({u.statusReason})</span>}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-gray-500">Tipe Pengguna</dt>
                <dd>
                  <Badge value={u.userType} />
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-gray-500">Metode Login</dt>
                <dd className="font-medium text-gray-800">
                  {u.credential?.authProvider}
                  {u.credential?.ssoBound ? ' (SSO Bound)' : ''}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-gray-500">Login Terakhir</dt>
                <dd className="text-gray-700">{fmtDateTime(u.lastLoginAt) || '—'}</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-gray-500">Sesi Aktif</dt>
                <dd className="font-bold text-brand-600">{u.activeSessions}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card
            title="Penetapan Peran (Assigned Roles)"
            desc="Pilih peran otorisasi yang dimiliki oleh pengguna ini."
            actions={
              manage && (
                <Button
                  onClick={() =>
                    act(
                      () =>
                        api(`/users/${id}/roles`, {
                          method: 'PUT',
                          body: JSON.stringify({ roleIds: picked }),
                        }),
                      'Peran pengguna berhasil disimpan.'
                    )
                  }
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Simpan Peran</span>
                </Button>
              )
            }
          >
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {roles
                .filter((r) => r.scope === u.userType)
                .map((r) => {
                  const checked = picked.includes(r.id)
                  return (
                    <label
                      key={r.id}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-sm transition-all cursor-pointer ${
                        checked
                          ? 'border-brand-300 bg-brand-50/60'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={!manage}
                        checked={checked}
                        onChange={(e) =>
                          setPicked((p) => (e.target.checked ? [...p, r.id] : p.filter((x) => x !== r.id)))
                        }
                        className="mt-0.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <div>
                        <span className="block font-mono text-xs font-bold text-gray-900">{r.code}</span>
                        <span className="text-xs text-gray-600">{r.name}</span>
                      </div>
                    </label>
                  )
                })}
            </div>
          </Card>
        </div>
      </div>

      <Card title="Riwayat Sesi Login (User Sessions)" desc="Daftar sesi perangkat yang pernah masuk ke akun ini.">
        <DataTable
          list={sessions}
          columns={[
            { key: 'startedAt', header: 'Waktu Masuk', sortable: true, render: (r) => fmtDateTime(r.startedAt) },
            { key: 'lastSeenAt', header: 'Terakhir Aktif', sortable: true, render: (r) => fmtDateTime(r.lastSeenAt) },
            { key: 'authMethod', header: 'Metode' },
            { key: 'ipAddress', header: 'Alamat IP' },
            {
              key: 'endReason',
              header: 'Status Sesi',
              render: (r) =>
                r.isActive ? (
                  <Badge value="ACTIVE" />
                ) : (
                  <span className="text-xs text-gray-500">
                    {r.endReason ?? 'Ended'} ({fmtDateTime(r.endedAt)})
                  </span>
                ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
