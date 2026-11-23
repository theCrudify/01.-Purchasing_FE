'use client'
import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { AuthLayout } from '@/components/auth-layout'
import { api } from '@/lib/api'

const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : null)

function LoginForm() {
  const router = useRouter()
  const sp = useSearchParams()
  const [error, setError] = useState(sp.get('error') ?? '')
  const [busy, setBusy] = useState(false)
  const [sso, setSso] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isVendor, setIsVendor] = useState(false)
  const [remember, setRemember] = useState(false)

  useEffect(() => {
    api('/auth/providers')
      .then((r) => setSso(!!r.data?.microsoft))
      .catch(() => {})
  }, [])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const f = new FormData(e.currentTarget)
    try {
      await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: f.get('email'), password: f.get('password') }),
      })
      const me = await api('/auth/me')
      router.replace(safeNext(sp.get('next')) ?? (me.data.userType === 'BP' ? '/portal' : '/dashboard'))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const themeColor = isVendor ? '#1e3a8a' : '#c3002f' // Navy for Vendor, Kansai Red for Internal

  return (
    <div className="space-y-6">
      {/* Workspace Role Switcher */}
      <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setIsVendor(false)
            setError('')
          }}
          className={`flex-1 rounded-lg py-2.5 transition cursor-pointer ${
            !isVendor ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Company KPIN (Internal)
        </button>
        <button
          type="button"
          onClick={() => {
            setIsVendor(true)
            setError('')
          }}
          className={`flex-1 rounded-lg py-2.5 transition cursor-pointer ${
            isVendor ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Vendor & Supplier
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="min-w-0 flex-1 font-medium">{error}</div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            {isVendor ? 'Vendor Code or Email' : 'Email or Employee NIK'}{' '}
            <span className="text-rose-600 font-bold">*</span>
          </label>
          <input
            name="email"
            type="text"
            required
            autoComplete="username"
            placeholder={isVendor ? 'e.g. SM0111 or vendor@company.com' : 'e.g. admin@kpin.local or NIK'}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs transition-colors focus:border-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Kata Sandi / Password <span className="text-rose-600 font-bold">*</span>
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="Masukkan kata sandi Anda"
              className="w-full rounded-xl border border-slate-300 bg-white pl-4 pr-11 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs transition-colors focus:border-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-medium text-slate-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span>Biarkan saya tetap masuk</span>
          </label>
          <Link
            className="font-semibold text-rose-600 hover:text-rose-700 hover:underline"
            href="/forgot-password"
          >
            Lupa kata sandi?
          </Link>
        </div>

        <button
          type="submit"
          disabled={busy}
          style={{ backgroundColor: themeColor }}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-md hover:brightness-95 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
        >
          {busy ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Sedang Masuk…</span>
            </span>
          ) : (
            <span>Masuk / Sign In</span>
          )}
        </button>
      </form>

      {/* Microsoft SSO (for Internal Staff) */}
      {sso && !isVendor && (
        <div>
          <div className="relative mb-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Atau masuk dengan akun kantor
            </span>
          </div>
          <a
            href={`/api/auth/entra/start?next=${encodeURIComponent(safeNext(sp.get('next')) ?? '/dashboard')}`}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            <span>Microsoft Entra ID (Single Sign-On)</span>
          </a>
        </div>
      )}

      {/* Vendor Onboarding Link */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
        <p className="text-xs text-slate-600">
          Belum terdaftar sebagai rekanan / vendor resmi PT Kansai Paint Indonesia?
        </p>
        <Link
          href="/portal/register"
          className="mt-1.5 inline-block text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline"
        >
          Registrasi Rekanan Baru (Vendor Registration) →
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Sign In — Portal KPIN"
      subtitle="Selamat datang di sistem Purchasing & Supplier Portal PT Kansai Paint Indonesia."
      themeColor="#c3002f"
    >
      <Suspense fallback={<div className="py-12 text-center text-sm text-slate-500">Memuat formulir login…</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  )
}
