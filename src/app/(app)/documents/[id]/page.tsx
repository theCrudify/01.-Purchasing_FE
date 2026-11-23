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
import { Card, ErrorText } from '@/components/ui'

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
    return <p className="p-8 text-center text-sm text-gray-500">Loading document...</p>
  }

  return (
    <div className="space-y-6">
      <DocumentHeader
        doc={doc}
        actions={<DocumentActions doc={doc} onDone={reload} />}
      />

      {/* Approval & Decision Workflow */}
      <ApprovalPanel doc={doc} onDone={reload} />

      {/* Status History & Audit Timeline */}
      <Card title="Status History">
        <StatusTimeline doc={doc} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Attachments */}
        <AttachmentPanel publicId={id} readOnly={doc.isDeleted} />

        {/* Discussion / Comments */}
        <CommentPanel publicId={id} />
      </div>
    </div>
  )
}
