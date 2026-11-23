'use client'
import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { AlertCircle, X } from 'lucide-react'

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export function Button({
  variant = 'primary',
  className,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const v = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 active:scale-[0.99] font-medium border border-transparent',
    secondary:
      'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs font-medium',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/20 active:scale-[0.99] font-medium border border-transparent',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium',
  }[variant]

  return (
    <button
      type="button"
      {...p}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:pointer-events-none disabled:opacity-40 cursor-pointer',
        v,
        className
      )}
    />
  )
}

export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...p}
    className={cx(
      'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition-colors focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-500',
      className
    )}
  />
)

export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...p}
    className={cx(
      'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition-colors focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-500',
      className
    )}
  />
)

export const Select = ({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...p}
    className={cx(
      'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs transition-colors focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-500 cursor-pointer',
      className
    )}
  />
)

export function Field({
  label,
  error,
  children,
  required,
}: {
  label: string
  error?: string
  children: ReactNode
  required?: boolean
}) {
  return (
    <div className="space-y-1.5 text-sm">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
        {label}
        {required && <span className="text-rose-600 font-bold ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <span className="flex items-center gap-1 text-xs font-medium text-rose-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </span>
      )}
    </div>
  )
}

export function Modal({
  open,
  title,
  onClose,
  children,
  wide,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className={cx(
        'rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-950/40 backdrop:backdrop-blur-xs transition-all',
        wide ? 'w-[min(960px,95vw)]' : 'w-[min(540px,95vw)]'
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{open && children}</div>
    </dialog>
  )
}

const BADGE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  DRAFT: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  SUBMITTED: { bg: 'bg-sky-50', text: 'text-sky-700 border border-sky-200/60', dot: 'bg-sky-500' },
  PENDING_APPROVAL: { bg: 'bg-amber-50', text: 'text-amber-700 border border-amber-200/60', dot: 'bg-amber-500' },
  APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700 border border-emerald-200/60', dot: 'bg-emerald-500' },
  ISSUED: { bg: 'bg-emerald-50', text: 'text-emerald-700 border border-emerald-200/60', dot: 'bg-emerald-500' },
  POSTED: { bg: 'bg-teal-50', text: 'text-teal-700 border border-teal-200/60', dot: 'bg-teal-500' },
  PAID: { bg: 'bg-emerald-50', text: 'text-emerald-800 border border-emerald-300/60', dot: 'bg-emerald-600' },
  REJECTED: { bg: 'bg-rose-50', text: 'text-rose-700 border border-rose-200/60', dot: 'bg-rose-500' },
  CANCELLED: { bg: 'bg-rose-50', text: 'text-rose-600 border border-rose-200/60', dot: 'bg-rose-400' },
  RETURNED: { bg: 'bg-orange-50', text: 'text-orange-700 border border-orange-200/60', dot: 'bg-orange-500' },
  REVISION_REQUIRED: { bg: 'bg-orange-50', text: 'text-orange-700 border border-orange-200/60', dot: 'bg-orange-500' },
  ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700 border border-emerald-200/60', dot: 'bg-emerald-500' },
  DISABLED: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
}

export const Badge = ({ value }: { value: string | null | undefined }) => {
  if (!value) return null
  const s = BADGE_STYLES[value] ?? { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' }
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', s.bg, s.text)}>
      <span className={cx('h-1.5 w-1.5 rounded-full', s.dot)} />
      {value.replaceAll('_', ' ')}
    </span>
  )
}

export const PageHeader = ({ title, actions }: { title: string; actions?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
    <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
)

export const Card = ({
  title,
  children,
  actions,
  className,
}: {
  title?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
}) => (
  <section className={cx('rounded-xl border border-slate-200/80 bg-white shadow-xs', className)}>
    {title && (
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/40">
        <h2 className="text-sm font-semibold tracking-tight text-slate-800">{title}</h2>
        {actions}
      </div>
    )}
    <div className="p-5">{children}</div>
  </section>
)

export const ErrorText = ({ error }: { error?: string | null }) =>
  error ? (
    <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
      <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
      <span>{error}</span>
    </div>
  ) : null

export const fmtMoney = (v: unknown, ccy?: string) =>
  v == null || v === ''
    ? ''
    : `${ccy ? ccy + ' ' : ''}${Number(v).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const fmtDate = (v: unknown) => (v ? new Date(String(v)).toLocaleDateString('id-ID') : '')
export const fmtDateTime = (v: unknown) => (v ? new Date(String(v)).toLocaleString('id-ID') : '')
