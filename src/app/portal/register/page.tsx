'use client'
import Link from 'next/link'
import { useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  User,
} from 'lucide-react'
import { AuthLayout } from '@/components/auth-layout'

export default function VendorRegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    companyName: '',
    entityType: 'PT',
    taxId: '',
    category: 'GOODS',
    picName: '',
    picEmail: '',
    picPhone: '',
    picJobTitle: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.')
      return
    }
    if (!form.agreeTerms) {
      setError('Silakan setujui ketentuan pakta integritas dan tata tertib rekanan KPIN.')
      return
    }

    setBusy(true)
    try {
      await new Promise((r) => setTimeout(r, 800))
      setStep(4)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Registrasi Rekanan Baru"
      subtitle="Pendaftaran akun Business Partner & Rekanan resmi PT Kansai Paint Indonesia."
      themeColor="#1e3a8a" // TailAdmin Navy for Supplier Portal
    >
      <div className="space-y-6">
        {/* Step Indicator */}
        {step < 4 && (
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  step === 1 ? 'bg-[#1e3a8a] text-white' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                1
              </span>
              <span className={`text-xs ${step === 1 ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
                Perusahaan
              </span>
            </div>
            <div className="h-0.5 w-6 bg-slate-200" />
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  step === 2
                    ? 'bg-[#1e3a8a] text-white'
                    : step > 2
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                2
              </span>
              <span className={`text-xs ${step === 2 ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
                Kontak PIC
              </span>
            </div>
            <div className="h-0.5 w-6 bg-slate-200" />
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  step === 3 ? 'bg-[#1e3a8a] text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                3
              </span>
              <span className={`text-xs ${step === 3 ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
                Sandi
              </span>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-700"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="min-w-0 flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Step 1: Perusahaan */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Nama Badan Usaha / Perusahaan <span className="text-rose-600 font-bold">*</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="contoh: PT Maju Bersama Sejahtera"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Bentuk Badan Usaha <span className="text-rose-600 font-bold">*</span>
                </label>
                <select
                  value={form.entityType}
                  onChange={(e) => setForm({ ...form, entityType: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-2xs focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  <option value="PT">PT (Perseroan Terbatas)</option>
                  <option value="CV">CV (Persekutuan Komanditer)</option>
                  <option value="KOPERASI">Koperasi</option>
                  <option value="FIRMA">Firma</option>
                  <option value="INDIVIDUAL">Perorangan</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Kategori Pengadaan <span className="text-rose-600 font-bold">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-2xs focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  <option value="GOODS">Bahan Baku & Barang (Goods)</option>
                  <option value="SERVICES">Jasa & Konsultasi (Services)</option>
                  <option value="LOGISTICS">Ekspedisi & Logistik</option>
                  <option value="IT">Perangkat IT & Software</option>
                  <option value="FACILITY">Perawatan Gedung & Fasilitas</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                NPWP Perusahaan (16 Digit) <span className="text-rose-600 font-bold">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="01.234.567.8-901.000"
                  value={form.taxId}
                  onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!form.companyName.trim()) {
                  setError('Mohon isi nama legal perusahaan Anda.')
                  return
                }
                setError(null)
                setStep(2)
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a8a] py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-900 transition cursor-pointer"
            >
              <span>Lanjut ke Data Kontak PIC</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 2: Kontak PIC */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Nama Lengkap PIC Rekanan <span className="text-rose-600 font-bold">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="contoh: Budi Santoso"
                  value={form.picName}
                  onChange={(e) => setForm({ ...form, picName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Email Resmi Perusahaan (Untuk PO / RFQ) <span className="text-rose-600 font-bold">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="sales@perusahaan.com"
                  value={form.picEmail}
                  onChange={(e) => setForm({ ...form, picEmail: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Nomor HP / WhatsApp <span className="text-rose-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+62 812-3456-7890"
                    value={form.picPhone}
                    onChange={(e) => setForm({ ...form, picPhone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Jabatan PIC
                </label>
                <input
                  type="text"
                  placeholder="contoh: Account Manager"
                  value={form.picJobTitle}
                  onChange={(e) => setForm({ ...form, picJobTitle: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!form.picName.trim() || !form.picEmail.trim()) {
                    setError('Mohon lengkapi nama PIC dan email resmi perusahaan.')
                    return
                  }
                  setError(null)
                  setStep(3)
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1e3a8a] py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-900 transition cursor-pointer"
              >
                <span>Lanjut ke Kata Sandi</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Sandi & Pakta Integritas */}
        {step === 3 && (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Kata Sandi Portal Rekanan <span className="text-rose-600 font-bold">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={12}
                  placeholder="Minimal 12 karakter"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 shadow-2xs focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Konfirmasi Kata Sandi <span className="text-rose-600 font-bold">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={12}
                  placeholder="Ulangi kata sandi"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 shadow-2xs focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={(e) => setForm({ ...form, agreeTerms: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-blue-800 focus:ring-blue-700"
                />
                <span>
                  Saya menyatakan bahwa seluruh data legalitas perusahaan yang diberikan adalah sah dan benar, serta menyetujui{' '}
                  <strong className="text-slate-900">Pakta Integritas Rekanan PT Kansai Paint Indonesia</strong>.
                </span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1e3a8a] py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-900 disabled:opacity-50 transition cursor-pointer"
              >
                {busy ? 'Mengirim Pendaftaran…' : 'Kirim Pengajuan Rekanan'}
              </button>
            </div>
          </form>
        )}

        {/* Step 4: Selesai */}
        {step === 4 && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Pengajuan Berhasil Dikirim!</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pendaftaran rekanan untuk <strong className="text-slate-900">{form.companyName}</strong> telah diterima oleh tim Procurement PT Kansai Paint Indonesia. Tautan verifikasi email telah dikirimkan ke{' '}
              <strong className="text-slate-900">{form.picEmail}</strong>.
            </p>
            <div className="rounded-xl border border-emerald-200 bg-white p-3 text-xs text-slate-500">
              Tim Vendor Management akan melakukan verifikasi dokumen legalitas dalam 1 hari kerja.
            </div>
            <div className="pt-3">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a8a] py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-900 transition"
              >
                <span>Kembali ke Halaman Masuk Vendor</span>
              </Link>
            </div>
          </div>
        )}

        {step < 4 && (
          <div className="border-t border-slate-100 pt-3 text-center">
            <Link
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-900 hover:underline"
              href="/login"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Sudah memiliki akun rekanan? Masuk di sini</span>
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
