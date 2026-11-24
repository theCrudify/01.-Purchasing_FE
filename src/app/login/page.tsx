'use client'
import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  Shield,
  ShoppingCart,
  Sparkles,
  Truck,
  UserCheck,
  Zap,
} from 'lucide-react'
import { AuthLayout } from '@/components/auth-layout'
import { api } from '@/lib/api'

const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : null)

interface DemoAccount {
  id: string
  type: 'internal' | 'vendor'
  label: string
  name: string
  role: string
  email: string
  password: string
  badgeColor: string
  description: string
  icon: 'admin' | 'buyer' | 'approver' | 'finance' | 'vendor' | 'mitra'
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  // --- INTERNAL ACCOUNTS ---
  {
    id: 'admin',
    type: 'internal',
    label: 'Admin',
    name: 'Administrator',
    role: 'Superadmin / Procurement Lead',
    email: 'admin@purchasing.local',
    password: 'Password123!',
    badgeColor: 'border-blue-200 bg-blue-50 text-blue-700',
    description: 'Akses penuh ke semua master data, PR, PO, workflow approval, users & audit trail.',
    icon: 'admin',
  },
  {
    id: 'buyer',
    type: 'internal',
    label: 'Buyer',
    name: 'Budi Buyer',
    role: 'Purchasing Specialist / Buyer',
    email: 'buyer@purchasing.local',
    password: 'Password123!',
    badgeColor: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    description: 'Buat Purchase Request (PR), terbitkan RFQ ke supplier, evaluasi quotation & terbitkan PO.',
    icon: 'buyer',
  },
  {
    id: 'approver',
    type: 'internal',
    label: 'Approver',
    name: 'Siti Approver',
    role: 'Department Head / Approver',
    email: 'approver@purchasing.local',
    password: 'Password123!',
    badgeColor: 'border-purple-200 bg-purple-700 bg-purple-50',
    description: 'Persetujuan berjenjang untuk dokumen PR, PO, Kontrak & evaluasi supplier.',
    icon: 'approver',
  },
  {
    id: 'finance',
    type: 'internal',
    label: 'Finance',
    name: 'Fajar Finance',
    role: 'Finance & Treasury Staff',
    email: 'finance@purchasing.local',
    password: 'Password123!',
    badgeColor: 'border-amber-200 bg-amber-50 text-amber-700',
    description: 'Verifikasi Invoice AP vendor, monitoring pencairan kasbon & outgoing payment.',
    icon: 'finance',
  },

  // --- VENDOR ACCOUNTS ---
  {
    id: 'vendor',
    type: 'vendor',
    label: 'PT Sumber Makmur',
    name: 'PT Sumber Makmur Sentosa',
    role: 'Rekanan Supplier (Barang & Material)',
    email: 'vendor@supplier.com',
    password: 'Password123!',
    badgeColor: 'border-teal-200 bg-teal-50 text-teal-700',
    description: 'Portal Rekanan: Terima undangan RFQ, kirim Quotation harga, pantau PO & terbitkan e-Invoice.',
    icon: 'vendor',
  },
  {
    id: 'mitra',
    type: 'vendor',
    label: 'CV Mitra Jaya',
    name: 'CV Mitra Jaya Perkasa',
    role: 'Rekanan Kontraktor (Jasa & Maintenance)',
    email: 'mitra@supplier.com',
    password: 'Password123!',
    badgeColor: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    description: 'Portal Rekanan: Bidding tender proyek jasa, konfirmasi PO, konfirmasi pengiriman barang (GR).',
    icon: 'mitra',
  },
]

function renderAccountIcon(icon: DemoAccount['icon']) {
  switch (icon) {
    case 'admin':
      return <Shield className="h-4 w-4 text-blue-600" />
    case 'buyer':
      return <ShoppingCart className="h-4 w-4 text-emerald-600" />
    case 'approver':
      return <UserCheck className="h-4 w-4 text-purple-600" />
    case 'finance':
      return <CreditCard className="h-4 w-4 text-amber-600" />
    case 'vendor':
      return <Building2 className="h-4 w-4 text-teal-600" />
    case 'mitra':
      return <Truck className="h-4 w-4 text-indigo-600" />
  }
}

function LoginForm() {
  const router = useRouter()
  const sp = useSearchParams()
  const [error, setError] = useState(sp.get('error') ?? '')
  const [busy, setBusy] = useState(false)
  const [sso, setSso] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isVendor, setIsVendor] = useState(false)
  const [remember, setRemember] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    api('/auth/providers')
      .then((r) => setSso(!!r.data?.microsoft))
      .catch(() => {})
  }, [])

  const selectDemoAccount = (acc: DemoAccount, autoSubmit = false) => {
    setIsVendor(acc.type === 'vendor')
    setEmail(acc.email)
    setPassword(acc.password)
    setSelectedDemoId(acc.id)
    setError('')

    if (autoSubmit) {
      handleLogin(undefined, acc.email, acc.password)
    }
  }

  const copyToClipboard = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1800)
  }

  async function handleLogin(e?: React.FormEvent<HTMLFormElement>, overrideEmail?: string, overridePassword?: string) {
    if (e) e.preventDefault()
    setBusy(true)
    setError('')
    const targetEmail = (overrideEmail ?? email).trim()
    const targetPassword = overridePassword ?? password

    if (!targetEmail || !targetPassword) {
      setError('Email dan password wajib diisi.')
      setBusy(false)
      return
    }

    try {
      await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      })
      const me = await api('/auth/me')
      router.replace(safeNext(sp.get('next')) ?? (me.data.userType === 'BP' ? '/portal' : '/dashboard'))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const activeDemoAccounts = DEMO_ACCOUNTS.filter((acc) =>
    isVendor ? acc.type === 'vendor' : acc.type === 'internal'
  )

  return (
    <div className="space-y-5">
      {/* Workspace Role Switcher */}
      <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-semibold shadow-inner">
        <button
          type="button"
          onClick={() => {
            setIsVendor(false)
            setError('')
            if (selectedDemoId && DEMO_ACCOUNTS.find((a) => a.id === selectedDemoId)?.type === 'vendor') {
              setSelectedDemoId(null)
              setEmail('')
              setPassword('')
            }
          }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 transition cursor-pointer ${
            !isVendor ? 'bg-white text-gray-900 shadow-theme-xs font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Shield className="h-3.5 w-3.5 text-brand-600" />
          <span>Internal Staff</span>
          <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-semibold text-blue-700">4 Demo</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setIsVendor(true)
            setError('')
            if (selectedDemoId && DEMO_ACCOUNTS.find((a) => a.id === selectedDemoId)?.type === 'internal') {
              setSelectedDemoId(null)
              setEmail('')
              setPassword('')
            }
          }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 transition cursor-pointer ${
            isVendor ? 'bg-white text-gray-900 shadow-theme-xs font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Building2 className="h-3.5 w-3.5 text-teal-600" />
          <span>Vendor & Supplier</span>
          <span className="rounded-full bg-teal-100 px-1.5 py-0.2 text-[10px] font-semibold text-teal-700">2 Demo</span>
        </button>
      </div>

      {/* Quick Demo Chips */}
      <div className="rounded-xl border border-dashed border-brand-200 bg-brand-25/50 p-2.5">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand-900">
            <Sparkles className="h-3.5 w-3.5 text-brand-600 animate-pulse" />
            <span>Pilih Cepat Akun Demo {isVendor ? '(Vendor)' : '(Internal)'}:</span>
          </div>
          <span className="text-[10px] text-gray-500">Klik untuk isi instan</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {activeDemoAccounts.map((acc) => {
            const isSelected = selectedDemoId === acc.id
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => selectDemoAccount(acc)}
                className={`group flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? 'border-brand-600 bg-brand-600 text-white shadow-theme-xs'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50/50'
                }`}
              >
                {isSelected ? (
                  <Check className="h-3 w-3 text-white" />
                ) : (
                  renderAccountIcon(acc.icon)
                )}
                <span>{acc.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-error-200 bg-error-50 p-3.5 text-xs text-error-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-error-600 mt-0.5" />
          <div className="min-w-0 flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-gray-700">
              {isVendor ? 'Vendor Email' : 'Work Email'} <span className="text-error-500 font-bold">*</span>
            </label>
            {selectedDemoId && (
              <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                <Check className="h-3 w-3" /> Akun demo aktif
              </span>
            )}
          </div>
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setSelectedDemoId(null)
            }}
            placeholder={isVendor ? 'vendor@supplier.com' : 'admin@purchasing.local'}
            className="h-[42px] w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-theme-xs transition-colors focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-gray-700">
              Password <span className="text-error-500 font-bold">*</span>
            </label>
            <span className="text-[11px] text-gray-400">Default demo: Password123!</span>
          </div>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setSelectedDemoId(null)
              }}
              placeholder="Masukkan password"
              className="h-[42px] w-full rounded-lg border border-gray-300 bg-white pl-3.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 shadow-theme-xs transition-colors focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-medium text-gray-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
            />
            <span>Ingat saya</span>
          </label>
          <Link
            className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
            href="/forgot-password"
          >
            Lupa password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-700 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
        >
          {busy ? (
            <span>Memproses Masuk…</span>
          ) : (
            <>
              <Zap className="h-4 w-4 fill-white" />
              <span>Masuk {isVendor ? 'Portal Rekanan' : 'Purchasing Workspace'}</span>
            </>
          )}
        </button>
      </form>

      {/* Demo Credentials Set Cards (Detailed Helper) */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-gray-200/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-white">
              <KeyRound className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900 leading-none">
                Daftar Set Akun Demo ({isVendor ? 'Vendor' : 'Internal'})
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Pilih profil untuk auto-fill atau langsung login
              </p>
            </div>
          </div>
          <span className="rounded bg-brand-50 border border-brand-200 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
            Demo Ready
          </span>
        </div>

        <div className="space-y-2">
          {activeDemoAccounts.map((acc) => {
            const isSelected = selectedDemoId === acc.id
            return (
              <div
                key={acc.id}
                onClick={() => selectDemoAccount(acc)}
                className={`group relative rounded-lg border p-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/40 shadow-theme-xs ring-2 ring-brand-500/15'
                    : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 border border-gray-200 mt-0.5">
                      {renderAccountIcon(acc.icon)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                          {acc.name}
                        </span>
                        <span className={`inline-block rounded px-1.5 py-0.2 text-[10px] font-semibold border ${acc.badgeColor}`}>
                          {acc.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        {acc.description}
                      </p>

                      {/* Credential Details */}
                      <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-gray-600 bg-gray-50 rounded border border-gray-200 px-2 py-1 w-fit flex-wrap">
                        <span className="text-gray-900 font-semibold">{acc.email}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-500">{acc.password}</span>
                        <button
                          type="button"
                          onClick={(e) => copyToClipboard(acc.email, `${acc.id}-email`, e)}
                          title="Copy Email"
                          className="text-gray-400 hover:text-brand-600 transition-colors ml-1"
                        >
                          {copiedKey === `${acc.id}-email` ? (
                            <Check className="h-3 w-3 text-success-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        selectDemoAccount(acc, true)
                      }}
                      disabled={busy}
                      title="Isi form dan langsung masuk"
                      className="inline-flex items-center justify-center gap-1 rounded-md bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-theme-xs hover:bg-brand-700 active:scale-95 transition-all cursor-pointer"
                    >
                      <span>Masuk</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        selectDemoAccount(acc, false)
                      }}
                      className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-600 hover:border-brand-300 hover:text-brand-600 transition-all cursor-pointer"
                    >
                      {isSelected ? 'Terisi ✓' : 'Pakai'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Microsoft SSO */}
      {sso && !isVendor && (
        <div>
          <div className="relative mb-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <span className="relative bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Atau masuk menggunakan
            </span>
          </div>
          <a
            href={`/api/auth/entra/start?next=${encodeURIComponent(safeNext(sp.get('next')) ?? '/dashboard')}`}
            className="flex h-[42px] w-full items-center justify-center gap-2.5 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 shadow-theme-xs hover:bg-gray-50 transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            <span>Sign in with Microsoft Entra</span>
          </a>
        </div>
      )}

      {/* Vendor Onboarding Link */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-center">
        <p className="text-xs text-gray-600">Rekanan atau supplier baru yang belum terdaftar?</p>
        <Link
          href="/portal/register"
          className="mt-1 inline-block text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
        >
          Daftarkan akun vendor baru →
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Masuk ke Sistem"
      subtitle="Akses purchasing workspace untuk staf internal atau portal mandiri rekanan vendor."
    >
      <Suspense fallback={<div className="py-12 text-center text-sm text-gray-500">Memuat formulir login…</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  )
}
