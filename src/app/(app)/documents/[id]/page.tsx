'use client'
import { use } from 'react'
import {
  ApprovalPanel,
  AttachmentPanel,
  CommentPanel,
  DocumentActions,
  DocumentHeader,
  StatusTimeline,
  useDocument,
} from '@/components/document'
import { ErrorText } from '@/components/ui'

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { doc, error, reload } = useDocument(id)

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

  return (
    <div className="space-y-6">
      <DocumentHeader doc={doc} actions={<DocumentActions doc={doc} onDone={reload} />} />

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
