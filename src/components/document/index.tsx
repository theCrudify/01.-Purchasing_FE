'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { api, post, del } from '@/lib/api'
import { useMe } from '@/lib/me'
import { Badge, Button, Card, ErrorText, Input, Modal, Select, Textarea, fmtDate, fmtDateTime, fmtMoney } from '../ui'

/** Header/approvals payload of GET /api/documents/:id */
export type DocView = {
  id: string; docType: string; docNo: string | null; docDate: string; status: string; title: string | null; ownerName: string
  currencyCode: string | null; exchangeRate: string | null; totalAmount: string | null; totalAmountBase: string | null; remarks: string | null
  isDeleted: boolean; deleteReason: string | null; cancelReason: string | null; version: number; isOwner: boolean
  history: { id: number; fromStatus: string | null; toStatus: string; remarks: string | null; actedAt: string; actorName: string }[]
  approvals: { roundNo: number; roundStatus: string; templateName: string; taskId: string; stepNo: number; stepName: string | null; status: string; assigneeName: string; actedByName: string | null; actingAs: string | null; actedAt: string | null; actorJobTitle: string | null; remarks: string | null }[]
  actableTaskIds: string[]
}

/** Loads the generic document view; `reload` after any action. */
export function useDocument(publicId: string | null) {
  const [doc, setDoc] = useState<DocView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  useEffect(() => { if (publicId) api<{ data: DocView }>(`/documents/${publicId}`).then((r) => { setDoc(r.data); setError(null) }).catch((e) => setError(e.message)) }, [publicId, tick])
  return { doc, error, reload: () => setTick((t) => t + 1) }
}

export function DocumentHeader({ doc, extra, actions }: { doc: DocView; extra?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold">{doc.docType} {doc.docNo ?? '(draft)'}</h1>
        <Badge value={doc.status} />
        {doc.isDeleted && <Badge value="DELETED" />}
        <div className="ml-auto flex flex-wrap gap-2">{actions}</div>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
        <dt className="text-gray-500">Title</dt><dd>{doc.title}</dd>
        <dt className="text-gray-500">Date</dt><dd>{fmtDate(doc.docDate)}</dd>
        <dt className="text-gray-500">Owner</dt><dd>{doc.ownerName}</dd>
        <dt className="text-gray-500">Total</dt><dd>{fmtMoney(doc.totalAmount, doc.currencyCode ?? undefined)}{doc.currencyCode && doc.currencyCode !== 'IDR' && doc.totalAmountBase ? ` (≈ ${fmtMoney(doc.totalAmountBase, 'IDR')})` : ''}</dd>
        {extra}
      </dl>
      {doc.cancelReason && <p className="text-sm text-red-700">Cancelled: {doc.cancelReason}</p>}
      {doc.isDeleted && <p className="text-sm text-red-700">Deleted: {doc.deleteReason}</p>}
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
    try { await post(`/approvals/tasks/${taskId}/decide`, { decision: act, remarks: remarks || undefined }); setAct(null); setRemarks(''); onDone() } catch (e) { setError((e as Error).message) }
  }
  if (!doc.approvals.length && !taskId) return null
  return (
    <Card title="Approval" actions={taskId && (
      <div className="flex gap-2">
        <Button onClick={() => setAct('APPROVE')}>Approve</Button>
        <Button variant="secondary" onClick={() => setAct('RETURN')}>Return</Button>
        <Button variant="danger" onClick={() => setAct('REJECT')}>Reject</Button>
      </div>)}>
      {rounds.map((r) => (
        <div key={r} className="mb-3">
          <p className="mb-1 text-xs font-semibold text-gray-500">Round {r} — {doc.approvals.find((a) => a.roundNo === r)?.templateName} · <Badge value={doc.approvals.find((a) => a.roundNo === r)?.roundStatus} /></p>
          <table className="w-full text-sm">
            <tbody>
              {doc.approvals.filter((a) => a.roundNo === r).map((a) => (
                <tr key={a.taskId} className="border-t">
                  <td className="py-1 pr-2 text-gray-500">{a.stepNo}. {a.stepName}</td>
                  <td className="pr-2">{a.assigneeName}{a.actedByName && a.actedByName !== a.assigneeName ? ` (by ${a.actedByName}, ${a.actingAs?.toLowerCase()})` : ''}</td>
                  <td className="pr-2"><Badge value={a.status} /></td>
                  <td className="pr-2 text-gray-500">{fmtDateTime(a.actedAt)}</td>
                  <td className="text-gray-700">{a.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <Modal open={act !== null} title={act === 'APPROVE' ? 'Approve' : act === 'REJECT' ? 'Reject' : 'Return for revision'} onClose={() => setAct(null)}>
        <label className="block text-sm">Remarks{act !== 'APPROVE' && <span className="text-red-600"> *</span>}
          <Textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </label>
        <ErrorText error={error} />
        <div className="mt-3 flex justify-end"><Button variant={act === 'REJECT' ? 'danger' : 'primary'} onClick={submit}>Confirm</Button></div>
      </Modal>
    </Card>
  )
}

type Att = { id: string; category: string; description: string | null; visibility: string; fileName: string; sizeBytes: number; createdAt: string; createdByName: string }
const CATS = ['SPECIFICATION', 'QUOTATION', 'DELIVERY_NOTE', 'BAST', 'QC_REPORT', 'CONTRACT', 'INVOICE', 'TAX_INVOICE', 'OTHER']

export function AttachmentPanel({ publicId, readOnly }: { publicId: string; readOnly?: boolean }) {
  const me = useMe()
  const [rows, setRows] = useState<Att[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const load = () => api<{ data: Att[] }>(`/documents/${publicId}/attachments`).then((r) => setRows(r.data)).catch((e) => setError(e.message))
  useEffect(() => { load() }, [publicId])
  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(null)
    const form = e.currentTarget
    try { await post(`/documents/${publicId}/attachments`, new FormData(form)); form.reset(); await load() } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }
  return (
    <Card title="Attachments">
      <ul className="mb-3 space-y-1 text-sm">
        {rows.map((a) => (
          <li key={a.id} className="flex items-center gap-2">
            <a className="underline" href={`/api/documents/${publicId}/attachments/${a.id}`}>{a.fileName}</a>
            <span className="text-xs text-gray-500">{a.category} · {(a.sizeBytes / 1024).toFixed(0)} KB · {a.createdByName}{a.visibility === 'INTERNAL' ? ' · internal' : ''}</span>
            {!readOnly && <button className="ml-auto text-xs text-red-600" onClick={async () => { if (confirm('Remove attachment?')) { try { await del(`/documents/${publicId}/attachments/${a.id}`); load() } catch (e) { setError((e as Error).message) } } }}>remove</button>}
          </li>
        ))}
        {!rows.length && <li className="text-gray-500">No attachments</li>}
      </ul>
      {!readOnly && (
        <form onSubmit={upload} className="flex flex-wrap items-center gap-2">
          <input name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg,.xlsx,.docx" aria-label="File" className="text-sm" />
          <Select name="category" className="w-40" aria-label="Category">{CATS.map((c) => <option key={c}>{c}</option>)}</Select>
          {me?.userType === 'INTERNAL' && <Select name="visibility" className="w-32" aria-label="Visibility"><option value="SHARED">Shared</option><option value="INTERNAL">Internal</option></Select>}
          <Input name="description" placeholder="Description" className="w-48" aria-label="Description" />
          <Button type="submit" disabled={busy}>Upload</Button>
        </form>
      )}
      <p className="mt-1 text-xs text-gray-500">PDF, PNG, JPG, XLSX, DOCX — max 5 MB</p>
      <ErrorText error={error} />
    </Card>
  )
}

export function CommentPanel({ publicId }: { publicId: string }) {
  const me = useMe()
  const [rows, setRows] = useState<{ id: string; body: string; visibility: string; createdAt: string; authorName: string }[]>([])
  const [body, setBody] = useState(''), [vis, setVis] = useState('INTERNAL')
  const [error, setError] = useState<string | null>(null)
  const load = () => api(`/documents/${publicId}/comments`).then((r) => setRows(r.data)).catch((e) => setError(e.message))
  useEffect(() => { load() }, [publicId])
  return (
    <Card title="Comments">
      <ul className="mb-3 space-y-2 text-sm">
        {rows.map((c) => <li key={c.id}><span className="font-medium">{c.authorName}</span> <span className="text-xs text-gray-500">{fmtDateTime(c.createdAt)}{c.visibility === 'SHARED' ? ' · shared with vendor' : ''}</span><p className="whitespace-pre-wrap">{c.body}</p></li>)}
        {!rows.length && <li className="text-gray-500">No comments</li>}
      </ul>
      <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); try { await post(`/documents/${publicId}/comments`, { body, visibility: me?.userType === 'INTERNAL' ? vis : undefined }); setBody(''); load() } catch (err) { setError((err as Error).message) } }}>
        <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a comment…" aria-label="Comment" required />
        {me?.userType === 'INTERNAL' && <Select value={vis} onChange={(e) => setVis(e.target.value)} className="w-36" aria-label="Comment visibility"><option value="INTERNAL">Internal</option><option value="SHARED">Shared</option></Select>}
        <Button type="submit">Send</Button>
      </form>
      <ErrorText error={error} />
    </Card>
  )
}

export function StatusTimeline({ doc }: { doc: DocView }) {
  return (
    <Card title="History">
      <ol className="space-y-1 text-sm">
        {doc.history.map((h) => (
          <li key={h.id} className="flex flex-wrap gap-2"><span className="text-gray-500">{fmtDateTime(h.actedAt)}</span><Badge value={h.toStatus} /><span>{h.actorName}</span>{h.remarks && <span className="text-gray-600">— {h.remarks}</span>}</li>
        ))}
      </ol>
    </Card>
  )
}

/** Cancel / withdraw / delete / restore buttons driven by status + ownership. The API re-checks everything. */
export function DocumentActions({ doc, onDone, cancellable = ['DRAFT', 'RETURNED', 'APPROVED'] }: { doc: DocView; onDone: () => void; cancellable?: string[] }) {
  const me = useMe()
  const [error, setError] = useState<string | null>(null)
  const run = async (path: string, needReason = true) => {
    const reason = needReason ? prompt('Reason?') : ''
    if (needReason && !reason) return
    setError(null)
    try { await post(`/documents/${doc.id}/${path}`, needReason ? { reason } : undefined); onDone() } catch (e) { setError((e as Error).message) }
  }
  const canDel = me?.permissions.includes('DOC.DELETE')
  return (
    <>
      {!doc.isDeleted && doc.isOwner && doc.status === 'PENDING_APPROVAL' && <Button variant="secondary" onClick={() => run('withdraw')}>Withdraw</Button>}
      {!doc.isDeleted && (doc.isOwner || canDel) && cancellable.includes(doc.status) && <Button variant="secondary" onClick={() => run('cancel')}>Cancel document</Button>}
      {!doc.isDeleted && ((doc.isOwner && doc.status === 'DRAFT') || (canDel && ['DRAFT', 'CANCELLED', 'REJECTED', 'WITHDRAWN', 'NOT_AWARDED'].includes(doc.status))) && <Button variant="danger" onClick={() => run('delete')}>Delete</Button>}
      {doc.isDeleted && canDel && <Button variant="secondary" onClick={() => run('restore', false)}>Restore</Button>}
      {error && <span role="alert" className="text-sm text-red-600">{error}</span>}
    </>
  )
}

/** Editable line grid. Column `render` gets (row, set) so pages can use lookups / inputs. Totals are informational; the DB is authoritative. */
export type LineCol<L> = { key: string; header: string; width?: string; render: (row: L, set: (patch: Partial<L>) => void, i: number) => ReactNode }
export function LinesEditor<L extends Record<string, any>>({ lines, onChange, columns, newLine, readOnly, footer }: {
  lines: L[]; onChange: (l: L[]) => void; columns: LineCol<L>[]; newLine: () => L; readOnly?: boolean; footer?: ReactNode
}) {
  const set = (i: number) => (patch: Partial<L>) => onChange(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  return (
    <div className="overflow-x-auto rounded border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left"><tr><th className="w-8 px-2 py-1">#</th>{columns.map((c) => <th key={c.key} className="px-2 py-1 font-medium" style={{ width: c.width }}>{c.header}</th>)}{!readOnly && <th className="w-8" />}</tr></thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className="border-t align-top">
              <td className="px-2 py-1 text-gray-500">{i + 1}</td>
              {columns.map((c) => <td key={c.key} className="px-2 py-1">{c.render(l, set(i), i)}</td>)}
              {!readOnly && <td><button type="button" aria-label={`Remove line ${i + 1}`} className="px-2 text-red-600" onClick={() => onChange(lines.filter((_, j) => j !== i))}>✕</button></td>}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot className="border-t bg-gray-50">{footer}</tfoot>}
      </table>
      {!readOnly && <div className="border-t p-2"><Button variant="secondary" onClick={() => onChange([...lines, newLine()])}>+ Add line</Button></div>}
    </div>
  )
}
