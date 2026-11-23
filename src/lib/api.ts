export type Paged<T> = { data: T[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message) }
}

async function raw(path: string, init?: RequestInit) {
  const isForm = typeof FormData !== 'undefined' && init?.body instanceof FormData
  return fetch(`/api${path}`, { ...init, credentials: 'same-origin', headers: { ...(isForm ? {} : { 'content-type': 'application/json' }), ...init?.headers } })
}

/** JSON fetch with one transparent refresh-and-retry on 401; redirects to /login when the session is gone. */
export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  let r = await raw(path, init)
  if (r.status === 401 && !path.startsWith('/auth/')) {
    if ((await raw('/auth/refresh', { method: 'POST' })).ok) r = await raw(path, init)
    else if (typeof window !== 'undefined' && !location.pathname.startsWith('/login') && !location.pathname.startsWith('/portal/register')) {
      location.href = `/login?next=${encodeURIComponent(location.pathname)}`
    }
  }
  const body = await r.json().catch(() => ({}))
  if (!r.ok) throw new ApiError(r.status, body?.error?.code ?? 'ERROR', body?.error?.message ?? r.statusText, body?.error?.details)
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
