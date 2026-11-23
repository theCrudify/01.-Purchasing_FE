'use client'
import { useEffect, useState } from 'react'
import { Building2, CheckCircle2, KeyRound, Mail, PenTool, Phone, Shield, Upload, User, UserCheck } from 'lucide-react'
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
        <PageHeader title="Profil Pengguna" />
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
    : 'KP'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil & Pengaturan Akun"
        subtitle="Kelola informasi pribadi, keamanan kata sandi, dan spesimen tanda tangan digital untuk dokumen approval."
      />

      {msg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm font-semibold text-success-700">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success-600" />
          <span>{msg}</span>
        </div>
      )}
      <ErrorText error={error} />

      {/* Top User Identity Banner Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-[#c3002f] to-brand-600 text-xl font-extrabold text-white shadow-theme-sm">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{p.displayName}</h2>
                <Badge value={p.userType} />
                <Badge value="ACTIVE" />
              </div>
              <p className="mt-0.5 text-sm text-gray-500">{p.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                {p.employeeNo && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 font-mono font-semibold text-gray-800">
                    NIK: {p.employeeNo}
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
                    Atasan: <strong>{p.superiorName}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3 text-xs">
            <span className="block font-medium text-gray-400 uppercase">Metode Autentikasi</span>
            <span className="mt-1 inline-flex items-center gap-1.5 font-semibold text-gray-800">
              <Shield className="h-3.5 w-3.5 text-brand-500" />
              {p.authProvider === 'LOCAL' ? 'KPIN Local Credentials' : p.authProvider}
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Profile Forms */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Card title="Informasi Profil" desc="Perbarui nama tampilan dan nomor kontak Anda.">
            <AutoForm
              fields={[
                { name: 'displayName', label: 'Nama Lengkap', required: true },
                { name: 'phone', label: 'Nomor Telepon / WhatsApp' },
              ]}
              initial={p}
              submitLabel="Simpan Perubahan"
              onSubmit={async (v) => {
                setP((await patch('/profile', v)).data)
                setMsg('Profil berhasil diperbarui.')
              }}
            />
          </Card>

          {p.authProvider === 'LOCAL' && (
            <Card
              title="Ubah Kata Sandi"
              desc="Pastikan kata sandi baru minimal 12 karakter kombinasi huruf dan angka. Mengubah kata sandi akan mengeluarkan sesi perangkat lain."
            >
              <AutoForm
                fields={[
                  { name: 'currentPassword', label: 'Kata Sandi Saat Ini', type: 'password', required: true },
                  {
                    name: 'newPassword',
                    label: 'Kata Sandi Baru (Min. 12 karakter, huruf + angka)',
                    type: 'password',
                    required: true,
                  },
                ]}
                submitLabel="Perbarui Kata Sandi"
                onSubmit={async (v) => {
                  await post('/profile/password', v)
                  setMsg('Kata sandi berhasil diubah. Sesi di perangkat lain telah diakhiri.')
                }}
              />
            </Card>
          )}
        </div>

        <div className="lg:col-span-5">
          <Card
            title="Spesimen Tanda Tangan Digital"
            desc="Digunakan untuk pencetakan otomatis pada dokumen PR/PO yang telah Anda setujui."
          >
            <div className="space-y-4">
              <div className="flex min-h-[140px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-4">
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
                    <PenTool className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-1.5 text-xs font-medium text-gray-500">Belum ada spesimen tanda tangan</p>
                    <p className="text-[11px] text-gray-400">Format PNG transparan atau JPEG (maks. 2MB)</p>
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
                    setMsg('Spesimen tanda tangan berhasil diunggah.')
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
                  className="block w-full rounded-lg border border-gray-300 bg-white text-xs text-gray-700 file:mr-3 file:rounded-l-lg file:border-0 file:bg-brand-50 file:px-3.5 file:py-2.5 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                />
                <Button type="submit" className="w-full">
                  <Upload className="h-4 w-4" />
                  <span>Unggah Tanda Tangan</span>
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
