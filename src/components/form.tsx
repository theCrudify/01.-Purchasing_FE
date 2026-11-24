'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { api, qs, ApiError, type Paged } from '@/lib/api'
import { Button, ErrorText, Field, Input, Select, Textarea } from './ui'

export type FieldDef = {
  name: string
  label: string
  type?: 'text' | 'number' | 'decimal' | 'date' | 'checkbox' | 'select' | 'textarea' | 'lookup' | 'email' | 'password'
  required?: boolean
  options?: { value: string; label: string }[]
  /** lookup: searchable select backed by any list endpoint (?q=&pageSize=) */
  lookup?: { path: string; value?: string; label: (row: any) => string; params?: Record<string, string> }
  placeholder?: string
  /** hide on edit (e.g. immutable code) */
  createOnly?: boolean
  readOnlyOnEdit?: boolean
  span?: 1 | 2
}

/** Searchable select over a paginated list endpoint (server-side search, 20 rows). */
export function LookupSelect({ path, value, onChange, label, valueKey = 'id', params, initialLabel, disabled }: {
  path: string; value: unknown; onChange: (v: any, row?: any) => void; label: (r: any) => string; valueKey?: string
  params?: Record<string, string>; initialLabel?: string; disabled?: boolean
}) {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(initialLabel ?? '')
  const wrapRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null)

  useEffect(() => {
    if (initialLabel) setText(initialLabel)
  }, [initialLabel])

  useEffect(() => {
    if (!open) return
    const updatePos = () => {
      const el = wrapRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const spaceBelow = window.innerHeight - r.bottom
      const flipUp = spaceBelow < 260 && r.top > spaceBelow
      setPos({
        left: r.left,
        width: r.width,
        ...(flipUp ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
      })
    }
    updatePos()
    window.addEventListener('scroll', updatePos, true)
    window.addEventListener('resize', updatePos)
    return () => {
      window.removeEventListener('scroll', updatePos, true)
      window.removeEventListener('resize', updatePos)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => api<Paged<any>>(`${path}?${qs({ q, pageSize: 20, ...params })}`).then((r) => setRows(r.data)).catch(() => setRows([])), 250)
    return () => clearTimeout(t)
  }, [q, open, path, JSON.stringify(params)])
  useEffect(() => { if (value != null && value !== '' && !text) api<{ data: any }>(`${path}/${value}`).then((r) => setText(label(r.data))).catch(() => {}) }, [value])

  return (
    <div ref={wrapRef} className="relative">
      <Input disabled={disabled} value={open ? q : text} placeholder="Search…" onFocus={() => { setOpen(true); setQ('') }} onBlur={() => setTimeout(() => setOpen(false), 150)} onChange={(e) => setQ(e.target.value)} />
      {open && pos && typeof document !== 'undefined' && createPortal(
        <ul
          style={{ position: 'fixed', left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, zIndex: 9999 }}
          className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-theme-lg"
        >
          <li><button type="button" className="w-full px-3 py-1.5 text-left text-xs text-gray-500 hover:bg-gray-50 cursor-pointer" onMouseDown={() => { onChange(null); setText(''); setOpen(false) }}>— none —</button></li>
          {rows.map((r) => (
            <li key={r[valueKey]}><button type="button" className="w-full px-3 py-1.5 text-left text-xs text-gray-800 hover:bg-brand-50 hover:text-brand-700 cursor-pointer" onMouseDown={() => { onChange(r[valueKey], r); setText(label(r)); setOpen(false) }}>{label(r)}</button></li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  )
}

export function FieldInput({ f, value, onChange, editing }: { f: FieldDef; value: any; onChange: (v: any) => void; editing?: boolean }) {
  const disabled = editing && f.readOnlyOnEdit
  switch (f.type) {
    case 'checkbox': return <input type="checkbox" disabled={disabled} checked={!!value} onChange={(e) => onChange(e.target.checked)} />
    case 'select': return <Select disabled={disabled} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}><option value="">—</option>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
    case 'textarea': return <Textarea disabled={disabled} rows={3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    case 'lookup': return <LookupSelect disabled={disabled} path={f.lookup!.path} valueKey={f.lookup!.value} label={f.lookup!.label} params={f.lookup!.params} value={value} onChange={onChange} />
    case 'number': return <Input disabled={disabled} type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />
    case 'decimal': return <Input disabled={disabled} inputMode="decimal" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)} />
    case 'date': return <Input disabled={disabled} type="date" value={value ? String(value).slice(0, 10) : ''} onChange={(e) => onChange(e.target.value || null)} />
    default: return <Input disabled={disabled} type={f.type ?? 'text'} placeholder={f.placeholder} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
  }
}

/** Config-driven form. Sends only fields defined in `fields`; maps API 422 details to field errors. */
export function AutoForm({ fields, initial, onSubmit, submitLabel = 'Save', editing }: {
  fields: FieldDef[]; initial?: Record<string, any>; onSubmit: (v: Record<string, any>) => Promise<void>; submitLabel?: string; editing?: boolean
}) {
  const [v, setV] = useState<Record<string, any>>(() => ({ ...initial }))
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const visible = fields.filter((f) => !(editing && f.createOnly))

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null); setErrs({})
    try {
      const out: Record<string, any> = {}
      for (const f of visible) {
        if (editing && f.readOnlyOnEdit) continue
        const val = v[f.name]
        if (val === undefined || (val === '' && !f.required)) continue
        out[f.name] = f.type === 'number' && val !== null ? Number(val) : val
      }
      await onSubmit(out)
    } catch (err) {
      if (err instanceof ApiError && Array.isArray(err.details)) setErrs(Object.fromEntries(err.details.map((d: any) => [d.path, d.message])))
      setError((err as Error).message)
    } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visible.map((f) => (
          <div key={f.name} className={f.span === 2 || f.type === 'textarea' ? 'sm:col-span-2' : ''}>
            <Field label={f.label} required={f.required} error={errs[f.name]}>
              <FieldInput f={f} editing={editing} value={v[f.name]} onChange={(x) => setV((p) => ({ ...p, [f.name]: x }))} />
            </Field>
          </div>
        ))}
      </div>
      <ErrorText error={error} />
      <div className="flex justify-end"><Button type="submit" disabled={busy}>{busy ? 'Saving…' : submitLabel}</Button></div>
    </form>
  )
}
