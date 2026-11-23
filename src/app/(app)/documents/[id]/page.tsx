'use client'
import { use, useEffect, useState } from 'react'
import { Send } from 'lucide-react'
import {
  ApprovalPanel,
  AttachmentPanel,
  CommentPanel,
  DocumentActions,
  DocumentHeader,
  StatusTimeline,
  useDocument,
} from '@/components/document'
import { Button, Card, ErrorText, fmtMoney } from '@/components/ui'
import { api, post } from '@/lib/api'

type DocLine = {
  id: string
  lineNum?: number
  lineNo?: number
  description: string
  specification?: string | null
  quantity: string
  unitPrice?: string
  estimatedUnitPrice?: string
  lineTotal?: string
  lineAmount?: string
  itemCode?: string | null
  itemName?: string | null
  uomCode?: string | null
}

const SUBMIT_PATH_BY_DOCTYPE: Record<string, string> = {
  PR: '/pr',
  RFQ: '/rfq',
  QUO: '/quotations',
  CTR: '/contracts',
  PO: '/po',
  GR: '/gr',
  SVR: '/verifications',
  CA: '/cash-advances',
  STL: '/settlements',
  RMB: '/reimbursements',
  INV: '/ap-invoices',
  PAY: '/payments',
  ARI: '/ar-invoices',
}

const LINES_PATH_BY_DOCTYPE: Record<string, string> = {
  PR: '/pr',
  RFQ: '/rfq',
  PO: '/po',
  CA: '/cash-advances',
  STL: '/settlements',
  RMB: '/reimbursements',
  INV: '/ap-invoices',
  ARI: '/ar-invoices',
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { doc, error, reload } = useDocument(id)
  const [lines, setLines] = useState<DocLine[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitErr, setSubmitErr] = useState<string | null>(null)

  useEffect(() => {
    if (!doc) return
    const base = LINES_PATH_BY_DOCTYPE[doc.docType]
    if (!base) {
      setLines([])
      return
    }
    api<{ data: DocLine[] }>(`${base}/${id}/lines`)
      .then((r) => setLines(r.data ?? []))
      .catch(() => setLines([]))
  }, [doc?.docType, id])

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorText error={error} />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500 shadow-theme-xs">
        Memuat detail dokumen…
      </div>
    )
  }

  const canSubmit =
    !doc.isDeleted &&
    ['DRAFT', 'RETURNED', 'REVISION_REQUIRED'].includes(doc.status) &&
    Boolean(SUBMIT_PATH_BY_DOCTYPE[doc.docType])

  const handleSubmitForApproval = async () => {
    const base = SUBMIT_PATH_BY_DOCTYPE[doc.docType]
    if (!base) return
    setSubmitting(true)
    setSubmitErr(null)
    try {
      await post(`${base}/${id}/submit`, {})
      reload()
    } catch (e: any) {
      setSubmitErr(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <DocumentHeader
        doc={doc}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canSubmit && (
              <Button onClick={handleSubmitForApproval} disabled={submitting}>
                <Send className="h-4 w-4" />
                <span>{submitting ? 'Submitting…' : 'Submit for Approval'}</span>
              </Button>
            )}
            <DocumentActions doc={doc} onDone={reload} />
          </div>
        }
      />

      <ErrorText error={submitErr} />

      {/* Document Line Items (PR / RFQ / PO) */}
      {lines.length > 0 && (
        <Card title={`Line Items (${lines.length})`} desc="Rincian item barang/jasa dalam dokumen ini.">
          <div className="overflow-x-auto -mx-5 -my-5">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-3 w-14">#</th>
                  <th className="px-4 py-3">Item / Description</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3">UoM</th>
                  {doc.docType !== 'RFQ' && (
                    <>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-5 py-3 text-right">Subtotal</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lines.map((ln, idx) => (
                  <tr key={ln.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{ln.lineNum ?? ln.lineNo ?? idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {ln.itemCode ? (
                          <span className="mr-2 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-700">
                            {ln.itemCode}
                          </span>
                        ) : null}
                        {ln.description}
                      </div>
                      {ln.specification && <p className="mt-0.5 text-xs text-gray-500">{ln.specification}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">{Number(ln.quantity).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{ln.uomCode ?? 'EA'}</td>
                    {doc.docType !== 'RFQ' && (
                      <>
                        <td className="px-4 py-3 text-right text-xs text-gray-700">
                          {fmtMoney(ln.unitPrice ?? ln.estimatedUnitPrice ?? '0', doc.currencyCode ?? 'IDR')}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-900">
                          {fmtMoney(ln.lineAmount ?? ln.lineTotal ?? '0', doc.currencyCode ?? 'IDR')}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Approval & Decision Workflow */}
      <ApprovalPanel doc={doc} onDone={reload} />

      {/* Status History & Audit Timeline */}
      <StatusTimeline doc={doc} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Attachments */}
        <AttachmentPanel publicId={id} readOnly={doc.isDeleted} />

        {/* Discussion / Comments */}
        <CommentPanel publicId={id} />
      </div>
    </div>
  )
}
