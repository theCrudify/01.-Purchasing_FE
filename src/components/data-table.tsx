'use client'
import type { ReactNode } from 'react'
import type { useList } from '@/lib/use-list'

export type Column<T> = { key: string; header: string; sortable?: boolean; render?: (row: T) => ReactNode }

/** Reusable table for every list page: search box, sortable headers, pagination — all server-side. */
export function DataTable<T extends object>({ list, columns, actions }: { list: ReturnType<typeof useList<T>>; columns: Column<T>[]; actions?: ReactNode }) {
  const { res, loading, error, sort, toggleSort, search, setSearch, page, setPage, pageSize, setPageSize } = list
  const [sk, sd] = sort.split(':')
  const m = res?.meta
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="w-72 rounded border px-3 py-1.5 text-sm" aria-label="Search" />
        <div className="ml-auto">{actions}</div>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className={`overflow-x-auto rounded border ${loading ? 'opacity-60' : ''}`}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>{columns.map((c) => (
              <th key={c.key} className="px-3 py-2 font-medium" aria-sort={sk === c.key ? (sd === 'asc' ? 'ascending' : 'descending') : undefined}>
                {c.sortable ? <button onClick={() => toggleSort(c.key)} className="hover:underline">{c.header}{sk === c.key ? (sd === 'asc' ? ' ▲' : ' ▼') : ''}</button> : c.header}
              </th>))}
            </tr>
          </thead>
          <tbody>
            {res?.data.map((row) => (
              <tr key={(row as any).id ?? (row as any).key} className="border-t">{columns.map((c) => <td key={c.key} className="px-3 py-2">{c.render ? c.render(row) : String((row as any)[c.key] ?? '')}</td>)}</tr>
            ))}
            {res && !res.data.length && <tr><td colSpan={columns.length} className="px-3 py-6 text-center text-gray-500">No data</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span>{m ? `${m.total} rows · page ${m.page} / ${m.totalPages}` : ''}</span>
        <div className="flex items-center gap-2">
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="rounded border px-2 py-1" aria-label="Rows per page">{[10, 20, 50, 100].map((n) => <option key={n}>{n}</option>)}</select>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Prev</button>
          <button disabled={!m || page >= m.totalPages} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  )
}
