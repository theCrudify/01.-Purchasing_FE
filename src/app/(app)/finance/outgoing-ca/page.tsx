'use client'
import { OutgoingPaymentPageView } from '@/components/outgoing-payment-page'

export default function OutgoingCashAdvancePage() {
  return (
    <OutgoingPaymentPageView
      purpose="CASH_ADVANCE"
      title="Outgoing Payment — Cash Advance (OPCA)"
      subtitle="Disburse approved employee Cash Advances (OPCA) from company bank or petty cash accounts."
      buttonLabel="New Outgoing Cash Advance"
      targetLookupPath="/cash-advances"
      targetFieldLabel="Cash Advance Document (CA)"
    />
  )
}
