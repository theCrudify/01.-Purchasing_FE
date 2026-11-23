'use client'
import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react'
import { AuthLayout } from '@/components/auth-layout'
import { post } from '@/lib/api'

function ResetFlow() {
  const sp = useSearchParams()
  const [email, setEmail] = useState(sp.get('email') ?? '')
  const [code, setCode] = useState(sp.get('code') ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState<'request' | 'verify' | 'set' | 'done'>(sp.get('code') ? 'verify' : 'request')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Visual Step Indicator */}
      {step !== 'done' && (
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === 'request'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              1
            </span>
            <span className={`text-xs ${step === 'request' ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
              Email
            </span>
          </div>
          <div className="h-0.5 w-8 bg-slate-200" />
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === 'verify'
                  ? 'bg-indigo-600 text-white'
                  : step === 'set'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              2
            </span>
            <span className={`text-xs ${step === 'verify' ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
              OTP Code
            </span>
          </div>
          <div className="h-0.5 w-8 bg-slate-200" />
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === 'set' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              3
            </span>
            <span className={`text-xs ${step === 'set' ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
              Password
            </span>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="min-w-0 flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Step 1: Request Code */}
      {step === 'request' && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            run(async () => {
              await post('/password-reset/request', { email })
              setStep('verify')
            })
          }}
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Registered Account Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                placeholder="you@company.com"
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <p className="text-xs text-slate-400">
              We will send a 6-digit one-time verification code to this address.
            </p>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
          >
            {busy ? 'Sending OTP…' : 'Send Verification Code'}
            {!busy && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
      )}

      {/* Step 2: Verify Code */}
      {step === 'verify' && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            run(async () => {
              await post('/password-reset/verify', { email, code })
              setStep('set')
            })
          }}
        >
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs text-slate-600">
            A 6-digit security code was dispatched to <strong className="text-slate-900">{email}</strong>.
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Enter 6-Digit Code
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="one-time-code"
                placeholder="123456"
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-center font-mono text-lg font-bold tracking-widest text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep('request')}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
            >
              {busy ? 'Verifying…' : 'Verify Security Code'}
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Set New Password */}
      {step === 'set' && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (password !== confirmPassword) {
              setError('Password confirmation does not match.')
              return
            }
            run(async () => {
              await post('/password-reset/reset', { email, code, newPassword: password })
              setStep('done')
            })
          }}
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                minLength={12}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="At least 12 characters"
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Must be at least 12 characters combining letters, numbers, or symbols.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                minLength={12}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Confirm new password"
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
          >
            {busy ? 'Saving Password…' : 'Update & Lock Password'}
          </button>
        </form>
      )}

      {/* Step 4: Done */}
      {step === 'done' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Password Reset Complete</h3>
          <p className="text-xs text-slate-600">
            Your credentials have been securely updated. You can now access your account with the new password.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition"
            >
              <span>Return to Sign In</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {step !== 'done' && (
        <div className="border-t border-slate-100 pt-3 text-center">
          <Link
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:underline"
            href="/login"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to sign in</span>
          </Link>
        </div>
      )}
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset Account Password"
      subtitle="Follow the multi-step verification process to recover your account access securely."
      badge="Identity Protection"
    >
      <Suspense fallback={<div className="py-12 text-center text-sm text-slate-500">Loading reset flow…</div>}>
        <ResetFlow />
      </Suspense>
    </AuthLayout>
  )
}
