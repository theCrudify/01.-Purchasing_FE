'use client'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Inbox, RotateCw, Search, X } from 'lucide-react'
import type { useList } from '@/lib/use-list'

export type Column<T> = { key: string; header: string; sortable?: boolean; render?: (row: T) => ReactNode }

const BOOL_COLS = new Set(['isActive', 'isMandatory', 'hasExpiry', 'allowMultiple', 'surcharged', 'isOptional'])

function formatDefaultCell<T extends object>(row: T, col: Column<T>): ReactNode {
  const val = (row as any)[col.key]

  if (col.render) {
    const out = col.render(row)
    if (out === 'Yes' && BOOL_COLS.has(col.key)) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success-200 bg-success-50 px-2.5 py-0.5 text-xs font-semibold text-success-700">
          <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
          {col.key === 'isActive' ? 'Active' : 'Yes'}
        </span>
      )
    }
    if (out === 'No' && BOOL_COLS.has(col.key)) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
          {col.key === 'isActive' ? 'Inactive' : 'No'}
        </span>
      )
    }
    return out
  }

  if (col.key === 'code' && val) {
    return (
      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-gray-800">
        {String(val)}
      </span>
    )
  }

  if (typeof val === 'boolean') {
    return val ? (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-success-200 bg-success-50 px-2.5 py-0.5 text-xs font-semibold text-success-700">
        <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
        Inactive
      </span>
    )
  }

  if (val === null || val === undefined || val === '') {
    return <span className="text-gray-400">—</span>
  }

  return String(val)
}

/** TailAdmin Data Table with Search, Clear, Refresh, Row Numbering, Zebra Rows, Skeleton Loading, and Numbered Pagination */
export function DataTable<T extends object>({
  list,
  columns,
  actions,
}: {
  list: ReturnType<typeof useList<T>>
  columns: Column<T>[]
  actions?: ReactNode
}) {
  const { res, loading, error, sort, toggleSort, search, setSearch, page, setPage, pageSize, setPageSize, reload } =
    list
  const [sk, sd] = sort.split(':')
  const m = res?.meta
  const total = m?.total ?? 0
  const totalPages = Math.max(1, m?.totalPages ?? 1)
  const startRow = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endRow = total === 0 ? 0 : Math.min(total, page * pageSize)

  // Compute pagination window
  const windowSize = 5
  const winStart = Math.max(1, page - Math.floor(windowSize / 2))
  const winEnd = Math.min(totalPages, winStart + windowSize - 1)
  const pageNumbers: number[] = []
  for (let p = Math.max(1, winEnd - windowSize + 1); p <= winEnd; p++) pageNumbers.push(p)

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs">
      {/* Top Toolbar */}
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode, nama, atau keterangan…"
              className="h-[38px] w-full rounded-lg border border-gray-300 bg-white pl-9 pr-8 text-sm text-gray-900 placeholder:text-gray-400 shadow-theme-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
              aria-label="Search"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={reload}
            className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 shadow-theme-xs hover:bg-gray-50 hover:text-gray-900 transition-colors"
            title="Muat ulang data"
          >
            <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin text-brand-500' : ''}`} />
          </button>
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {error && (
        <div role="alert" className="border-b border-error-200 bg-error-50 px-5 py-3 text-sm font-medium text-error-700">
          {error}
        </div>
      )}

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50/90 text-xs font-semibold uppercase tracking-wider text-gray-600">
            <tr>
              <th className="w-14 px-4 py-3.5 text-center">No</th>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="px-4 py-3.5"
                  aria-sort={sk === c.key ? (sd === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className="inline-flex items-center gap-1.5 hover:text-gray-900 transition-colors cursor-pointer"
                    >
                      <span>{c.header}</span>
                      {sk === c.key ? (
                        sd === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5 text-brand-500" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-brand-500" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-gray-300" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {loading && !res?.data.length ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skel-${idx}`} className="animate-pulse">
                  <td className="px-4 py-3.5 text-center">
                    <div className="mx-auto h-4 w-6 rounded bg-gray-200" />
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3.5">
                      <div className="h-4 w-28 rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : res && res.data.length > 0 ? (
              res.data.map((row, idx) => (
                <tr
                  key={(row as any).id ?? (row as any).key ?? idx}
                  className="odd:bg-white even:bg-gray-50/50 hover:bg-brand-50/30 transition-colors"
                >
                  <td className="px-4 py-3.5 text-center text-xs font-medium text-gray-500">
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3.5 text-gray-800">
                      {formatDefaultCell(row, c)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-14 text-center">
                  <div className="mx-auto flex flex-col items-center justify-center gap-2 text-gray-400">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                      <Inbox className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-gray-600">Tidak ada data ditemukan</p>
                    <p className="text-xs text-gray-400">
                      {search ? 'Coba ubah kata kunci pencarian atau filter Anda.' : 'Belum ada data yang tercatat pada tabel ini.'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* TailAdmin Numbered Pagination Footer */}
      <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 bg-gray-50/50 px-5 py-3.5 sm:flex-row">
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span>Baris:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs focus:border-brand-500 focus:outline-none"
            aria-label="Rows per page"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="text-gray-500">
            Menampilkan <strong className="text-gray-800">{startRow}–{endRow}</strong> dari{' '}
            <strong className="text-gray-800">{total}</strong> data
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-40 transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {winStart > 1 && (
            <>
              <button
                type="button"
                onClick={() => setPage(1)}
                className="h-8 min-w-8 rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                1
              </button>
              {winStart > 2 && <span className="px-1 text-xs text-gray-400">…</span>}
            </>
          )}

          {pageNumbers.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`h-8 min-w-8 rounded-lg border px-2.5 text-xs font-semibold transition-colors ${
                p === page
                  ? 'border-brand-500 bg-brand-500 text-white shadow-theme-xs'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}

          {winEnd < totalPages && (
            <>
              {winEnd < totalPages - 1 && <span className="px-1 text-xs text-gray-400">…</span>}
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                className="h-8 min-w-8 rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            type="button"
            disabled={!m || page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-40 transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
