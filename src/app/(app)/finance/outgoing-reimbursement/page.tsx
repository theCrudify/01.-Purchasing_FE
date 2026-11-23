'use client'
import { OutgoingPaymentPageView } from '@/components/outgoing-payment-page'

export default function OutgoingReimbursementPage() {
  return (
    <OutgoingPaymentPageView
      purpose="REIMBURSEMENT"
      title="Outgoing Payment — Reimbursement"
      subtitle="Process outgoing payment disbursements for approved employee and operational Reimbursement claims."
      buttonLabel="New Outgoing Reimbursement"
      targetLookupPath="/reimbursements"
      targetFieldLabel="Reimbursement Document (RMB)"
    />
  )
}
