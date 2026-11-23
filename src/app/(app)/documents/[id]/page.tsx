'use client'
import { use } from 'react'
import { useDocument } from '@/components/document'
import { DocumentWorkbench, type WorkbenchModule } from '@/components/document-workbench'
import { ErrorText } from '@/components/ui'

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { doc, error } = useDocument(id)

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

  const det = (doc as any).detail ?? {}
  let mod: WorkbenchModule = 'PR'
  switch (doc.docType) {
    case 'PR':
      mod = det.PurchaseClassCode === 'RAW_MAT' ? 'PR_RAW' : 'PR'
      break
    case 'RFQ':
      mod = 'RFQ'
      break
    case 'QUO':
      mod = 'QUO'
      break
    case 'CTR':
      mod = 'CTR'
      break
    case 'PO':
      mod = 'PO'
      break
    case 'GR':
      mod = 'GR'
      break
    case 'CA':
      mod = 'CA'
      break
    case 'STL':
      mod = 'STL'
      break
    case 'RMB':
      mod = 'RMB'
      break
    case 'INV':
      mod = 'INV'
      break
    case 'PAY':
      mod = det.Purpose === 'CASH_ADVANCE' ? 'OPCA' : det.Purpose === 'REIMBURSEMENT' ? 'OPRMB' : 'OPAP'
      break
    case 'ARI':
      mod = 'ARI'
      break
    case 'SVR':
      mod = 'SVR'
      break
  }

  return <DocumentWorkbench module={mod} documentId={id} />
}
