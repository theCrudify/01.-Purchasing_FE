'use client'
import { OutgoingPaymentPageView } from '@/components/outgoing-payment-page'

export default function OutgoingApInvoicePage() {
  return (
    <OutgoingPaymentPageView
      purpose="AP_INVOICE"
      title="Outgoing Payment — AP Invoice (OPAP)"
      subtitle="Create and approve outgoing vendor payments for AP Invoices (OPAP) via bank transfer or MUFG corporate disbursement."
      buttonLabel="New OP AP Invoice"
      targetLookupPath="/ap-invoices"
      targetFieldLabel="AP Invoice Document (INV)"
    />
  )
}
