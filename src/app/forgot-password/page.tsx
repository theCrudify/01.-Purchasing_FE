'use client'
import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, Lock, Mail } from 'lucide-react'
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
    <div className="space-y-5">
      {step !== 'done' && (
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === 'request' ? 'bg-brand-600 text-white' : 'bg-success-100 text-success-700'
              }`}
            >
              1
            </span>
            <span className={`text-xs ${step === 'request' ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
              Email
            </span>
          </div>
          <div className="h-px w-8 bg-gray-200" />
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === 'verify'
                  ? 'bg-brand-600 text-white'
                  : step === 'set'
                  ? 'bg-success-100 text-success-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              2
            </span>
            <span className={`text-xs ${step === 'verify' ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
              Verification
            </span>
          </div>
          <div className="h-px w-8 bg-gray-200" />
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === 'set' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400'
              }`}
            >
              3
            </span>
            <span className={`text-xs ${step === 'set' ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
              New Password
            </span>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-error-200 bg-error-50 p-3.5 text-xs text-error-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-error-600 mt-0.5" />
          <div className="min-w-0 flex-1 font-medium">{error}</div>
        </div>
      )}

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
            <label className="block text-xs font-semibold text-gray-700">
              Account Email <span className="text-error-500 font-bold">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                placeholder="name@company.com"
                className="h-[42px] w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
              />
            </div>
            <p className="text-xs text-gray-500">We will send a 6-digit verification code to your email address.</p>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="flex h-[42px] w-full items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-700 disabled:opacity-50 transition cursor-pointer"
          >
            {busy ? 'Sending code…' : 'Send Verification Code'}
          </button>
        </form>
      )}

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
          <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-3 text-xs text-gray-600">
            A 6-digit verification code has been sent to <strong className="text-gray-900">{email}</strong>.
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              6-Digit Code <span className="text-error-500 font-bold">*</span>
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <input
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="one-time-code"
                placeholder="123456"
                className="h-[42px] w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-center font-mono text-base font-bold tracking-widest text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep('request')}
              className="h-[42px] rounded-lg border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 h-[42px] rounded-lg bg-brand-600 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-700 disabled:opacity-50 transition cursor-pointer"
            >
              {busy ? 'Verifying…' : 'Verify Code'}
            </button>
          </div>
        </form>
      )}

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
            <label className="block text-xs font-semibold text-gray-700">
              New Password <span className="text-error-500 font-bold">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <input
                type="password"
                required
                minLength={12}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Minimum 12 characters"
                className="h-[42px] w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
              />
            </div>
            <p className="text-[11px] text-gray-400">Must be at least 12 characters with letters and digits.</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Confirm Password <span className="text-error-500 font-bold">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <input
                type="password"
                required
                minLength={12}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Repeat new password"
                className="h-[42px] w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="flex h-[42px] w-full items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-700 disabled:opacity-50 transition cursor-pointer"
          >
            {busy ? 'Saving…' : 'Set New Password'}
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="rounded-xl border border-success-200 bg-success-50/70 p-6 text-center space-y-3">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-success-100 text-success-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Password Updated</h3>
          <p className="text-xs text-gray-600">
            Your password has been updated. You can now sign in with your new credentials.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex h-[40px] w-full items-center justify-center rounded-lg bg-brand-600 text-xs font-semibold text-white shadow-theme-xs hover:bg-brand-700 transition"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      )}

      {step !== 'done' && (
        <div className="border-t border-gray-100 pt-3 text-center">
          <Link
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-600 hover:underline"
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
      title="Reset Password"
      subtitle="Verify your registered email address to set a new account password."
    >
      <Suspense fallback={<div className="py-12 text-center text-sm text-gray-500">Loading reset flow…</div>}>
        <ResetFlow />
      </Suspense>
    </AuthLayout>
  )
}
