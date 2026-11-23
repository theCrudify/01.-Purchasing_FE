'use client'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Inbox, Search } from 'lucide-react'
import type { useList } from '@/lib/use-list'

export type Column<T> = { key: string; header: string; sortable?: boolean; render?: (row: T) => ReactNode }

/** Reusable modern table for every list page */
export function DataTable<T extends object>({
  list,
  columns,
  actions,
}: {
  list: ReturnType<typeof useList<T>>
  columns: Column<T>[]
  actions?: ReactNode
}) {
  const { res, loading, error, sort, toggleSort, search, setSearch, page, setPage, pageSize, setPageSize } = list
  const [sk, sd] = sort.split(':')
  const m = res?.meta

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records…"
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition-colors focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            aria-label="Search"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>

      {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}

      {/* Table Container */}
      <div className={`overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs ${loading ? 'opacity-60' : ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3.5">
                    {c.sortable ? (
                      <button
                        onClick={() => toggleSort(c.key)}
                        className="inline-flex items-center gap-1.5 hover:text-slate-900 transition cursor-pointer"
                      >
                        <span>{c.header}</span>
                        {sk === c.key ? (
                          sd === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5 text-indigo-600" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 opacity-60" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {res?.data.map((row) => (
                <tr key={(row as any).id ?? (row as any).key} className="hover:bg-slate-50/80 transition-colors">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-slate-700">
                      {c.render ? c.render(row) : String((row as any)[c.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
              {res && !res.data.length && (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox className="h-8 w-8 text-slate-300" />
                      <p className="text-sm font-medium">No records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/40 px-4 py-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-xs focus:border-indigo-600 focus:outline-none"
              aria-label="Rows per page"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            {m && (
              <span className="text-slate-400">
                • Total {m.total} records
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span>
              {m ? `Page ${m.page} of ${Math.max(1, m.totalPages)}` : ''}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 transition cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                disabled={!m || page >= m.totalPages}
                onClick={() => setPage(page + 1)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 transition cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
