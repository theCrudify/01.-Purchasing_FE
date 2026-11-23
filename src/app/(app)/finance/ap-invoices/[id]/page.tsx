"use client"
import { use } from "react"
import { DocumentWorkbench } from "@/components/document-workbench"

export default function DetailINVPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <DocumentWorkbench module="INV" documentId={id} />
}
