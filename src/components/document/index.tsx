'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { CheckCircle2, Download, FileText, MessageSquare, Paperclip, RotateCcw, Send, Trash2, Upload, XCircle } from 'lucide-react'
import { api, del, post } from '@/lib/api'
import { useMe } from '@/lib/me'
import { Badge, Button, Card, ErrorText, Field, Input, Modal, PageHeader, Select, Textarea, fmtDate, fmtDateTime, fmtMoney } from '../ui'

/** Header/approvals payload of GET /api/documents/:id */
export type DocView = {
  id: string
  docType: string
  docNo: string | null
  docDate: string
  status: string
  title: string | null
  ownerName: string
  currencyCode: string | null
  exchangeRate: string | null
  totalAmount: string | null
  totalAmountBase: string | null
  remarks: string | null
  isDeleted: boolean
  deleteReason: string | null
  cancelReason: string | null
  version: number
  isOwner: boolean
  history: {
    id: number
    fromStatus: string | null
    toStatus: string
    remarks: string | null
    actedAt: string
    actorName: string
  }[]
  approvals: {
    roundNo: number
    roundStatus: string
    templateName: string
    taskId: string
    stepNo: number
    stepName: string | null
    status: string
    assigneeName: string
    actedByName: string | null
    actingAs: string | null
    actedAt: string | null
    actorJobTitle: string | null
    remarks: string | null
  }[]
  actableTaskIds: string[]
}

/** Loads the generic document view; `reload` after any action. */
export function useDocument(publicId: string | null) {
  const [doc, setDoc] = useState<DocView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (publicId)
      api<{ data: DocView }>(`/documents/${publicId}`)
        .then((r) => {
          setDoc(r.data)
          setError(null)
        })
        .catch((e) => setError(e.message))
  }, [publicId, tick])
  return { doc, error, reload: () => setTick((t) => t + 1) }
}

export function DocumentHeader({
  doc,
  extra,
  actions,
}: {
  doc: DocView
  extra?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="space-y-4">
      <PageHeader
        title={`${doc.docType} ${doc.docNo ?? '(Draft)'}`}
        subtitle={doc.title ?? 'Detail Dokumen Pengadaan & Riwayat Persetujuan'}
        actions={actions}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs">
        <div className="mb-4 flex flex-wrap items-center gap-2.5 border-b border-gray-100 pb-4">
          <Badge value={doc.docType} />
          <Badge value={doc.status} />
          {doc.isDeleted && <Badge value="DELETED" />}
          <span className="ml-auto font-mono text-xs text-gray-400">Versi #{doc.version}</span>
        </div>

        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-gray-50/70 p-3">
            <dt className="text-xs font-medium text-gray-500">Judul Dokumen</dt>
            <dd className="mt-1 font-semibold text-gray-900">{doc.title || '—'}</dd>
          </div>
          <div className="rounded-xl bg-gray-50/70 p-3">
            <dt className="text-xs font-medium text-gray-500">Tanggal Dokumen</dt>
            <dd className="mt-1 font-semibold text-gray-900">{fmtDate(doc.docDate)}</dd>
          </div>
          <div className="rounded-xl bg-gray-50/70 p-3">
            <dt className="text-xs font-medium text-gray-500">Pembuat / Pemilik</dt>
            <dd className="mt-1 font-semibold text-gray-900">{doc.ownerName}</dd>
          </div>
          <div className="rounded-xl bg-brand-50/60 p-3 border border-brand-100">
            <dt className="text-xs font-medium text-brand-700">Total Nilai</dt>
            <dd className="mt-1 font-bold text-gray-900">
              {fmtMoney(doc.totalAmount, doc.currencyCode ?? undefined) || '—'}
              {doc.currencyCode && doc.currencyCode !== 'IDR' && doc.totalAmountBase ? (
                <span className="block text-xs font-normal text-gray-500">
                  ≈ {fmtMoney(doc.totalAmountBase, 'IDR')}
                </span>
              ) : null}
            </dd>
          </div>
          {extra}
        </dl>

        {doc.cancelReason && (
          <div className="mt-4 rounded-xl border border-error-200 bg-error-50 px-4 py-2.5 text-xs font-medium text-error-700">
            <strong>Alasan Pembatalan:</strong> {doc.cancelReason}
          </div>
        )}
        {doc.isDeleted && (
          <div className="mt-4 rounded-xl border border-error-200 bg-error-50 px-4 py-2.5 text-xs font-medium text-error-700">
            <strong>Alasan Dihapus:</strong> {doc.deleteReason}
          </div>
        )}
      </div>
    </div>
  )
}

/** Rounds/tasks + decide buttons when the user has an open task (as assignee, delegate or backup). */
export function ApprovalPanel({ doc, onDone }: { doc: DocView; onDone: () => void }) {
  const [act, setAct] = useState<'APPROVE' | 'REJECT' | 'RETURN' | null>(null)
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState<string | null>(null)
  const taskId = doc.actableTaskIds[0]
  const rounds = [...new Set(doc.approvals.map((a) => a.roundNo))]

  async function submit() {
    setError(null)
    try {
      await post(`/approvals/tasks/${taskId}/decide`, {
        decision: act,
        remarks: remarks || undefined,
      })
      setAct(null)
      setRemarks('')
      onDone()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (!doc.approvals.length && !taskId) return null

  return (
    <Card
      title="Alur Persetujuan (Approval Workflow)"
      desc="Urutan pemeriksaan, konfirmasi, dan keputusan pejabat berwenang."
      actions={
        taskId && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setAct('APPROVE')}>
              <CheckCircle2 className="h-4 w-4" />
              <span>Approve</span>
            </Button>
            <Button variant="secondary" onClick={() => setAct('RETURN')}>
              <RotateCcw className="h-4 w-4" />
              <span>Return (Revisi)</span>
            </Button>
            <Button variant="danger" onClick={() => setAct('REJECT')}>
              <XCircle className="h-4 w-4" />
              <span>Reject</span>
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-4">
        {rounds.map((r) => {
          const roundHeader = doc.approvals.find((a) => a.roundNo === r)
          return (
            <div key={r} className="overflow-hidden rounded-xl border border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-xs">
                <span className="font-semibold text-gray-800">
                  Putaran #{r} — {roundHeader?.templateName}
                </span>
                <Badge value={roundHeader?.roundStatus} />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-100 bg-white text-xs font-semibold uppercase text-gray-400">
                    <tr>
                      <th className="px-4 py-2.5">Step</th>
                      <th className="px-4 py-2.5">Approver</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Waktu Keputusan</th>
                      <th className="px-4 py-2.5">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {doc.approvals
                      .filter((a) => a.roundNo === r)
                      .map((a) => (
                        <tr key={a.taskId} className="hover:bg-gray-50/70">
                          <td className="px-4 py-3 font-medium text-gray-700">
                            {a.stepNo}. {a.stepName}
                          </td>
                          <td className="px-4 py-3 text-gray-900">
                            <span className="font-medium">{a.assigneeName}</span>
                            {a.actedByName && a.actedByName !== a.assigneeName && (
                              <span className="ml-1 text-xs text-gray-500">
                                (diwakili oleh {a.actedByName}, {a.actingAs?.toLowerCase()})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge value={a.status} />
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{fmtDateTime(a.actedAt) || '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-700">{a.remarks || '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>

      <Modal
        open={act !== null}
        title={
          act === 'APPROVE'
            ? 'Setujui Dokumen (Approve)'
            : act === 'REJECT'
            ? 'Tolak Dokumen (Reject)'
            : 'Kembalikan untuk Revisi (Return)'
        }
        onClose={() => setAct(null)}
      >
        <div className="space-y-4">
          <Field label="Catatan / Alasan Keputusan" required={act !== 'APPROVE'}>
            <Textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Tuliskan catatan pemeriksaan atau alasan keputusan..."
            />
          </Field>
          <ErrorText error={error} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAct(null)}>
              Batal
            </Button>
            <Button variant={act === 'REJECT' ? 'danger' : 'primary'} onClick={submit}>
              Konfirmasi Keputusan
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}

type Att = {
  id: string
  category: string
  description: string | null
  visibility: string
  fileName: string
  sizeBytes: number
  createdAt: string
  createdByName: string
}
const CATS = [
  'SPECIFICATION',
  'QUOTATION',
  'DELIVERY_NOTE',
  'BAST',
  'QC_REPORT',
  'CONTRACT',
  'INVOICE',
  'TAX_INVOICE',
  'OTHER',
]

export function AttachmentPanel({ publicId, readOnly }: { publicId: string; readOnly?: boolean }) {
  const me = useMe()
  const [rows, setRows] = useState<Att[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const load = () =>
    api<{ data: Att[] }>(`/documents/${publicId}/attachments`)
      .then((r) => setRows(r.data))
      .catch((e) => setError(e.message))
  useEffect(() => {
    load()
  }, [publicId])

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const form = e.currentTarget
    try {
      await post(`/documents/${publicId}/attachments`, new FormData(form))
      form.reset()
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Lampiran Dokumen (Attachments)" desc="Dokumen pendukung seperti penawaran, BAST, atau faktur.">
      <div className="space-y-4">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-6 text-center text-xs text-gray-400">
            <Paperclip className="mx-auto mb-1.5 h-5 w-5 text-gray-300" />
            Belum ada file lampiran
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
            {rows.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <a
                    className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:underline"
                    href={`/api/documents/${publicId}/attachments/${a.id}`}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span className="truncate">{a.fileName}</span>
                  </a>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    {a.category} · {(a.sizeBytes / 1024).toFixed(0)} KB · {a.createdByName}
                    {a.visibility === 'INTERNAL' ? ' · Internal Only' : ''}
                  </span>
                </div>
                {!readOnly && (
                  <button
                    className="rounded-lg border border-error-200 bg-error-50 px-2.5 py-1 text-xs font-semibold text-error-600 hover:bg-error-100"
                    onClick={async () => {
                      if (confirm('Hapus lampiran ini?')) {
                        try {
                          await del(`/documents/${publicId}/attachments/${a.id}`)
                          load()
                        } catch (e) {
                          setError((e as Error).message)
                        }
                      }
                    }}
                  >
                    Hapus
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {!readOnly && (
          <form onSubmit={upload} className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
            <input
              name="file"
              type="file"
              required
              accept=".pdf,.png,.jpg,.jpeg,.xlsx,.docx"
              aria-label="File"
              className="block w-full rounded-lg border border-gray-300 bg-white text-xs text-gray-700 file:mr-3 file:rounded-l-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-700"
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Select name="category" aria-label="Category">
                {CATS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
              {me?.userType === 'INTERNAL' && (
                <Select name="visibility" aria-label="Visibility">
                  <option value="SHARED">Shared (Vendor)</option>
                  <option value="INTERNAL">Internal Only</option>
                </Select>
              )}
              <Input name="description" placeholder="Keterangan singkat" aria-label="Description" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400">PDF, PNG, JPG, XLSX, DOCX — Maks. 5 MB</span>
              <Button type="submit" disabled={busy}>
                <Upload className="h-3.5 w-3.5" />
                <span>{busy ? 'Mengunggah…' : 'Upload File'}</span>
              </Button>
            </div>
          </form>
        )}
        <ErrorText error={error} />
      </div>
    </Card>
  )
}

export function CommentPanel({ publicId }: { publicId: string }) {
  const me = useMe()
  const [rows, setRows] = useState<
    { id: string; body: string; visibility: string; createdAt: string; authorName: string }[]
  >([])
  const [body, setBody] = useState('')
  const [vis, setVis] = useState('INTERNAL')
  const [error, setError] = useState<string | null>(null)
  const load = () =>
    api(`/documents/${publicId}/comments`)
      .then((r) => setRows(r.data))
      .catch((e) => setError(e.message))
  useEffect(() => {
    load()
  }, [publicId])

  return (
    <Card title="Diskusi & Catatan (Comments)" desc="Komunikasi internal pemeriksa maupun catatan untuk rekanan.">
      <div className="space-y-4">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-6 text-center text-xs text-gray-400">
            <MessageSquare className="mx-auto mb-1.5 h-5 w-5 text-gray-300" />
            Belum ada komentar
          </div>
        ) : (
          <ul className="space-y-2.5 text-sm">
            {rows.map((c) => (
              <li key={c.id} className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-900">{c.authorName}</span>
                  <span className="text-gray-400">
                    {fmtDateTime(c.createdAt)}
                    {c.visibility === 'SHARED' ? ' · Shared with Vendor' : ' · Internal'}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-gray-700">{c.body}</p>
              </li>
            ))}
          </ul>
        )}

        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={async (e) => {
            e.preventDefault()
            try {
              await post(`/documents/${publicId}/comments`, {
                body,
                visibility: me?.userType === 'INTERNAL' ? vis : undefined,
              })
              setBody('')
              load()
            } catch (err) {
              setError((err as Error).message)
            }
          }}
        >
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Tulis komentar atau catatan…"
            aria-label="Comment"
            required
          />
          {me?.userType === 'INTERNAL' && (
            <Select
              value={vis}
              onChange={(e) => setVis(e.target.value)}
              className="sm:w-36"
              aria-label="Comment visibility"
            >
              <option value="INTERNAL">Internal</option>
              <option value="SHARED">Shared</option>
            </Select>
          )}
          <Button type="submit">
            <Send className="h-3.5 w-3.5" />
            <span>Kirim</span>
          </Button>
        </form>
        <ErrorText error={error} />
      </div>
    </Card>
  )
}

export function StatusTimeline({ doc }: { doc: DocView }) {
  return (
    <Card title="Riwayat Status Dokumen (Status Timeline)" desc="Jejak audit transisi status dari pembuatan hingga selesai.">
      {doc.history.length === 0 ? (
        <p className="text-xs text-gray-400">Belum ada riwayat perubahan status.</p>
      ) : (
        <ol className="relative ml-3 space-y-4 border-l-2 border-gray-200 pl-4 text-sm">
          {doc.history.map((h) => (
            <li key={h.id} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-white" />
              <div className="flex flex-wrap items-center gap-2">
                <Badge value={h.toStatus} />
                <span className="font-semibold text-gray-900">{h.actorName}</span>
                <span className="text-xs text-gray-400">{fmtDateTime(h.actedAt)}</span>
              </div>
              {h.remarks && <p className="mt-1 text-xs text-gray-600">{h.remarks}</p>}
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}

export function DocumentActions({
  doc,
  onDone,
  cancellable = ['DRAFT', 'RETURNED', 'APPROVED'],
}: {
  doc: DocView
  onDone: () => void
  cancellable?: string[]
}) {
  const me = useMe()
  const [error, setError] = useState<string | null>(null)
  const run = async (path: string, needReason = true) => {
    const reason = needReason ? prompt('Masukkan alasan:') : ''
    if (needReason && !reason) return
    setError(null)
    try {
      await post(`/documents/${doc.id}/${path}`, needReason ? { reason } : undefined)
      onDone()
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const canDel = me?.permissions.includes('DOC.DELETE')
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!doc.isDeleted && doc.isOwner && doc.status === 'PENDING_APPROVAL' && (
        <Button variant="secondary" onClick={() => run('withdraw')}>
          Tarik Pengajuan (Withdraw)
        </Button>
      )}
      {!doc.isDeleted && (doc.isOwner || canDel) && cancellable.includes(doc.status) && (
        <Button variant="secondary" onClick={() => run('cancel')}>
          Batalkan Dokumen
        </Button>
      )}
      {!doc.isDeleted &&
        ((doc.isOwner && doc.status === 'DRAFT') ||
          (canDel && ['DRAFT', 'CANCELLED', 'REJECTED', 'WITHDRAWN', 'NOT_AWARDED'].includes(doc.status))) && (
          <Button variant="danger" onClick={() => run('delete')}>
            <Trash2 className="h-4 w-4" />
            <span>Hapus</span>
          </Button>
        )}
      {doc.isDeleted && canDel && (
        <Button variant="secondary" onClick={() => run('restore', false)}>
          <RotateCcw className="h-4 w-4" />
          <span>Pulihkan (Restore)</span>
        </Button>
      )}
      {error && (
        <span role="alert" className="text-xs font-medium text-error-600">
          {error}
        </span>
      )}
    </div>
  )
}

export type LineCol<L> = {
  key: string
  header: string
  width?: string
  render: (row: L, set: (patch: Partial<L>) => void, i: number) => ReactNode
}

export function LinesEditor<L extends Record<string, any>>({
  lines,
  onChange,
  columns,
  newLine,
  readOnly,
  footer,
}: {
  lines: L[]
  onChange: (l: L[]) => void
  columns: LineCol<L>[]
  newLine: () => L
  readOnly?: boolean
  footer?: ReactNode
}) {
  const set = (i: number) => (patch: Partial<L>) =>
    onChange(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
          <tr>
            <th className="w-10 px-3 py-2.5 text-center">#</th>
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2.5" style={{ width: c.width }}>
                {c.header}
              </th>
            ))}
            {!readOnly && <th className="w-10" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lines.map((l, i) => (
            <tr key={i} className="align-top hover:bg-gray-50/60">
              <td className="px-3 py-2.5 text-center text-xs text-gray-500">{i + 1}</td>
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2">
                  {c.render(l, set(i), i)}
                </td>
              ))}
              {!readOnly && (
                <td className="px-2 py-2.5 text-center">
                  <button
                    type="button"
                    aria-label={`Remove line ${i + 1}`}
                    className="rounded-lg p-1 text-error-600 hover:bg-error-50"
                    onClick={() => onChange(lines.filter((_, j) => j !== i))}
                  >
                    ✕
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot className="border-t border-gray-200 bg-gray-50">{footer}</tfoot>}
      </table>
      {!readOnly && (
        <div className="border-t border-gray-100 bg-gray-50/40 p-3">
          <Button variant="secondary" onClick={() => onChange([...lines, newLine()])}>
            + Tambah Baris Item
          </Button>
        </div>
      )}
    </div>
  )
}
