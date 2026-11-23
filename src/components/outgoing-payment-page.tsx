'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Edit3, Eye, Plus, Send } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { Badge, Button, ErrorText, PageHeader, Select, fmtDate, fmtMoney } from '@/components/ui'
import { post } from '@/lib/api'
import { useList } from '@/lib/use-list'

type PayRow = {
  id: string
  docNo: string | null
  docDate: string
  plannedDate: string | null
  paidDate: string | null
  status: string
  title: string
  bpCode: string | null
  bpName: string | null
  purpose: string
  payeeType: string
  paymentMethod: string
  companyBankCode: string | null
  companyBankName: string | null
  bankReference: string | null
  targetDocNo: string | null
  targetDocPublicId: string | null
  currencyCode: string
  totalAmount: string
  ownerName: string
}

const BASE_HREF_BY_PURPOSE: Record<'AP_INVOICE' | 'CASH_ADVANCE' | 'REIMBURSEMENT', string> = {
  AP_INVOICE: '/finance/outgoing-ap',
  CASH_ADVANCE: '/finance/outgoing-ca',
  REIMBURSEMENT: '/finance/outgoing-reimbursement',
}

export function OutgoingPaymentPageView({
  purpose,
  title,
  subtitle,
  buttonLabel,
}: {
  purpose: 'AP_INVOICE' | 'CASH_ADVANCE' | 'REIMBURSEMENT'
  title: string
  subtitle: string
  buttonLabel: string
  targetLookupPath?: string
  targetFieldLabel?: string
}) {
  const baseHref = BASE_HREF_BY_PURPOSE[purpose]
  const [status, setStatus] = useState('')
  const list = useList<PayRow>('/payments', 'createdAt:desc', {
    status: status || undefined,
    purpose,
  })
  const [error, setError] = useState<string | null>(null)

  const submitDoc = async (id: string) => {
    setError(null)
    try {
      await post(`/payments/${id}/submit`)
      list.reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Link href={`${baseHref}/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              <span>{buttonLabel}</span>
            </Button>
          </Link>
        }
      />

      <ErrorText error={error} />

      <DataTable
        list={list}
        columns={[
          {
            key: 'docNo',
            header: 'Payment No.',
            sortable: true,
            render: (r) => (
              <Link className="font-semibold text-brand-600 hover:underline" href={`${baseHref}/${r.id}`}>
                {r.docNo ?? '(Draft)'}
              </Link>
            ),
          },
          { key: 'title', header: 'Payment Title' },
          {
            key: 'targetDocNo',
            header: 'Target Doc Ref.',
            render: (r) =>
              r.targetDocPublicId ? (
                <Link
                  href={`/documents/${r.targetDocPublicId}`}
                  className="font-mono text-xs font-semibold text-brand-600 hover:underline"
                >
                  {r.targetDocNo ?? 'Open Doc'}
                </Link>
              ) : (
                '—'
              ),
          },
          {
            key: 'companyBankName',
            header: 'Source Bank / Cash',
            render: (r) => (
              <div>
                <div className="font-medium text-gray-900">{r.companyBankName}</div>
                <div className="font-mono text-xs text-gray-500">{r.companyBankCode}</div>
              </div>
            ),
          },
          { key: 'paymentMethod', header: 'Method', render: (r) => <Badge value={r.paymentMethod} /> },
          { key: 'plannedDate', header: 'Planned Date', sortable: true, render: (r) => fmtDate(r.plannedDate) },
          {
            key: 'totalAmountBase',
            header: 'Payment Amount',
            sortable: true,
            render: (r) => <span className="font-semibold text-gray-900">{fmtMoney(r.totalAmount, r.currencyCode)}</span>,
          },
          { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge value={r.status} /> },
          {
            key: '_a',
            header: 'Actions',
            render: (r) => (
              <div className="flex items-center gap-1.5">
                <Link
                  href={`${baseHref}/${r.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {['DRAFT', 'RETURNED'].includes(r.status) ? (
                    <>
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Detail / Edit</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span>Detail</span>
                    </>
                  )}
                </Link>
                {['DRAFT', 'RETURNED'].includes(r.status) && (
                  <button
                    type="button"
                    onClick={() => submitDoc(r.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-100"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Submit</span>
                  </button>
                )}
              </div>
            ),
          },
        ]}
        actions={
          <Select
            className="h-[40px] w-44"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              list.setPage(1)
            }}
          >
            <option value="">All Statuses</option>
            {['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT_TO_BANK', 'POSTED', 'COMPLETED', 'FAILED', 'RETURNED', 'REJECTED'].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
          </Select>
        }
      />
    </div>
  )
}
