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

  return (
    <div className="space-y-5">
      {/* Workspace Role Switcher */}
      <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setIsVendor(false)
            setError('')
          }}
          className={`flex-1 rounded-lg py-2 transition cursor-pointer ${
            !isVendor ? 'bg-white text-gray-900 shadow-theme-xs' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Internal Staff
        </button>
        <button
          type="button"
          onClick={() => {
            setIsVendor(true)
            setError('')
          }}
          className={`flex-1 rounded-lg py-2 transition cursor-pointer ${
            isVendor ? 'bg-white text-gray-900 shadow-theme-xs' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Vendor & Supplier
        </button>
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

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700">
            {isVendor ? 'Vendor Email' : 'Work Email'} <span className="text-error-500 font-bold">*</span>
          </label>
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            placeholder={isVendor ? 'vendor@company.com' : 'name@company.com'}
            className="h-[42px] w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-theme-xs transition-colors focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700">
            Password <span className="text-error-500 font-bold">*</span>
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
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
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span>Keep me signed in</span>
          </label>
          <Link
            className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
            href="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-700 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
        >
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      {/* Microsoft SSO */}
      {sso && !isVendor && (
        <div>
          <div className="relative mb-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <span className="relative bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Or continue with
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
            <span>Sign in with Microsoft</span>
          </a>
        </div>
      )}

      {/* Vendor Onboarding Link */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-center">
        <p className="text-xs text-gray-600">New business partner or supplier?</p>
        <Link
          href="/portal/register"
          className="mt-1 inline-block text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
        >
          Register a new vendor account →
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Sign In"
      subtitle="Enter your email and password to access your purchasing workspace."
    >
      <Suspense fallback={<div className="py-12 text-center text-sm text-gray-500">Loading sign in form…</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  )
}
