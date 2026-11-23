'use client'
import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react'
import { api } from '@/lib/api'

const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : null)

function LoginForm() {
  const router = useRouter()
  const sp = useSearchParams()
  const [error, setError] = useState(sp.get('error') ?? '')
  const [busy, setBusy] = useState(false)
  const [sso, setSso] = useState(false)

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
    <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-lg shadow-md shadow-indigo-600/30">
          KP
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">KPIN Purchasing</h1>
        <p className="mt-1 text-xs text-slate-500">Sign in to your enterprise procurement workspace</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="name@company.com"
              aria-label="Email"
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              aria-label="Password"
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <button
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 transition cursor-pointer"
        >
          {busy ? 'Authenticating…' : 'Sign In to Workspace'}
          {!busy && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      {sso && (
        <div className="mt-4">
          <div className="relative mb-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-2 text-xs uppercase text-slate-400">Or continue with</span>
          </div>
          <a
            href={`/api/auth/entra/start?next=${encodeURIComponent(safeNext(sp.get('next')) ?? '/dashboard')}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            Microsoft Entra ID
          </a>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
        <Link className="font-medium text-slate-500 hover:text-indigo-600 hover:underline" href="/forgot-password">
          Forgot password?
        </Link>
        <Link className="font-semibold text-indigo-600 hover:underline" href="/portal/register">
          Vendor Registration →
        </Link>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-radial from-slate-100 to-slate-200/80 p-4">
      <Suspense fallback={<div className="text-sm text-slate-500">Loading sign in...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
