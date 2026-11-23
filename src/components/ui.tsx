'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  useEffect,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { AlertCircle, AlertTriangle, ChevronRight, Home, X } from 'lucide-react'

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export function Button({
  variant = 'primary',
  className,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'approver'
}) {
  const v = {
    primary:
      'bg-brand-500 text-white hover:bg-brand-600 shadow-theme-xs active:scale-[0.99] font-semibold border border-transparent',
    approver:
      'bg-[#c3002f] text-white hover:bg-[#a50027] shadow-theme-xs active:scale-[0.99] font-semibold border border-transparent',
    secondary:
      'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-theme-xs font-medium',
    danger:
      'bg-error-500 text-white hover:bg-error-600 shadow-theme-xs active:scale-[0.99] font-semibold border border-transparent',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium',
  }[variant]

  return (
    <button
      type="button"
      {...p}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition-all focus:outline-none focus:ring-3 focus:ring-brand-500/15 disabled:pointer-events-none disabled:opacity-45 cursor-pointer',
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
      'h-[42px] w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-theme-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 disabled:bg-gray-100 disabled:text-gray-500',
      className
    )}
  />
)

export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...p}
    className={cx(
      'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-theme-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 disabled:bg-gray-100 disabled:text-gray-500',
      className
    )}
  />
)

export const Select = ({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...p}
    className={cx(
      'h-[42px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-theme-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 disabled:bg-gray-100 disabled:text-gray-500 cursor-pointer',
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
      <label className="block text-xs font-semibold text-gray-700">
        {label}
        {required && <span className="ml-1 font-bold text-error-500">*</span>}
      </label>
      {children}
      {error && (
        <span className="flex items-center gap-1 text-xs font-medium text-error-600">
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
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'relative z-10 flex max-h-[88vh] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xl transition-all',
          wide ? 'w-full max-w-4xl' : 'w-full max-w-lg'
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200/70 hover:text-gray-700 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmDeleteModal({
  open,
  title = 'Konfirmasi Hapus Data',
  itemName,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean
  title?: string
  itemName?: string
  busy?: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xl">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-error-100 text-error-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{title}</h3>
              <p className="mt-1.5 text-sm text-gray-500">
                Apakah Anda yakin ingin menghapus{' '}
                {itemName ? <strong className="text-gray-900">{itemName}</strong> : 'data ini'}? Data yang dihapus
                dapat dipulihkan melalui filter Deleted.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 bg-gray-50 px-6 py-3.5">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Menghapus…' : 'Ya, Hapus'}
          </Button>
        </div>
      </div>
    </div>
  )
}

const BADGE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  DRAFT: { bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-700', dot: 'bg-gray-400' },
  SUBMITTED: { bg: 'bg-brand-50 border border-brand-200', text: 'text-brand-700', dot: 'bg-brand-500' },
  PENDING: { bg: 'bg-warning-50 border border-warning-200', text: 'text-warning-700', dot: 'bg-warning-500' },
  PENDING_APPROVAL: { bg: 'bg-warning-50 border border-warning-200', text: 'text-warning-700', dot: 'bg-warning-500' },
  WAITING: { bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-600', dot: 'bg-gray-400' },
  APPROVED: { bg: 'bg-success-50 border border-success-200', text: 'text-success-700', dot: 'bg-success-500' },
  ISSUED: { bg: 'bg-success-50 border border-success-200', text: 'text-success-700', dot: 'bg-success-500' },
  POSTED: { bg: 'bg-success-50 border border-success-200', text: 'text-success-700', dot: 'bg-success-500' },
  PAID: { bg: 'bg-success-50 border border-success-200', text: 'text-success-700', dot: 'bg-success-600' },
  ACTIVE: { bg: 'bg-success-50 border border-success-200', text: 'text-success-700', dot: 'bg-success-500' },
  INACTIVE: { bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-600', dot: 'bg-gray-400' },
  REJECTED: { bg: 'bg-error-50 border border-error-200', text: 'text-error-700', dot: 'bg-error-500' },
  CANCELLED: { bg: 'bg-error-50 border border-error-200', text: 'text-error-700', dot: 'bg-error-400' },
  REVOKED: { bg: 'bg-error-50 border border-error-200', text: 'text-error-700', dot: 'bg-error-500' },
  DELETED: { bg: 'bg-error-50 border border-error-200', text: 'text-error-700', dot: 'bg-error-500' },
  LOCKED: { bg: 'bg-error-50 border border-error-200', text: 'text-error-700', dot: 'bg-error-500' },
  RETURNED: { bg: 'bg-warning-50 border border-warning-200', text: 'text-warning-700', dot: 'bg-warning-500' },
  REVISION_REQUIRED: { bg: 'bg-warning-50 border border-warning-200', text: 'text-warning-700', dot: 'bg-warning-500' },
  PENDING_ACTIVATION: { bg: 'bg-warning-50 border border-warning-200', text: 'text-warning-700', dot: 'bg-warning-500' },
  DISABLED: { bg: 'bg-gray-100 border border-gray-200', text: 'text-gray-600', dot: 'bg-gray-400' },
  INTERNAL: { bg: 'bg-brand-50 border border-brand-200', text: 'text-brand-700', dot: 'bg-brand-500' },
  BP: { bg: 'bg-purple-50 border border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
  PR: { bg: 'bg-brand-50 border border-brand-200', text: 'text-brand-700', dot: 'bg-brand-500' },
  PO: { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  RFQ: { bg: 'bg-amber-50 border border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  QUO: { bg: 'bg-sky-50 border border-sky-200', text: 'text-sky-700', dot: 'bg-sky-500' },
  CTR: { bg: 'bg-purple-50 border border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
  GR: { bg: 'bg-teal-50 border border-teal-200', text: 'text-teal-700', dot: 'bg-teal-500' },
  SVR: { bg: 'bg-rose-50 border border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500' },
}

export const Badge = ({ value }: { value: string | null | undefined }) => {
  if (!value) return null
  const s = BADGE_STYLES[value] ?? {
    bg: 'bg-gray-100 border border-gray-200',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        s.bg,
        s.text
      )}
    >
      <span className={cx('h-1.5 w-1.5 rounded-full', s.dot)} />
      {value.replaceAll('_', ' ')}
    </span>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  const path = usePathname()
  const segments = path ? path.split('/').filter(Boolean) : []
  const category =
    segments[0] === 'master'
      ? 'Master Data'
      : segments[0] === 'admin'
      ? 'Administration'
      : segments[0] === 'settings'
      ? 'Workflow & Approval'
      : segments[0] === 'documents'
      ? 'Documents'
      : segments[0] === 'portal'
      ? 'Supplier Portal'
      : 'Overview'

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <nav aria-label="Breadcrumb" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <Link href="/dashboard" className="inline-flex items-center gap-1 hover:text-brand-600 transition-colors">
            <Home className="h-3.5 w-3.5" />
            <span>Beranda</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          <span>{category}</span>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          <span className="font-semibold text-gray-800">{title}</span>
        </nav>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  )
}

export const Card = ({
  title,
  desc,
  children,
  actions,
  className,
}: {
  title?: string
  desc?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
}) => (
  <section className={cx('rounded-2xl border border-gray-200 bg-white shadow-theme-xs', className)}>
    {title && (
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {desc && <p className="mt-0.5 text-xs text-gray-500">{desc}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </section>
)

export const ErrorText = ({ error }: { error?: string | null }) =>
  error ? (
    <div
      role="alert"
      className="mb-4 flex items-center gap-2.5 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm font-medium text-error-700"
    >
      <AlertCircle className="h-4 w-4 shrink-0 text-error-600" />
      <span>{error}</span>
    </div>
  ) : null

export const fmtMoney = (v: unknown, ccy?: string) =>
  v == null || v === ''
    ? ''
    : `${ccy ? ccy + ' ' : ''}${Number(v).toLocaleString('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`

export const fmtDate = (v: unknown) => (v ? new Date(String(v)).toLocaleDateString('id-ID') : '')
export const fmtDateTime = (v: unknown) => (v ? new Date(String(v)).toLocaleString('id-ID') : '')
