'use client'
import { useState } from 'react'
import { Database, Eye, KeyRound, MonitorSmartphone, ShieldAlert } from 'lucide-react'
import { DataTable, type Column } from '@/components/data-table'
import { Badge, Input, Modal, PageHeader, fmtDateTime } from '@/components/ui'
import { useList } from '@/lib/use-list'

export default function AuditPage() {
  const [tab, setTab] = useState<'logs' | 'activity' | 'sessions' | 'access'>('logs')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [inspecting, setInspecting] = useState<{ title: string; json: string } | null>(null)

  const TABS = {
    logs: {
      label: 'Perubahan Data (Data Changes)',
      icon: Database,
      sort: 'occurredAt:desc',
      columns: [
        { key: 'occurredAt', header: 'Waktu', sortable: true, render: (r: any) => fmtDateTime(r.occurredAt) },
        {
          key: 'tableName',
          header: 'Tabel',
          sortable: true,
          render: (r: any) => (
            <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-800">
              {r.tableName}
            </span>
          ),
        },
        { key: 'recordKey', header: 'Record Key' },
        { key: 'action', header: 'Aksi', render: (r: any) => <Badge value={r.action} /> },
        { key: 'actorEmail', header: 'Pelaku (Actor)' },
        {
          key: 'changes',
          header: 'Detail Perubahan',
          render: (r: any) => (
            <button
              type="button"
              onClick={() =>
                setInspecting({
                  title: `${r.action} on ${r.tableName} (${r.recordKey})`,
                  json: typeof r.changes === 'string' ? r.changes : JSON.stringify(r.changes, null, 2),
                })
              }
              className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-100"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Lihat Payload</span>
            </button>
          ),
        },
      ],
    },
    activity: {
      label: 'Aktivitas Login',
      icon: KeyRound,
      sort: 'occurredAt:desc',
      columns: [
        { key: 'occurredAt', header: 'Waktu', sortable: true, render: (r: any) => fmtDateTime(r.occurredAt) },
        { key: 'email', header: 'Pengguna' },
        { key: 'action', header: 'Aksi', sortable: true, render: (r: any) => <Badge value={r.action} /> },
        { key: 'ipAddress', header: 'Alamat IP' },
        { key: 'detail', header: 'Keterangan' },
      ],
    },
    sessions: {
      label: 'Sesi Pengguna',
      icon: MonitorSmartphone,
      sort: 'startedAt:desc',
      columns: [
        { key: 'startedAt', header: 'Mulai Sesi', sortable: true, render: (r: any) => fmtDateTime(r.startedAt) },
        { key: 'email', header: 'Pengguna', sortable: true },
        { key: 'authMethod', header: 'Metode' },
        { key: 'ipAddress', header: 'Alamat IP' },
        {
          key: 'endReason',
          header: 'Status',
          render: (r: any) =>
            r.isActive ? (
              <Badge value="ACTIVE" />
            ) : (
              <span className="text-xs text-gray-500">
                {r.endReason ?? 'Expired'}
                {r.endedByEmail ? ` by ${r.endedByEmail}` : ''}
              </span>
            ),
        },
      ],
    },
    access: {
      label: 'Akses Data Sensitif',
      icon: ShieldAlert,
      sort: 'occurredAt:desc',
      columns: [
        { key: 'occurredAt', header: 'Waktu', sortable: true, render: (r: any) => fmtDateTime(r.occurredAt) },
        { key: 'email', header: 'Pengguna' },
        { key: 'action', header: 'Aksi', sortable: true, render: (r: any) => <Badge value={r.action} /> },
        { key: 'objectType', header: 'Tipe Objek' },
        { key: 'objectKey', header: 'Kunci Objek' },
        { key: 'detail', header: 'Detail' },
      ],
    },
  } satisfies Record<string, { label: string; icon: any; sort: string; columns: Column<any>[] }>

  const cfg = TABS[tab]
  const list = useList(`/audit/${tab}`, cfg.sort, { from: from || undefined, to: to || undefined })

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit Trail & Log Keamanan Sistem"
        subtitle="Catatan permanen (immutable audit log) untuk setiap perubahan data, aktivitas login, sesi aktif, dan akses dokumen sensitif."
      />

      <div role="tablist" className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {(Object.keys(TABS) as (keyof typeof TABS)[]).map((k) => {
          const Icon = TABS[k].icon
          const active = tab === k
          return (
            <button
              key={k}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(k)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-brand-500 text-white shadow-theme-xs'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{TABS[k].label}</span>
            </button>
          )
        })}
      </div>

      <DataTable
        key={tab}
        list={list}
        columns={cfg.columns}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-gray-500">Periode:</span>
            <Input
              type="date"
              aria-label="From date"
              className="h-[40px] w-38"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <span className="text-gray-400">–</span>
            <Input
              type="date"
              aria-label="To date"
              className="h-[40px] w-38"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        }
      />

      <Modal
        open={inspecting !== null}
        title={inspecting?.title ?? 'Detail Perubahan Data'}
        onClose={() => setInspecting(null)}
        wide
      >
        <pre className="max-h-[60vh] overflow-auto rounded-xl border border-gray-200 bg-gray-900 p-4 font-mono text-xs text-emerald-300">
          {inspecting?.json}
        </pre>
      </Modal>
    </div>
  )
}
