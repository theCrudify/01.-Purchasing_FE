'use client'
import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button, ErrorText, Field, Input } from '@/components/ui'
import { post } from '@/lib/api'

/** Public: request code → verify code → set new password (also used by invited users). */
function Flow() {
  const sp = useSearchParams()
  const [email, setEmail] = useState(sp.get('email') ?? '')
  const [code, setCode] = useState(sp.get('code') ?? '')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'request' | 'verify' | 'set' | 'done'>(sp.get('code') ? 'verify' : 'request')
  const [error, setError] = useState<string | null>(null), [busy, setBusy] = useState(false)
  const run = async (fn: () => Promise<void>) => { setBusy(true); setError(null); try { await fn() } catch (e) { setError((e as Error).message) } finally { setBusy(false) } }

  return (
    <div className="mx-auto mt-24 w-96 space-y-4">
      <h1 className="text-xl font-semibold">Reset password</h1>
      {step === 'request' && <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); run(async () => { await post('/password-reset/request', { email }); setStep('verify') }) }}>
        <Field label="Email" required><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></Field>
        <Button type="submit" disabled={busy} className="w-full">Send code</Button>
      </form>}
      {step === 'verify' && <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); run(async () => { await post('/password-reset/verify', { email, code }); setStep('set') }) }}>
        <p className="text-sm text-gray-600">If the address is registered, a 6-digit code was sent to {email}.</p>
        <Field label="Email" required><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Code" required><Input inputMode="numeric" pattern="\d{6}" required value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" /></Field>
        <Button type="submit" disabled={busy} className="w-full">Verify</Button>
      </form>}
      {step === 'set' && <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); run(async () => { await post('/password-reset/reset', { email, code, newPassword: password }); setStep('done') }) }}>
        <Field label="New password (min. 12, letters + digits)" required><Input type="password" required minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></Field>
        <Button type="submit" disabled={busy} className="w-full">Set password</Button>
      </form>}
      {step === 'done' && <p className="text-sm">Password set. <Link className="underline" href="/login">Sign in</Link></p>}
      <ErrorText error={error} />
      {step !== 'done' && <Link className="block text-sm underline" href="/login">Back to sign in</Link>}
    </div>
  )
}
export default function Page() { return <Suspense><Flow /></Suspense> }
