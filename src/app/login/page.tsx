'use client'
import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react'
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
  const [portalMode, setPortalMode] = useState(false)

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
      {/* Role / Workspace selector */}
      <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setPortalMode(false)}
          className={`flex-1 rounded-lg py-2 transition cursor-pointer ${
            !portalMode ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Internal Staff
        </button>
        <button
          type="button"
          onClick={() => setPortalMode(true)}
          className={`flex-1 rounded-lg py-2 transition cursor-pointer ${
            portalMode ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Vendor & Supplier
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="min-w-0 flex-1 font-medium">{error}</div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Work Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder={portalMode ? 'vendor@supplier.com' : 'employee@company.com'}
              aria-label="Email"
              className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition-colors focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Password
            </label>
            <Link
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
              href="/forgot-password"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              aria-label="Password"
              className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition-colors focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 rounded-md p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
        >
          {busy ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Authenticating…</span>
            </span>
          ) : (
            <>
              <span>Sign In as {portalMode ? 'Vendor' : 'Employee'}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Entra ID SSO */}
      {sso && !portalMode && (
        <div className="pt-2">
          <div className="relative mb-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Or sign in with SSO
            </span>
          </div>
          <a
            href={`/api/auth/entra/start?next=${encodeURIComponent(safeNext(sp.get('next')) ?? '/dashboard')}`}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-100 hover:border-slate-300 transition"
          >
            {/* Microsoft 4-square colored icon */}
            <svg className="h-4 w-4" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            <span>Microsoft Entra ID</span>
          </a>
        </div>
      )}

      {/* Vendor Onboarding Link */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-center">
        <p className="text-xs text-slate-600">
          Want to become an approved supplier or vendor?
        </p>
        <Link
          href="/portal/register"
          className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
        >
          <span>Register new business partner account</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome to KPIN"
      subtitle="Sign in with your authorized credentials to access your procurement workspace."
      badge="Secure Enterprise Gateway"
    >
      <Suspense fallback={<div className="py-12 text-center text-sm text-slate-500">Loading sign in form…</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  )
}
