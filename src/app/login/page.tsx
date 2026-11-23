'use client'
import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'

const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : null)

function LoginForm() {
  const router = useRouter(); const sp = useSearchParams()
  const [error, setError] = useState(sp.get('error') ?? ''); const [busy, setBusy] = useState(false)
  const [sso, setSso] = useState(false)
  useEffect(() => { api('/auth/providers').then((r) => setSso(!!r.data?.microsoft)).catch(() => {}) }, [])
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError('')
    const f = new FormData(e.currentTarget)
    try {
      await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: f.get('email'), password: f.get('password') }) })
      const me = await api('/auth/me')
      router.replace(safeNext(sp.get('next')) ?? (me.data.userType === 'BP' ? '/portal' : '/dashboard'))
    } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }
  return (
    <div className="mx-auto mt-28 w-80 space-y-3">
      <h1 className="text-xl font-semibold">KPIN Purchasing</h1>
      <form onSubmit={submit} className="space-y-3">
        <input name="email" type="email" required autoComplete="username" placeholder="Email" aria-label="Email" className="w-full rounded border px-3 py-2" />
        <input name="password" type="password" required autoComplete="current-password" placeholder="Password" aria-label="Password" className="w-full rounded border px-3 py-2" />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="w-full rounded bg-black py-2 text-white disabled:opacity-50">{busy ? '…' : 'Sign in'}</button>
      </form>
      {sso && <a href={`/api/auth/entra/start?next=${encodeURIComponent(safeNext(sp.get('next')) ?? '/dashboard')}`} className="block w-full rounded border py-2 text-center text-sm">Sign in with Microsoft</a>}
      <div className="flex justify-between text-sm">
        <Link className="underline" href="/forgot-password">Forgot password?</Link>
        <Link className="underline" href="/portal/register">Vendor registration</Link>
      </div>
    </div>
  )
}
export default function Page() { return <Suspense><LoginForm /></Suspense> }
