// Small dependency-free charts for the dashboard (plain divs, so they follow Tailwind tokens and stay accessible).
export type StatusCounts = { draft: number; pending: number; approved: number }

// Validated palette (light surface): CVD-safe adjacent pairs; light-blue draft is < 3:1, so legend + tooltip + table carry identity.
export const SERIES = [
  { key: 'draft', label: 'Draft / Returned', color: '#93b4fd' },
  { key: 'pending', label: 'Pending', color: '#d97706' },
  { key: 'approved', label: 'Approved / Issued', color: '#1d4ed8' },
] as const

export function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
      {SERIES.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
          {s.label}
        </li>
      ))}
    </ul>
  )
}

const niceMax = (n: number) => {
  if (n <= 4) return 4
  const step = 10 ** Math.floor(Math.log10(n)) / 2
  return Math.ceil(n / step) * step
}
const monthLabel = (ym: string) =>
  new Date(`${ym}-01T00:00:00`).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })

/** Stacked monthly columns: draft at the base, approved on top. */
export function MonthlyBars({ data }: { data: (StatusCounts & { month: string })[] }) {
  const max = niceMax(Math.max(0, ...data.map((d) => d.draft + d.pending + d.approved)))
  const ticks = [0, max / 2, max]
  return (
    <div>
      <div className="relative h-48">
        {ticks.map((t) => (
          <div key={t} className="absolute inset-x-0 flex items-center gap-2" style={{ bottom: `${(t / max) * 100}%` }}>
            <span className="w-6 -translate-y-1/2 text-right text-[10px] tabular-nums text-gray-400">{t}</span>
            <span className={`h-px flex-1 -translate-y-1/2 ${t === 0 ? 'bg-gray-300' : 'bg-gray-100'}`} />
          </div>
        ))}
        <div className="absolute inset-y-0 left-8 right-0 flex items-end gap-3 sm:gap-6">
          {data.map((d) => {
            const total = d.draft + d.pending + d.approved
            return (
              <div key={d.month} className="group relative flex h-full flex-1 flex-col justify-end" tabIndex={0} aria-label={`${monthLabel(d.month)}: ${total} dokumen`}>
                {/* wider hover target than the bar itself */}
                <div className="mx-auto flex w-full max-w-10 flex-col-reverse gap-[2px]" style={{ height: `${(total / max) * 100}%` }}>
                  {SERIES.map((s) => d[s.key] > 0 && (
                    <div key={s.key} className="w-full last:rounded-t" style={{ flexGrow: d[s.key], background: s.color }} />
                  ))}
                </div>
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-max -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg group-hover:block group-focus:block">
                  <p className="mb-1 font-semibold text-gray-900">{monthLabel(d.month)} · {total} dokumen</p>
                  {SERIES.map((s) => (
                    <p key={s.key} className="flex items-center gap-1.5 text-gray-600">
                      <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
                      {s.label}: <span className="font-semibold tabular-nums text-gray-900">{d[s.key]}</span>
                    </p>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="ml-8 mt-2 flex gap-3 sm:gap-6">
        {data.map((d) => (
          <span key={d.month} className="flex-1 text-center text-[11px] text-gray-500">{monthLabel(d.month)}</span>
        ))}
      </div>
    </div>
  )
}

/** One horizontal segmented bar (share of draft / pending / approved). */
export function StatusBar({ counts, className = 'h-2' }: { counts: StatusCounts; className?: string }) {
  const total = counts.draft + counts.pending + counts.approved
  if (!total) return <div className={`${className} w-full rounded-full bg-gray-100`} />
  return (
    <div className={`${className} flex w-full gap-[2px] overflow-hidden rounded-full`} role="img"
      aria-label={SERIES.map((s) => `${s.label} ${counts[s.key]}`).join(', ')}>
      {SERIES.map((s) => counts[s.key] > 0 && (
        <div key={s.key} title={`${s.label}: ${counts[s.key]}`} style={{ flexGrow: counts[s.key], background: s.color }} />
      ))}
    </div>
  )
}
