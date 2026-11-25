export type Paged<T> = { data: T[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message) }
}

async function raw(path: string, init?: RequestInit) {
  const isForm = typeof FormData !== 'undefined' && init?.body instanceof FormData
  return fetch(`/api${path}`, { ...init, credentials: 'same-origin', headers: { ...(isForm ? {} : { 'content-type': 'application/json' }), ...init?.headers } })
}

// One refresh at a time: parallel 401s replaying the same refresh token look like token theft to the API, which ends the session.
// shortcut: per tab only; two tabs refreshing in the same instant can still collide, use navigator.locks if that shows up.
let refreshing: Promise<boolean> | null = null
const refresh = () => (refreshing ??= raw('/auth/refresh', { method: 'POST' }).then((r) => r.ok, () => false).finally(() => { refreshing = null }))

/** JSON fetch with one transparent refresh-and-retry on 401; redirects to /login when the session is gone. */
export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  let r = await raw(path, init)
  if (r.status === 401 && !path.startsWith('/auth/')) {
    if (await refresh()) r = await raw(path, init)
    else if (typeof window !== 'undefined' && !location.pathname.startsWith('/login') && !location.pathname.startsWith('/portal/register')) {
      location.href = `/login?next=${encodeURIComponent(location.pathname)}`
    }
  }
  const body = await r.json().catch(() => ({}))
  if (!r.ok) throw new ApiError(r.status, body?.error?.code ?? 'ERROR', body?.error?.message ?? (r.statusText || `Server error (HTTP ${r.status}), coba lagi`), body?.error?.details)
  return body as T
}

export const post = <T = any>(path: string, body?: unknown) => api<T>(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body ?? {}) })
export const patch = <T = any>(path: string, body: unknown) => api<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
export const del = <T = any>(path: string, body?: unknown) => api<T>(path, { method: 'DELETE', body: body === undefined ? undefined : JSON.stringify(body) })

export const qs = (o: Record<string, string | number | boolean | undefined | null>) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v))
  return p.toString()
}
