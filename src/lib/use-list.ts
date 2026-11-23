'use client'
import { useEffect, useState } from 'react'
import { api, qs, type Paged } from './api'

/** Server-side list state: page, page size, debounced search, sort. Refetches on change; stale responses are ignored. */
export function useList<T>(path: string, defaultSort: string, extra: Record<string, string | undefined> = {}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState(defaultSort)
  const [res, setRes] = useState<Paged<T> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const extraKey = JSON.stringify(extra)

  useEffect(() => { const t = setTimeout(() => { setQ(search); setPage(1) }, 300); return () => clearTimeout(t) }, [search])

  useEffect(() => {
    let stale = false
    setLoading(true)
    api<Paged<T>>(`${path}?${qs({ page, pageSize, q, sort, ...JSON.parse(extraKey) })}`)
      .then((r) => { if (!stale) { setRes(r); setError(null) } })
      .catch((e) => { if (!stale) setError(e.message) })
      .finally(() => { if (!stale) setLoading(false) })
    return () => { stale = true }
  }, [path, page, pageSize, q, sort, extraKey, tick])

  const toggleSort = (key: string) => { setSort((s) => (s === `${key}:asc` ? `${key}:desc` : `${key}:asc`)); setPage(1) }
  return { res, error, loading, page, setPage, pageSize, setPageSize: (n: number) => { setPageSize(n); setPage(1) }, search, setSearch, sort, toggleSort, reload: () => setTick((t) => t + 1) }
}
