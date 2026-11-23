'use client'
import { useEffect, useState } from 'react'
import { AutoForm } from '@/components/form'
import { Button, Card, ErrorText, PageHeader } from '@/components/ui'
import { api, patch, post } from '@/lib/api'

export default function ProfilePage() {
  const [p, setP] = useState<any>(null)
  const [msg, setMsg] = useState<string | null>(null), [error, setError] = useState<string | null>(null)
  const [sigV, setSigV] = useState(0)
  const load = () => api('/profile').then((r) => setP(r.data)).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])
  if (!p) return <ErrorText error={error} />
  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title="My profile" />
      {msg && <p className="text-sm text-green-700">{msg}</p>}
      <ErrorText error={error} />
      <Card title="Details">
        <p className="mb-3 text-sm text-gray-600">{p.email} · {p.userType}{p.employeeNo ? ` · NIK ${p.employeeNo}` : ''}{p.departmentName ? ` · ${p.departmentName}` : ''}{p.superiorName ? ` · reports to ${p.superiorName}` : ''}</p>
        <AutoForm fields={[{ name: 'displayName', label: 'Name', required: true }, { name: 'phone', label: 'Phone' }]} initial={p}
          onSubmit={async (v) => { setP((await patch('/profile', v)).data); setMsg('Profile saved') }} />
      </Card>
      {p.authProvider === 'LOCAL' && (
        <Card title="Change password">
          <AutoForm fields={[
            { name: 'currentPassword', label: 'Current password', type: 'password', required: true },
            { name: 'newPassword', label: 'New password (min. 12, letters + digits)', type: 'password', required: true },
          ]} submitLabel="Change password" onSubmit={async (v) => { await post('/profile/password', v); setMsg('Password changed. Other sessions were signed out.') }} />
        </Card>
      )}
      <Card title="Signature (printed on approved documents)">
        {p.hasSignature && <img key={sigV} src={`/api/profile/signature?v=${sigV}`} alt="Your signature" className="mb-3 max-h-24 border" />}
        <form onSubmit={async (e) => {
          e.preventDefault(); setError(null)
          try { await post('/profile/signature', new FormData(e.currentTarget)); setSigV((x) => x + 1); await load(); setMsg('Signature uploaded') } catch (err) { setError((err as Error).message) }
        }} className="flex items-center gap-2">
          <input name="file" type="file" accept="image/png,image/jpeg" required aria-label="Signature image" className="text-sm" />
          <Button type="submit">Upload</Button>
        </form>
      </Card>
    </div>
  )
}
