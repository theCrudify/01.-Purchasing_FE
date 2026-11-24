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
  Truck,
  UserCheck,
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
  description: string
  icon: 'admin' | 'buyer' | 'approver' | 'finance' | 'vendor' | 'mitra'
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'admin',
    type: 'internal',
    label: 'Admin',
    name: 'Administrator',
    role: 'Superadmin',
    email: 'admin@purchasing.local',
    password: 'Password123!',
    description: 'Akses penuh master data, 15 dokumen transaksi, approval & audit log.',
    icon: 'admin',
  },
  {
    id: 'buyer',
    type: 'internal',
    label: 'Buyer',
    name: 'Budi Buyer',
    role: 'Purchasing Staff',
    email: 'buyer@purchasing.local',
    password: 'Password123!',
    description: '3 PR aktif, 1 Tender RFQ, PO rilis & Kasbon perjalanan dinas.',
    icon: 'buyer',
  },
  {
    id: 'approver',
    type: 'internal',
    label: 'Approver',
    name: 'Siti Approver',
    role: 'Dept Head',
    email: 'approver@purchasing.local',
    password: 'Password123!',
    description: '2 tugas approval aktif di Inbox: PR-2026-0002 & INV-2026-0001.',
    icon: 'approver',
  },
  {
    id: 'finance',
    type: 'internal',
    label: 'Finance',
    name: 'Fajar Finance',
    role: 'Finance & Treasury',
    email: 'finance@purchasing.local',
    password: 'Password123!',
    description: 'Tagihan AP vendor, bukti Outgoing Payment & kasbon karyawan.',
    icon: 'finance',
  },
  {
    id: 'vendor',
    type: 'vendor',
    label: 'PT Sumber Makmur',
    name: 'PT Sumber Makmur Sentosa',
    role: 'Supplier Material',
    email: 'vendor@supplier.com',
    password: 'Password123!',
    description: 'PO-2026-0001 siap di-Acknowledge, Quotation, e-Invoice & bukti bayar.',
    icon: 'vendor',
  },
  {
    id: 'mitra',
    type: 'vendor',
    label: 'CV Mitra Jaya',
    name: 'CV Mitra Jaya Perkasa',
    role: 'Vendor Jasa',
    email: 'mitra@supplier.com',
    password: 'Password123!',
    description: 'Undangan Tender RFQ-2026-0001, draft penawaran & PO-2026-0003.',
    icon: 'mitra',
  },
]

function AccountIcon({ icon, active }: { icon: DemoAccount['icon']; active?: boolean }) {
  const cls = active ? 'h-4 w-4 text-brand-600' : 'h-4 w-4 text-gray-500'
  switch (icon) {
    case 'admin':
      return <Shield className={cls} />
    case 'buyer':
      return <ShoppingCart className={cls} />
    case 'approver':
      return <UserCheck className={cls} />
    case 'finance':
      return <CreditCard className={cls} />
    case 'vendor':
      return <Building2 className={cls} />
    case 'mitra':
      return <Truck className={cls} />
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
  const [copied, setCopied] = useState(false)

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
    if (autoSubmit) handleLogin(undefined, acc.email, acc.password)
  }

  const copyCredentials = (acc: DemoAccount) => {
    navigator.clipboard.writeText(`${acc.email} / ${acc.password}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
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
  const selectedAccount = DEMO_ACCOUNTS.find((a) => a.id === selectedDemoId) ?? null

  return (
    <div className="space-y-4">
      {/* Workspace Role Switcher */}
      <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setIsVendor(false)
            setError('')
            if (selectedAccount?.type === 'vendor') {
              setSelectedDemoId(null)
              setEmail('')
              setPassword('')
            }
          }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 transition cursor-pointer ${
            !isVendor ? 'bg-white text-gray-900 shadow-theme-xs' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Shield className="h-3.5 w-3.5 text-brand-600" />
          <span>Internal Staff</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setIsVendor(true)
            setError('')
            if (selectedAccount?.type === 'internal') {
              setSelectedDemoId(null)
              setEmail('')
              setPassword('')
            }
          }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 transition cursor-pointer ${
            isVendor ? 'bg-white text-gray-900 shadow-theme-xs' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Building2 className="h-3.5 w-3.5 text-brand-600" />
          <span>Vendor & Supplier</span>
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-error-200 bg-error-50 p-3 text-xs text-error-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error-600" />
          <div className="min-w-0 flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={(e) => handleLogin(e)} className="space-y-3.5">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-700">
            {isVendor ? 'Vendor Email' : 'Work Email'} <span className="font-bold text-error-500">*</span>
          </label>
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
            className="h-[40px] w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-theme-xs transition-colors focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-700">
            Password <span className="font-bold text-error-500">*</span>
          </label>
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
              className="h-[40px] w-full rounded-lg border border-gray-300 bg-white pl-3.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 shadow-theme-xs transition-colors focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
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
          <Link className="font-semibold text-brand-600 hover:text-brand-700 hover:underline" href="/forgot-password">
            Lupa password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="flex h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-700 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
        >
          <span>{busy ? 'Memproses Masuk…' : `Masuk ${isVendor ? 'Portal Rekanan' : 'Workspace'}`}</span>
          {!busy && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      {/* Single Compact Demo Accounts Selector */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
            <KeyRound className="h-3.5 w-3.5 text-brand-600" />
            <span>Akun Demo {isVendor ? 'Vendor' : 'Internal'}</span>
          </div>
          <span className="text-[11px] text-gray-500">Klik untuk isi otomatis</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {activeDemoAccounts.map((acc) => {
            const isSelected = selectedDemoId === acc.id
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => selectDemoAccount(acc)}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/70 ring-2 ring-brand-500/15'
                    : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-gray-50'
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${
                    isSelected ? 'border-brand-200 bg-white' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <AccountIcon icon={acc.icon} active={isSelected} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-gray-900">{acc.label}</div>
                  <div className="truncate text-[10px] text-gray-500">{acc.role}</div>
                </div>
              </button>
            )
          })}
        </div>

        {selectedAccount && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-brand-200 bg-white px-3 py-2 text-[11px]">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-mono text-gray-800">
                <span className="truncate font-semibold">{selectedAccount.email}</span>
                <span className="text-gray-300">/</span>
                <span className="shrink-0 text-gray-500">{selectedAccount.password}</span>
                <button
                  type="button"
                  onClick={() => copyCredentials(selectedAccount)}
                  title="Salin kredensial"
                  className="text-gray-400 hover:text-brand-600 cursor-pointer"
                >
                  {copied ? <Check className="h-3 w-3 text-success-600" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <p className="mt-0.5 truncate text-gray-500">{selectedAccount.description}</p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => selectDemoAccount(selectedAccount, true)}
              className="shrink-0 rounded-md bg-brand-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-700 transition-colors cursor-pointer"
            >
              Masuk →
            </button>
          </div>
        )}
      </div>

      {/* Microsoft SSO */}
      {sso && !isVendor && (
        <div>
          <div className="relative mb-3 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <span className="relative bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Atau masuk menggunakan
            </span>
          </div>
          <a
            href={`/api/auth/entra/start?next=${encodeURIComponent(safeNext(sp.get('next')) ?? '/dashboard')}`}
            className="flex h-[40px] w-full items-center justify-center gap-2.5 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 shadow-theme-xs hover:bg-gray-50 transition"
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
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs">
        <span className="text-gray-600">Rekanan atau supplier baru?</span>
        <Link href="/portal/register" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
          Daftar akun vendor →
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Masuk ke Sistem"
      subtitle="Akses purchasing workspace untuk staf internal atau portal rekanan vendor."
    >
      <Suspense fallback={<div className="py-12 text-center text-sm text-gray-500">Memuat formulir login…</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  )
}
