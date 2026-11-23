'use client'
import { useEffect, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

/** Small house UI kit: every page uses these so the look stays consistent. */
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export function Button({ variant = 'primary', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const v = { primary: 'bg-gray-900 text-white hover:bg-gray-700', secondary: 'border bg-white hover:bg-gray-50', danger: 'bg-red-600 text-white hover:bg-red-500', ghost: 'hover:bg-gray-100' }[variant]
  return <button type="button" {...p} className={cx('rounded px-3 py-1.5 text-sm disabled:opacity-40', v, className)} />
}

export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx('w-full rounded border px-2.5 py-1.5 text-sm', className)} />
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cx('w-full rounded border px-2.5 py-1.5 text-sm', className)} />
export const Select = ({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx('w-full rounded border px-2 py-1.5 text-sm', className)} />

export function Field({ label, error, children, required }: { label: string; error?: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}{required && <span className="text-red-600"> *</span>}</span>
      {children}
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  )
}

export function Modal({ open, title, onClose, children, wide }: { open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const d = ref.current; if (!d) return; if (open && !d.open) d.showModal(); if (!open && d.open) d.close() }, [open])
  return (
    <dialog ref={ref} onClose={onClose} className={cx('rounded-lg p-0 backdrop:bg-black/40', wide ? 'w-[min(960px,95vw)]' : 'w-[min(520px,95vw)]')}>
      <div className="flex items-center justify-between border-b px-4 py-3"><h2 className="font-semibold">{title}</h2><button onClick={onClose} aria-label="Close">✕</button></div>
      <div className="max-h-[75vh] overflow-y-auto p-4">{open && children}</div>
    </dialog>
  )
}

const BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700', SUBMITTED: 'bg-blue-100 text-blue-700', PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-700', ISSUED: 'bg-green-100 text-green-700', POSTED: 'bg-green-100 text-green-700', PAID: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700', CANCELLED: 'bg-red-100 text-red-700', RETURNED: 'bg-orange-100 text-orange-700', ACTIVE: 'bg-green-100 text-green-700',
}
export const Badge = ({ value }: { value: string | null | undefined }) =>
  value ? <span className={cx('inline-block rounded px-2 py-0.5 text-xs font-medium', BADGE[value] ?? 'bg-gray-100 text-gray-700')}>{value.replaceAll('_', ' ')}</span> : null

export const PageHeader = ({ title, actions }: { title: string; actions?: ReactNode }) => (
  <div className="mb-4 flex items-center justify-between gap-2"><h1 className="text-lg font-semibold">{title}</h1><div className="flex gap-2">{actions}</div></div>
)

export const Card = ({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) => (
  <section className="rounded border bg-white">
    {title && <div className="flex items-center justify-between border-b px-4 py-2"><h2 className="text-sm font-semibold">{title}</h2>{actions}</div>}
    <div className="p-4">{children}</div>
  </section>
)

export const ErrorText = ({ error }: { error?: string | null }) => (error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null)

export const fmtMoney = (v: unknown, ccy?: string) =>
  v == null || v === '' ? '' : `${ccy ? ccy + ' ' : ''}${Number(v).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const fmtDate = (v: unknown) => (v ? new Date(String(v)).toLocaleDateString('id-ID') : '')
export const fmtDateTime = (v: unknown) => (v ? new Date(String(v)).toLocaleString('id-ID') : '')
