'use client'
import { useState } from 'react'
import { DataTable } from '@/components/data-table'
import { AutoForm } from '@/components/form'
import { Button, ErrorText, Modal, PageHeader, Select, fmtDate } from '@/components/ui'
import { del, post } from '@/lib/api'
import { useCan } from '@/lib/me'
import { useList } from '@/lib/use-list'

type Rate = { key: string; currencyCode: string; currencyName: string; rateType: string; rateDate: string; rateToBase: string; source: string }

export default function ExchangeRatesPage() {
  const can = useCan()
  const [rateType, setRateType] = useState('')
  const list = useList<Rate>('/exchange-rates', 'rateDate:desc', { rateType: rateType || undefined })
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(fn: () => Promise<unknown>) { setError(null); setMsg(null); try { await fn(); list.reload() } catch (e) { setError((e as Error).message) } }

  return (
    <div>
      <PageHeader title="Exchange Rates" actions={can('FX.MANAGE') && <>
        <Button variant="secondary" onClick={() => run(async () => { const r = await post('/exchange-rates/import'); setMsg(`Imported ${r.data.date ?? '-'}: ${r.data.inserted} new, ${r.data.updated} updated${r.data.skipped?.length ? `, not available: ${r.data.skipped.join(', ')}` : ''}`) })}>Import latest (ECB)</Button>
        <Button onClick={() => setOpen(true)}>Add rate</Button>
      </>} />
      {msg && <p className="mb-2 text-sm text-green-700">{msg}</p>}
      <ErrorText error={error} />
      <DataTable list={list} columns={[
        { key: 'rateDate', header: 'Date', sortable: true, render: (r) => fmtDate(r.rateDate) },
        { key: 'currencyCode', header: 'Currency', sortable: true, render: (r) => `${r.currencyCode} — ${r.currencyName}` },
        { key: 'rateType', header: 'Type', sortable: true },
        { key: 'rateToBase', header: 'IDR per 1 unit', render: (r) => Number(r.rateToBase).toLocaleString('id-ID', { maximumFractionDigits: 6 }) },
        { key: 'source', header: 'Source' },
        { key: '_a', header: '', render: (r) => can('FX.MANAGE') && <Button variant="ghost" className="text-red-600" onClick={() => confirm('Delete this rate?') && run(() => del(`/exchange-rates/${r.key}`))}>Delete</Button> },
      ]} actions={
        <Select value={rateType} onChange={(e) => { setRateType(e.target.value); list.setPage(1) }} className="w-36" aria-label="Rate type">
          <option value="">All types</option><option>MIDDLE</option><option>TAX</option><option>BANK</option>
        </Select>
      } />
      <Modal open={open} title="Add exchange rate" onClose={() => setOpen(false)}>
        <AutoForm fields={[
          { name: 'currencyCode', label: 'Currency', type: 'lookup', required: true, lookup: { path: '/currencies', value: 'code', label: (r) => `${r.code} — ${r.name}`, params: { isActive: 'true' } } },
          { name: 'rateType', label: 'Type', type: 'select', required: true, options: ['MIDDLE', 'TAX', 'BANK'].map((v) => ({ value: v, label: v })) },
          { name: 'rateDate', label: 'Date', type: 'date', required: true },
          { name: 'rateToBase', label: 'IDR per 1 unit', type: 'decimal', required: true },
        ]} onSubmit={async (v) => { await post('/exchange-rates', v); setOpen(false); list.reload() }} />
      </Modal>
    </div>
  )
}
