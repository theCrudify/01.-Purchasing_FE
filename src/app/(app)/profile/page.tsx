'use client'
import { useEffect, useState } from 'react'
import { Building2, CheckCircle2, PenTool, Shield, Upload, UserCheck } from 'lucide-react'
import { AutoForm } from '@/components/form'
import { Badge, Button, Card, ErrorText, PageHeader } from '@/components/ui'
import { api, patch, post } from '@/lib/api'

export default function ProfilePage() {
  const [p, setP] = useState<any>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sigV, setSigV] = useState(0)

  const load = () =>
    api('/profile')
      .then((r) => setP(r.data))
      .catch((e) => setError(e.message))

  useEffect(() => {
    load()
  }, [])

  if (!p) {
    return (
      <div className="space-y-4">
        <PageHeader title="My Profile" />
        <ErrorText error={error} />
      </div>
    )
  }

  const initials = p.displayName
    ? p.displayName
        .split(' ')
        .map((w: string) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U'

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal details, password, and digital approval signature."
      />

      {msg && (
        <div className="flex items-center gap-2 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-xs font-semibold text-success-700">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success-600" />
          <span>{msg}</span>
        </div>
      )}
      <ErrorText error={error} />

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white shadow-theme-xs">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{p.displayName}</h2>
                <Badge value={p.userType} />
                <Badge value="ACTIVE" />
              </div>
              <p className="mt-0.5 text-xs text-gray-500">{p.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                {p.employeeNo && (
                  <span className="inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-100 px-2 py-0.5 font-mono font-semibold text-gray-800">
                    ID: {p.employeeNo}
                  </span>
                )}
                {p.departmentName && (
                  <span className="inline-flex items-center gap-1 text-gray-600">
                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                    {p.departmentName}
                  </span>
                )}
                {p.superiorName && (
                  <span className="inline-flex items-center gap-1 text-gray-600">
                    <UserCheck className="h-3.5 w-3.5 text-gray-400" />
                    Superior: <strong>{p.superiorName}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs">
            <span className="block font-medium text-gray-400 uppercase text-[10px]">Authentication</span>
            <span className="mt-0.5 inline-flex items-center gap-1.5 font-semibold text-gray-800">
              <Shield className="h-3.5 w-3.5 text-brand-600" />
              {p.authProvider}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Card title="Personal Information" desc="Update your display name and phone number.">
            <AutoForm
              fields={[
                { name: 'displayName', label: 'Full Name', required: true },
                { name: 'phone', label: 'Phone Number' },
              ]}
              initial={p}
              submitLabel="Save Changes"
              onSubmit={async (v) => {
                setP((await patch('/profile', v)).data)
                setMsg('Profile updated.')
              }}
            />
          </Card>

          {p.authProvider === 'LOCAL' && (
            <Card
              title="Change Password"
              desc="Minimum 12 characters combining letters and digits. Changing password signs out other active sessions."
            >
              <AutoForm
                fields={[
                  { name: 'currentPassword', label: 'Current Password', type: 'password', required: true },
                  {
                    name: 'newPassword',
                    label: 'New Password (min. 12 chars)',
                    type: 'password',
                    required: true,
                  },
                ]}
                submitLabel="Update Password"
                onSubmit={async (v) => {
                  await post('/profile/password', v)
                  setMsg('Password changed. Other sessions have been signed out.')
                }}
              />
            </Card>
          )}
        </div>

        <div className="lg:col-span-5">
          <Card
            title="Digital Signature"
            desc="Printed automatically on approved procurement documents."
          >
            <div className="space-y-4">
              <div className="flex min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                {p.hasSignature ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={sigV}
                    src={`/api/profile/signature?v=${sigV}`}
                    alt="Your signature"
                    className="max-h-28 object-contain"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <PenTool className="mx-auto h-7 w-7 text-gray-300" />
                    <p className="mt-1.5 text-xs font-medium text-gray-500">No signature uploaded</p>
                    <p className="text-[11px] text-gray-400">PNG or JPEG (max 2 MB)</p>
                  </div>
                )}
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  setError(null)
                  setMsg(null)
                  try {
                    await post('/profile/signature', new FormData(e.currentTarget))
                    setSigV((x) => x + 1)
                    await load()
                    setMsg('Signature uploaded.')
                  } catch (err) {
                    setError((err as Error).message)
                  }
                }}
                className="space-y-3"
              >
                <input
                  name="file"
                  type="file"
                  accept="image/png,image/jpeg"
                  required
                  aria-label="Signature image"
                  className="block w-full rounded-lg border border-gray-300 bg-white text-xs text-gray-700 file:mr-3 file:rounded-l-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                />
                <Button type="submit" className="w-full">
                  <Upload className="h-4 w-4" />
                  <span>Upload Signature</span>
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
