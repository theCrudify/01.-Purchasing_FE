'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  FileText,
  Paperclip,
  Printer,
  Save,
  Send,
  ShieldCheck,
  Upload,
  UserCheck,
} from 'lucide-react'
import {
  ApprovalPanel,
  AttachmentPanel,
  CommentPanel,
  DocumentActions,
  LinesEditor,
  StatusTimeline,
  useDocument,
} from '@/components/document'
import { LookupSelect } from '@/components/form'
import {
  Badge,
  Button,
  Card,
  ErrorText,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
  fmtDate,
  fmtMoney,
} from '@/components/ui'
import { api, patch, post } from '@/lib/api'
import { useMe } from '@/lib/me'

export type WorkbenchModule =
  | 'PR'
  | 'PR_RAW'
  | 'RFQ'
  | 'QUO'
  | 'CTR'
  | 'PO'
  | 'GR'
  | 'CA'
  | 'STL'
  | 'RMB'
  | 'INV'
  | 'OPAP'
  | 'OPCA'
  | 'OPRMB'
  | 'ARI'
  | 'SVR'

const MODULE_META: Record<
  WorkbenchModule,
  {
    docType: string
    apiPath: string
    listHref: string
    titleNew: string
    titleDetail: string
    subtitle: string
  }
> = {
  PR: {
    docType: 'PR',
    apiPath: '/pr',
    listHref: '/purchasing/pr',
    titleNew: 'Add Purchase Request (PR)',
    titleDetail: 'Detail & Edit Purchase Request (PR)',
    subtitle: 'Full requisition form with Requester Info, Department, Classification, Item Detail/Purpose, Attachments, and Multi-Level Approval.',
  },
  PR_RAW: {
    docType: 'PR',
    apiPath: '/pr',
    listHref: '/purchasing/pr-raw-material',
    titleNew: 'Add Purchase Request — Raw Material',
    titleDetail: 'Detail & Edit PR Raw Material',
    subtitle: 'Production raw material requisition with Inventory/SAP columns (Inv UoM, ETA Plant, ETA Jakarta, Division) and Approval Sign-off.',
  },
  RFQ: {
    docType: 'RFQ',
    apiPath: '/rfq',
    listHref: '/purchasing/rfq',
    titleNew: 'Add Request for Quotation (RFQ)',
    titleDetail: 'Detail & Edit Request for Quotation (RFQ)',
    subtitle: 'Competitive bidding invitation with technical specifications, closing deadline, evaluation method, and invited vendor participants.',
  },
  QUO: {
    docType: 'QUO',
    apiPath: '/quotations',
    listHref: '/purchasing/quotations',
    titleNew: 'Add Vendor Quotation (QUO)',
    titleDetail: 'Detail & Edit Vendor Quotation (QUO)',
    subtitle: 'Record supplier price quotation, validity period, payment & delivery terms, lead time, and line item pricing.',
  },
  CTR: {
    docType: 'CTR',
    apiPath: '/contracts',
    listHref: '/purchasing/contracts',
    titleNew: 'Add Purchase Contract (CTR)',
    titleDetail: 'Detail & Edit Purchase Contract (CTR)',
    subtitle: 'Blanket quantity or value purchase agreement with validity period, target commitment, and contracted item prices.',
  },
  PO: {
    docType: 'PO',
    apiPath: '/po',
    listHref: '/purchasing/po',
    titleNew: 'Add Purchase Order (PO)',
    titleDetail: 'Detail & Edit Purchase Order (PO)',
    subtitle: 'Official supplier purchase order with shipping terms, delivery schedule, line discounts, VAT 11%, and approval matrix.',
  },
  GR: {
    docType: 'GR',
    apiPath: '/gr',
    listHref: '/purchasing/gr',
    titleNew: 'Add Goods Receipt / BAST (GR)',
    titleDetail: 'Detail & Edit Goods Receipt (GR)',
    subtitle: 'Warehouse goods receipt & QC inspection against Purchase Order with Delivery Note (Surat Jalan), vehicle plate, and accepted/rejected qty.',
  },
  CA: {
    docType: 'CA',
    apiPath: '/cash-advances',
    listHref: '/finance/cash-advances',
    titleNew: 'Add Cash Advance Request (CA)',
    titleDetail: 'Detail & Edit Cash Advance (CA)',
    subtitle: 'Employee operational cash advance request with NIK, Transaction Type, Category/Account Name/GL Account (COA) lines, and 6-role Approval.',
  },
  STL: {
    docType: 'STL',
    apiPath: '/settlements',
    listHref: '/finance/settlements',
    titleNew: 'Add Cash Advance Settlement (STL)',
    titleDetail: 'Detail & Edit Settlement (STL)',
    subtitle: 'Realization & accountability of disbursed Cash Advance with Control Account, Bank Transfer info, actual expense lines, and Refund/Top-up calculation.',
  },
  RMB: {
    docType: 'RMB',
    apiPath: '/reimbursements',
    listHref: '/finance/reimbursements',
    titleNew: 'Add Reimbursement Claim (RMB)',
    titleDetail: 'Detail & Edit Reimbursement (RMB)',
    subtitle: 'Employee & operational expense reimbursement voucher with Pay To, Reference Doc (Invoice/Receipt No.), GL Account lines, and Approval.',
  },
  INV: {
    docType: 'INV',
    apiPath: '/ap-invoices',
    listHref: '/finance/ap-invoices',
    titleNew: 'Create AP Invoice (INV)',
    titleDetail: 'Detail & Edit AP Invoice (INV)',
    subtitle: 'Accounts Payable supplier invoice with Vendor Invoice No., Faktur Pajak (Tax Invoice No.), PO Reference, DPP, VAT (PPN), WHT (PPh), and Net Payable.',
  },
  OPAP: {
    docType: 'PAY',
    apiPath: '/payments',
    listHref: '/finance/outgoing-ap',
    titleNew: 'Add Outgoing Payment — AP Invoice (OPAP)',
    titleDetail: 'Detail & Edit Outgoing Payment AP Invoice (OPAP)',
    subtitle: 'Outgoing vendor payment voucher (OVPM) for AP Invoices with Account Bank Transfer (MUFG / BCA), Journal Memo, WTax, and 6-step Sign-off.',
  },
  OPCA: {
    docType: 'PAY',
    apiPath: '/payments',
    listHref: '/finance/outgoing-ca',
    titleNew: 'Add Outgoing Payment — Cash Advance (OPCA)',
    titleDetail: 'Detail & Edit Outgoing Cash Advance (OPCA)',
    subtitle: 'Disbursement voucher for approved Cash Advance requests with Remittance Request Amount, Account Bank Transfer, Control Account, and Sign-off.',
  },
  OPRMB: {
    docType: 'PAY',
    apiPath: '/payments',
    listHref: '/finance/outgoing-reimbursement',
    titleNew: 'Add Outgoing Payment — Reimbursement',
    titleDetail: 'Detail & Edit Outgoing Reimbursement',
    subtitle: 'Disbursement voucher for approved Reimbursement claims with Reimburse No., Pay To, Transfer Date, Account Bank Transfer, and Sign-off.',
  },
  ARI: {
    docType: 'ARI',
    apiPath: '/ar-invoices',
    listHref: '/finance/ar-invoices',
    titleNew: 'Create AR Invoice (ARI)',
    titleDetail: 'Detail & Edit AR Invoice (ARI)',
    subtitle: 'Accounts Receivable customer invoice with Card Code/Name, Customer PO (Number at Card), Commercial & Tax Invoice No., Shipping Type, and Revenue G/L lines.',
  },
  SVR: {
    docType: 'SVR',
    apiPath: '/verifications',
    listHref: '/vendors/verifications',
    titleNew: 'Add Supplier Verification (SVR)',
    titleDetail: 'Detail & Edit Supplier Verification (SVR)',
    subtitle: 'Business partner legal, tax (NPWP/PKP/NIB), bank account, and compliance qualification review document.',
  },
}

export function DocumentWorkbench({
  module,
  documentId,
  backHref,
}: {
  module: WorkbenchModule
  documentId?: string
  backHref?: string
}) {
  const meta = MODULE_META[module]
  const router = useRouter()
  const me = useMe()
  const isNew = !documentId
  const { doc, error: loadErr, reload } = useDocument(documentId ?? null)

  const [editMode, setEditMode] = useState(isNew)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [rawMatClassId, setRawMatClassId] = useState<number>(1)

  // Unified rich form state covering all fields from OLD Expressiv & Supplier Portal
  const [form, setForm] = useState({
    title: '',
    docDate: new Date().toISOString().slice(0, 10),
    requiredDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    departmentId: null as number | null,
    departmentLabel: '',
    purchaseClassId: null as number | null,
    purchaseClassLabel: '',
    costCenterId: null as number | null,
    costCenterLabel: '',
    currencyCode: 'IDR',
    exchangeRate: '1',
    sourcingMethod: 'DIRECT',
    justification: '',
    remarks: '',
    journalRemarks: '',
    // RFQ / QUO / CTR / PO / GR
    submissionDeadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    quoteValidityDays: '30',
    evaluationMethod: 'LOWEST_PRICE',
    terms: 'Franco Warehouse Cikarang, TOP 30 Days after Invoice & Faktur Pajak received',
    rfqId: '',
    rfqLabel: '',
    bpId: '',
    bpLabel: '',
    bpReference: '',
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    paymentTermId: null as number | null,
    paymentTermLabel: '',
    deliveryTerms: 'Franco Gudang Cikarang',
    agreementType: 'QUANTITY',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    targetAmount: '0',
    poType: 'STANDARD',
    shippingMethod: 'Land Freight Truck',
    deliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    deliveryAddress: 'Plant 1 Receiving Warehouse — Kawasan Industri Cikarang',
    freightAmount: '0',
    poId: '',
    poLabel: '',
    receiptKind: 'RECEIPT',
    receivedDate: new Date().toISOString().slice(0, 10),
    deliveryNoteNo: '',
    vehiclePlateNo: '',
    driverName: '',
    carrierName: '',
    location: 'Main Receiving Dock A',
    returnReason: '',
    // CA / STL / RMB
    transactionTypeId: null as number | null,
    transactionTypeLabel: '',
    purpose: '',
    paidToText: '',
    caId: '',
    caLabel: '',
    caAmount: 0,
    referenceNo: '',
    controlAccount: '114100 — Uang Muka Karyawan (Cash Advance Control)',
    bankTransferInfo: 'MUFG Bank Operational IDR (710-0012345-88)',
    payeeType: 'EMPLOYEE',
    // INV / ARI
    invoiceKind: 'INVOICE',
    bpInvoiceNo: '',
    taxInvoiceNo: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    whtAmount: '0',
    customerPoNo: '',
    commercialInvoiceNo: '',
    billToAddress: 'Kawasan Industri Jababeka Tahap II, Cikarang, Bekasi',
    trackNo: '',
    // PAY (OPAP / OPCA / OPRMB)
    targetDocId: '',
    targetDocLabel: '',
    companyBankAccountId: null as number | null,
    companyBankLabel: '',
    paymentMethod: 'TRANSFER',
    plannedDate: new Date().toISOString().slice(0, 10),
    amountApplied: '0',
    bankReference: '',
    // SVR
    requestType: 'INITIAL_ONBOARDING',
    // Multi-level Approval Sign-off Matrix (Expressiv 6-Role Sign-off)
    preparedByName: '',
    checkedByName: 'Budi Santoso (Section Head)',
    acknowledgedByName: 'Siti Rahmawati (Department Manager)',
    approvedByName: 'Hiroshi Tanaka (Division Director)',
    receivedByName: 'Andi Pratama (Finance & Accounting Verification)',
    closedByName: 'Rina Kusuma (Treasury & Settlement Control)',
  })

  type LineItem = {
    itemId: number | null
    itemLabel?: string
    description: string
    detailSpec: string
    purpose: string
    categoryId: number | null
    categoryLabel?: string
    uomId: number | null
    uomLabel?: string
    quantity: string
    unitPrice: string
    discountPercent: string
    leadTimeDays: string
    // PR Raw Material SAP / Inventory extra fields
    invUom: string
    etaPlant: string
    etaJakarta: string
    division: string
    // GR fields
    receivedQty: string
    acceptedQty: string
    rejectedQty: string
    rejectReason: string
    // Finance / Expense fields
    coaId: number | null
    coaLabel?: string
    costCenterId: number | null
    costCenterLabel?: string
    expenseDate: string
  }

  const emptyLine = (): LineItem => ({
    itemId: null,
    description: '',
    detailSpec: '',
    purpose: '',
    categoryId: 1,
    uomId: 1,
    uomLabel: 'EA',
    quantity: '1',
    unitPrice: '0',
    discountPercent: '0',
    leadTimeDays: '7',
    invUom: 'KG',
    etaPlant: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    etaJakarta: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
    division: 'PROD-01',
    receivedQty: '1',
    acceptedQty: '1',
    rejectedQty: '0',
    rejectReason: '',
    coaId: null,
    costCenterId: null,
    expenseDate: new Date().toISOString().slice(0, 10),
  })

  const [lines, setLines] = useState<LineItem[]>([emptyLine()])

  useEffect(() => {
    api<{ data: { id: number; code: string; name: string }[] }>('/purchase-classes?pageSize=50')
      .then((r) => {
        const raw = r.data?.find((x) => x.code === 'RAW_MAT')
        if (raw) {
          setRawMatClassId(raw.id)
          if (module === 'PR_RAW') {
            setForm((f) => ({
              ...f,
              purchaseClassId: raw.id,
              purchaseClassLabel: `${raw.code} — ${raw.name}`,
            }))
          }
        }
      })
      .catch(() => {})
  }, [module])

  // Populate form when viewing/editing an existing document
  useEffect(() => {
    if (!doc) return
    const det = (doc as any).detail ?? {}
    const rawLines: any[] = (doc as any).lines ?? []

    setForm((f) => ({
      ...f,
      title: doc.title ?? '',
      docDate: doc.docDate ?? f.docDate,
      requiredDate: det.RequiredDate ? String(det.RequiredDate).slice(0, 10) : f.requiredDate,
      departmentId: det.DepartmentId ?? f.departmentId,
      departmentLabel: det.DepartmentName ?? f.departmentLabel,
      purchaseClassId: det.PurchaseClassId ?? (module === 'PR_RAW' ? rawMatClassId : f.purchaseClassId),
      purchaseClassLabel: det.PurchaseClassName ?? f.purchaseClassLabel,
      costCenterId: det.CostCenterId ?? f.costCenterId,
      costCenterLabel: det.CostCenterName ?? f.costCenterLabel,
      currencyCode: doc.currencyCode ?? 'IDR',
      exchangeRate: doc.exchangeRate ?? '1',
      sourcingMethod: det.SourcingMethod ?? f.sourcingMethod,
      justification: det.Justification ?? f.justification,
      remarks: doc.remarks ?? '',
      submissionDeadline: det.SubmissionDeadline
        ? String(det.SubmissionDeadline).slice(0, 16)
        : f.submissionDeadline,
      quoteValidityDays: String(det.QuoteValidityDays ?? f.quoteValidityDays),
      evaluationMethod: det.EvaluationMethod ?? f.evaluationMethod,
      terms: det.Terms ?? f.terms,
      rfqId: det.RfqPublicId ?? f.rfqId,
      rfqLabel: det.RfqDocNo ?? f.rfqLabel,
      bpId: det.BpPublicId ?? f.bpId,
      bpLabel: det.BpName ? `${det.BpCode ?? ''} — ${det.BpName}` : f.bpLabel,
      bpReference: det.BpReference ?? f.bpReference,
      validUntil: det.ValidUntil ? String(det.ValidUntil).slice(0, 10) : f.validUntil,
      paymentTermId: det.PaymentTermId ?? f.paymentTermId,
      paymentTermLabel: det.PaymentTermName ?? f.paymentTermLabel,
      deliveryTerms: det.DeliveryTerms ?? f.deliveryTerms,
      agreementType: det.AgreementType ?? f.agreementType,
      startDate: det.StartDate ? String(det.StartDate).slice(0, 10) : f.startDate,
      endDate: det.EndDate ? String(det.EndDate).slice(0, 10) : f.endDate,
      targetAmount: String(det.TargetAmount ?? doc.totalAmount ?? '0'),
      poType: det.PoType ?? f.poType,
      shippingMethod: det.ShippingMethod ?? f.shippingMethod,
      deliveryDate: det.DeliveryDate ? String(det.DeliveryDate).slice(0, 10) : f.deliveryDate,
      deliveryAddress: det.DeliveryAddress ?? f.deliveryAddress,
      freightAmount: String(det.FreightAmount ?? '0'),
      poId: det.PoPublicId ?? f.poId,
      poLabel: det.PoDocNo ?? f.poLabel,
      receiptKind: det.ReceiptKind ?? f.receiptKind,
      receivedDate: det.ReceivedDate ? String(det.ReceivedDate).slice(0, 10) : f.receivedDate,
      deliveryNoteNo: det.DeliveryNoteNo ?? '',
      vehiclePlateNo: det.VehiclePlateNo ?? '',
      driverName: det.DriverName ?? '',
      carrierName: det.CarrierName ?? '',
      location: det.Location ?? f.location,
      returnReason: det.ReturnReason ?? '',
      transactionTypeId: det.TransactionTypeId ?? f.transactionTypeId,
      transactionTypeLabel: det.TransactionTypeName ?? f.transactionTypeLabel,
      purpose: det.Purpose ?? f.purpose,
      caId: det.CaPublicId ?? f.caId,
      caLabel: det.CaDocNo ? `${det.CaDocNo} — ${det.CaTitle ?? ''}` : f.caLabel,
      caAmount: Number(det.AdvanceAmount ?? 0),
      referenceNo: det.ReferenceNo ?? '',
      payeeType: det.PayeeType ?? f.payeeType,
      invoiceKind: det.InvoiceKind ?? f.invoiceKind,
      bpInvoiceNo: det.BpInvoiceNo ?? '',
      taxInvoiceNo: det.TaxInvoiceNo ?? '',
      invoiceDate: det.InvoiceDate ? String(det.InvoiceDate).slice(0, 10) : doc.docDate,
      dueDate: det.DueDate ? String(det.DueDate).slice(0, 10) : f.dueDate,
      whtAmount: String(det.WhtAmount ?? '0'),
      customerPoNo: det.CustomerPoNo ?? '',
      commercialInvoiceNo: det.CommercialInvoiceNo ?? '',
      targetDocId: det.TargetDocPublicId ?? f.targetDocId,
      targetDocLabel: det.TargetDocNo ?? f.targetDocLabel,
      companyBankAccountId: det.CompanyBankAccountId ?? f.companyBankAccountId,
      companyBankLabel: det.CompanyBankName ?? f.companyBankLabel,
      paymentMethod: det.PaymentMethod ?? f.paymentMethod,
      plannedDate: det.PlannedDate ? String(det.PlannedDate).slice(0, 10) : doc.docDate,
      amountApplied: String(doc.totalAmount ?? '0'),
      bankReference: det.BankReference ?? '',
      requestType: det.RequestType ?? f.requestType,
      preparedByName: doc.ownerName || me?.displayName || 'System Administrator',
    }))

    if (rawLines.length > 0) {
      setLines(
        rawLines.map((ln) => ({
          ...emptyLine(),
          itemId: ln.itemId ?? null,
          itemLabel: ln.itemCode ? `${ln.itemCode} — ${ln.itemName ?? ln.description}` : undefined,
          description: ln.description ?? '',
          detailSpec: ln.specification ?? '',
          purpose: ln.purpose ?? '',
          categoryId: ln.categoryId ?? 1,
          categoryLabel: ln.categoryName ?? undefined,
          uomId: ln.uomId ?? 1,
          uomLabel: ln.uomCode ?? 'EA',
          quantity: String(ln.quantity ?? ln.targetQty ?? '1'),
          unitPrice: String(ln.unitPrice ?? ln.estimatedUnitPrice ?? ln.amount ?? '0'),
          discountPercent: String(ln.discountPercent ?? '0'),
          leadTimeDays: String(ln.leadTimeDays ?? '7'),
          receivedQty: String(ln.receivedQty ?? ln.quantity ?? '1'),
          acceptedQty: String(ln.acceptedQty ?? ln.quantity ?? '1'),
          rejectedQty: String(ln.rejectedQty ?? '0'),
          rejectReason: ln.rejectReason ?? '',
          coaId: ln.coaId ?? ln.revenueCoaId ?? null,
          coaLabel: ln.itemCode ? `${ln.itemCode} — ${ln.itemName ?? ''}` : undefined,
          costCenterId: ln.costCenterId ?? null,
          costCenterLabel: ln.costCenterCode ?? undefined,
          expenseDate: ln.expenseDate ?? doc.docDate,
        }))
      )
    }

    setEditMode(false)
  }, [doc?.id, doc?.version])

  const isEditableStatus = isNew || (doc && !doc.isDeleted && ['DRAFT', 'RETURNED', 'REVISION_REQUIRED'].includes(doc.status))
  const readOnly = !editMode || !isEditableStatus

  // Computed financial totals
  const isExpenseDoc = ['CA', 'STL', 'RMB'].includes(meta.docType)
  const isVatDoc = ['PO', 'INV', 'ARI'].includes(meta.docType)

  const subtotal = lines.reduce((sum, l) => {
    if (isExpenseDoc) return sum + (Number(l.unitPrice) || 0)
    const q = Number(l.quantity) || 0
    const p = Number(l.unitPrice) || 0
    const d = Number(l.discountPercent) || 0
    return sum + q * p * (1 - d / 100)
  }, 0)

  const vatAmount = isVatDoc ? subtotal * 0.11 : 0
  const whtAmount = meta.docType === 'INV' ? Number(form.whtAmount) || 0 : 0
  const freightAmount = meta.docType === 'PO' ? Number(form.freightAmount) || 0 : 0
  const grandTotal =
    meta.docType === 'PAY' ? Number(form.amountApplied) || 0 : subtotal + vatAmount + freightAmount - whtAmount
  const stlDiff = form.caAmount - subtotal

  function buildPayload() {
    switch (module) {
      case 'PR':
      case 'PR_RAW':
        return {
          title: form.title,
          docDate: form.docDate,
          requiredDate: form.requiredDate,
          departmentId: Number(form.departmentId),
          purchaseClassId: module === 'PR_RAW' ? rawMatClassId : Number(form.purchaseClassId),
          costCenterId: form.costCenterId ? Number(form.costCenterId) : null,
          currencyCode: form.currencyCode,
          sourcingMethod: form.sourcingMethod,
          justification: form.justification || null,
          remarks: form.remarks || null,
          lines: lines.map((l) => ({
            itemId: l.itemId,
            description: [l.description, l.detailSpec ? `Spec: ${l.detailSpec}` : '', l.purpose ? `Purpose: ${l.purpose}` : '']
              .filter(Boolean)
              .join(' | '),
            categoryId: l.categoryId,
            uomId: Number(l.uomId || 1),
            quantity: Number(l.quantity || 1),
            estimatedUnitPrice: Number(l.unitPrice || 0),
          })),
        }
      case 'RFQ':
        return {
          title: form.title,
          docDate: form.docDate,
          departmentId: form.departmentId ? Number(form.departmentId) : null,
          submissionDeadline: form.submissionDeadline,
          quoteValidityDays: Number(form.quoteValidityDays || 30),
          evaluationMethod: form.evaluationMethod,
          currencyCode: form.currencyCode,
          terms: form.terms || null,
          remarks: form.remarks || null,
          vendorIds: form.bpId ? [form.bpId] : [],
          lines: lines.map((l) => ({
            itemId: l.itemId,
            description: l.description,
            categoryId: Number(l.categoryId || 1),
            uomId: Number(l.uomId || 1),
            quantity: Number(l.quantity || 1),
            specification: l.detailSpec || null,
          })),
        }
      case 'QUO':
        return {
          title: form.title,
          rfqId: form.rfqId,
          bpId: form.bpId,
          bpReference: form.bpReference || null,
          validUntil: form.validUntil || null,
          currencyCode: form.currencyCode,
          paymentTermId: form.paymentTermId ? Number(form.paymentTermId) : null,
          deliveryTerms: form.deliveryTerms || null,
          remarks: form.remarks || null,
          lines: lines.map((l) => ({
            quantity: Number(l.quantity || 1),
            unitPrice: Number(l.unitPrice || 0),
            discountPercent: Number(l.discountPercent || 0),
            leadTimeDays: Number(l.leadTimeDays || 7),
          })),
        }
      case 'CTR':
        return {
          title: form.title,
          bpId: form.bpId,
          agreementType: form.agreementType,
          startDate: form.startDate,
          endDate: form.endDate,
          targetAmount: Number(form.targetAmount || subtotal || 0),
          purchaseClassId: Number(form.purchaseClassId || 1),
          paymentTermId: Number(form.paymentTermId || 1),
          currencyCode: form.currencyCode,
          bpReference: form.bpReference || null,
          terms: form.terms || null,
          remarks: form.remarks || null,
          lines: lines.map((l) => ({
            itemId: l.itemId,
            description: l.description,
            uomId: Number(l.uomId || 1),
            targetQty: Number(l.quantity || 1),
            unitPrice: Number(l.unitPrice || 0),
            discountPercent: Number(l.discountPercent || 0),
          })),
        }
      case 'PO':
        return {
          title: form.title,
          bpId: form.bpId,
          purchaseClassId: Number(form.purchaseClassId || 1),
          paymentTermId: Number(form.paymentTermId || 1),
          currencyCode: form.currencyCode,
          poType: form.poType,
          bpReference: form.bpReference || null,
          shippingMethod: form.shippingMethod || null,
          deliveryDate: form.deliveryDate || null,
          deliveryAddress: form.deliveryAddress || null,
          freightAmount: Number(form.freightAmount || 0),
          remarks: form.remarks || null,
          lines: lines.map((l) => ({
            itemId: l.itemId,
            description: l.description,
            uomId: Number(l.uomId || 1),
            quantity: Number(l.quantity || 1),
            unitPrice: Number(l.unitPrice || 0),
            discountPercent: Number(l.discountPercent || 0),
          })),
        }
      case 'GR':
        return {
          title: form.title,
          poId: form.poId,
          receiptKind: form.receiptKind,
          receivedDate: form.receivedDate,
          deliveryNoteNo: form.deliveryNoteNo || null,
          vehiclePlateNo: form.vehiclePlateNo || null,
          driverName: form.driverName || null,
          carrierName: form.carrierName || null,
          location: form.location || null,
          returnReason: form.returnReason || null,
          remarks: form.remarks || null,
          lines: lines.map((l) => ({
            receivedQty: Number(l.receivedQty || 1),
            acceptedQty: Number(l.acceptedQty || 1),
            rejectedQty: Number(l.rejectedQty || 0),
            rejectReason: l.rejectReason || null,
          })),
        }
      case 'CA':
        return {
          title: form.title,
          departmentId: form.departmentId ? Number(form.departmentId) : null,
          transactionTypeId: Number(form.transactionTypeId),
          purpose: form.purpose || form.title,
          requiredDate: form.requiredDate || null,
          currencyCode: form.currencyCode,
          remarks: form.remarks || null,
          lines: lines.map((l) => ({
            coaId: Number(l.coaId || 1),
            costCenterId: l.costCenterId ? Number(l.costCenterId) : null,
            description: l.description,
            expenseDate: l.expenseDate || null,
            amount: Number(l.unitPrice || 0),
          })),
        }
      case 'STL':
        return {
          title: form.title,
          caId: form.caId,
          purpose: form.purpose || form.title,
          referenceNo: form.referenceNo || null,
          remarks: form.remarks || null,
          lines: lines.map((l) => ({
            coaId: Number(l.coaId || 1),
            costCenterId: l.costCenterId ? Number(l.costCenterId) : null,
            description: l.description,
            expenseDate: l.expenseDate || null,
            amount: Number(l.unitPrice || 0),
          })),
        }
      case 'RMB':
        return {
          title: form.title,
          departmentId: form.departmentId ? Number(form.departmentId) : null,
          payeeType: form.payeeType,
          bpId: form.payeeType === 'BP' && form.bpId ? form.bpId : null,
          transactionTypeId: Number(form.transactionTypeId),
          referenceNo: form.referenceNo || null,
          currencyCode: form.currencyCode,
          remarks: form.remarks || null,
          lines: lines.map((l) => ({
            coaId: Number(l.coaId || 1),
            costCenterId: l.costCenterId ? Number(l.costCenterId) : null,
            description: l.description,
            expenseDate: l.expenseDate || null,
            amount: Number(l.unitPrice || 0),
          })),
        }
      case 'INV':
        return {
          title: form.title,
          bpId: form.bpId,
          poId: form.poId || null,
          invoiceKind: form.invoiceKind,
          bpInvoiceNo: form.bpInvoiceNo,
          taxInvoiceNo: form.taxInvoiceNo || null,
          invoiceDate: form.invoiceDate,
          dueDate: form.dueDate || null,
          currencyCode: form.currencyCode,
          whtAmount: Number(form.whtAmount || 0),
          remarks: form.remarks || null,
          lines: lines.map((l) => ({
            description: l.description,
            coaId: l.coaId ? Number(l.coaId) : null,
            quantity: Number(l.quantity || 1),
            unitPrice: Number(l.unitPrice || 0),
            discountPercent: Number(l.discountPercent || 0),
          })),
        }
      case 'OPAP':
      case 'OPCA':
      case 'OPRMB':
        return {
          title: form.title,
          purpose:
            module === 'OPAP' ? 'AP_INVOICE' : module === 'OPCA' ? 'CASH_ADVANCE' : 'REIMBURSEMENT',
          targetDocId: form.targetDocId,
          companyBankAccountId: Number(form.companyBankAccountId),
          paymentMethod: form.paymentMethod,
          plannedDate: form.plannedDate,
          amountApplied: Number(form.amountApplied || 0),
          bankReference: form.bankReference || null,
          remarks: form.remarks || null,
        }
      case 'ARI':
        return {
          title: form.title,
          bpId: form.bpId,
          invoiceKind: form.invoiceKind,
          customerPoNo: form.customerPoNo || null,
          commercialInvoiceNo: form.commercialInvoiceNo || null,
          taxInvoiceNo: form.taxInvoiceNo || null,
          invoiceDate: form.invoiceDate,
          dueDate: form.dueDate || null,
          currencyCode: form.currencyCode,
          remarks: form.remarks || null,
          lines: lines.map((l) => ({
            itemId: l.itemId,
            description: l.description,
            uomId: l.uomId ? Number(l.uomId) : null,
            revenueCoaId: l.coaId ? Number(l.coaId) : null,
            quantity: Number(l.quantity || 1),
            unitPrice: Number(l.unitPrice || 0),
            discountPercent: Number(l.discountPercent || 0),
          })),
        }
      case 'SVR':
        return {
          title: form.title,
          bpId: form.bpId,
          requestType: form.requestType,
          remarks: form.remarks || null,
        }
    }
  }

  async function handleSave(andSubmit: boolean) {
    setError(null)
    setSuccessMsg(null)
    if (!form.title.trim()) {
      setError('Document Title / Subject is required.')
      return
    }
    setBusy(true)
    try {
      const payload = buildPayload()
      let targetId = documentId

      if (isNew) {
        const res = await post<{ data: { id: string; docNo?: string } }>(meta.apiPath, payload)
        targetId = res.data.id
        for (const f of pendingFiles) {
          const fd = new FormData()
          fd.append('file', f)
          fd.append('category', 'OTHER')
          fd.append('visibility', 'SHARED')
          await post(`/documents/${targetId}/attachments`, fd).catch(() => {})
        }
      } else if (targetId) {
        await patch(`${meta.apiPath}/${targetId}`, payload)
      }

      if (andSubmit && targetId) {
        await post(`${meta.apiPath}/${targetId}/submit`, {})
      }

      if (isNew && targetId) {
        router.push(`${meta.listHref}/${targetId}`)
      } else {
        setSuccessMsg(
          andSubmit
            ? 'Document saved and submitted to Approval Workflow successfully.'
            : 'Document changes saved successfully.'
        )
        setEditMode(false)
        reload()
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (!isNew && loadErr) {
    return (
      <div className="space-y-4">
        <ErrorText error={loadErr} />
        <Link href={backHref ?? meta.listHref}>
          <Button variant="secondary">← Back to List</Button>
        </Link>
      </div>
    )
  }

  if (!isNew && !doc) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500 shadow-theme-xs">
        Loading full document form…
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Bar & Breadcrumb */}
      <PageHeader
        title={isNew ? meta.titleNew : `${meta.titleDetail} — ${doc?.docNo ?? '(Draft)'}`}
        subtitle={meta.subtitle}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href={backHref ?? meta.listHref}>
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to List</span>
              </Button>
            </Link>

            {!isNew && doc && (
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                <span>Print Voucher / Form</span>
              </Button>
            )}

            {!isNew && isEditableStatus && !editMode && (
              <Button onClick={() => setEditMode(true)}>
                <Edit3 className="h-4 w-4" />
                <span>Edit Document Form</span>
              </Button>
            )}

            {!isNew && isEditableStatus && !editMode && (
              <Button onClick={() => handleSave(true)} disabled={busy}>
                <Send className="h-4 w-4" />
                <span>Submit for Approval</span>
              </Button>
            )}

            {editMode && isEditableStatus && (
              <>
                {!isNew && (
                  <Button variant="secondary" onClick={() => setEditMode(false)}>
                    Cancel Edit
                  </Button>
                )}
                <Button variant="secondary" onClick={() => handleSave(false)} disabled={busy}>
                  <Save className="h-4 w-4" />
                  <span>{busy ? 'Saving…' : 'Save as Draft'}</span>
                </Button>
                <Button onClick={() => handleSave(true)} disabled={busy}>
                  <Send className="h-4 w-4" />
                  <span>{busy ? 'Submitting…' : 'Save & Submit Approval'}</span>
                </Button>
              </>
            )}

            {!isNew && doc && <DocumentActions doc={doc} onDone={reload} />}
          </div>
        }
      />

      <ErrorText error={error} />
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Status & Requester Banner (like Expressiv Selected Requester Info & Status bar) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-brand-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Requester & Organization Info
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge value={meta.docType} />
              <Badge value={doc?.status ?? 'DRAFT'} />
              {doc?.version && <span className="font-mono text-xs text-gray-400">Rev #{doc.version}</span>}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div>
              <span className="block text-gray-500">Document No.</span>
              <span className="mt-0.5 block font-mono font-bold text-gray-900">
                {doc?.docNo ?? 'AUTO-NUMBER ON SAVE'}
              </span>
            </div>
            <div>
              <span className="block text-gray-500">Requester / Preparer</span>
              <span className="mt-0.5 block font-semibold text-gray-900">
                {doc?.ownerName ?? me?.displayName ?? 'System Administrator'}
              </span>
            </div>
            <div>
              <span className="block text-gray-500">Employee NIK</span>
              <span className="mt-0.5 block font-mono font-semibold text-gray-800">EMP-0001</span>
            </div>
            <div>
              <span className="block text-gray-500">Submission / Doc Date</span>
              <span className="mt-0.5 block font-semibold text-gray-900">{fmtDate(form.docDate)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 shadow-theme-xs lg:col-span-4 flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
            Total Document Value ({form.currencyCode})
          </span>
          <div className="my-1 text-2xl font-bold text-gray-900">
            {fmtMoney(grandTotal, form.currencyCode)}
          </div>
          <span className="text-[11px] text-gray-600">
            {isVatDoc
              ? `DPP: ${fmtMoney(subtotal, form.currencyCode)} · PPN 11%: ${fmtMoney(vatAmount, form.currencyCode)}`
              : `${lines.length} line item(s) · Exchange Rate: ${form.exchangeRate}`}
          </span>
        </div>
      </div>

      {/* SECTION 1: Two-Column Full Header Form (Matching OLD/00. EXP_V1 2-Column Layout) */}
      <Card
        title="1. Document Header & General Information"
        desc="Lengkapi seluruh atribut header dokumen. Kolom bertanda (*) wajib diisi sebelum dokumen disimpan atau diajukan."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-4">
            <Field label="Document Number (Auto)">
              <Input disabled value={doc?.docNo ?? 'AUTO-GENERATED UPON SAVE'} />
            </Field>

            <Field label="Document Title / Subject" required>
              <Input
                disabled={readOnly}
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={`Enter ${meta.docType} title or transaction summary...`}
              />
            </Field>

            {['PR', 'PR_RAW', 'RFQ', 'CA', 'RMB'].includes(module) && (
              <Field label="Requesting Department" required={['PR', 'PR_RAW'].includes(module)}>
                {readOnly ? (
                  <Input disabled value={form.departmentLabel || 'Default Department'} />
                ) : (
                  <LookupSelect
                    path="/departments"
                    params={{ isActive: 'true' }}
                    value={form.departmentId}
                    initialLabel={form.departmentLabel}
                    label={(r) => `${r.code} — ${r.name}`}
                    onChange={(v, r) =>
                      setForm({ ...form, departmentId: v, departmentLabel: r ? `${r.code} — ${r.name}` : '' })
                    }
                  />
                )}
              </Field>
            )}

            {['PR', 'CTR', 'PO'].includes(module) && (
              <Field label="Classification / Purchase Class" required>
                {readOnly ? (
                  <Input disabled value={form.purchaseClassLabel || 'Standard Purchase Class'} />
                ) : (
                  <LookupSelect
                    path="/purchase-classes"
                    params={{ isActive: 'true' }}
                    value={form.purchaseClassId}
                    initialLabel={form.purchaseClassLabel}
                    label={(r) => `${r.code} — ${r.name}`}
                    onChange={(v, r) =>
                      setForm({ ...form, purchaseClassId: v, purchaseClassLabel: r ? `${r.code} — ${r.name}` : '' })
                    }
                  />
                )}
              </Field>
            )}

            {module === 'PR_RAW' && (
              <Field label="Classification / Purchase Class">
                <Input disabled value="RAW_MAT — Raw Materials & Chemical Resin (Inventory / SAP)" />
              </Field>
            )}

            {['PR', 'PR_RAW'].includes(module) && (
              <Field label="Cost Center">
                {readOnly ? (
                  <Input disabled value={form.costCenterLabel || '—'} />
                ) : (
                  <LookupSelect
                    path="/cost-centers"
                    params={{ isActive: 'true' }}
                    value={form.costCenterId}
                    initialLabel={form.costCenterLabel}
                    label={(r) => `${r.code} — ${r.name}`}
                    onChange={(v, r) =>
                      setForm({ ...form, costCenterId: v, costCenterLabel: r ? `${r.code} — ${r.name}` : '' })
                    }
                  />
                )}
              </Field>
            )}

            {['RFQ', 'QUO', 'CTR', 'PO', 'INV', 'ARI', 'SVR'].includes(module) && (
              <Field
                label={module === 'ARI' ? 'Customer / Business Partner (Card Code & Name)' : 'Vendor / Business Partner'}
                required={module !== 'RFQ'}
              >
                {readOnly ? (
                  <Input disabled value={form.bpLabel || '—'} />
                ) : (
                  <LookupSelect
                    path="/vendors"
                    value={form.bpId}
                    initialLabel={form.bpLabel}
                    label={(r) => `${r.bpCode ?? ''} — ${r.legalName}`}
                    onChange={(v, r) =>
                      setForm({ ...form, bpId: v ?? '', bpLabel: r ? `${r.bpCode ?? ''} — ${r.legalName}` : '' })
                    }
                  />
                )}
              </Field>
            )}

            {module === 'QUO' && (
              <Field label="Reference RFQ Document" required>
                {readOnly ? (
                  <Input disabled value={form.rfqLabel || form.rfqId} />
                ) : (
                  <LookupSelect
                    path="/rfq"
                    value={form.rfqId}
                    initialLabel={form.rfqLabel}
                    label={(r) => `${r.docNo ?? '(Draft)'} — ${r.title}`}
                    onChange={(v, r) => setForm({ ...form, rfqId: v ?? '', rfqLabel: r?.docNo ?? '' })}
                  />
                )}
              </Field>
            )}

            {['GR', 'INV'].includes(module) && (
              <Field label="Reference Purchase Order (PO)" required={module === 'GR'}>
                {readOnly ? (
                  <Input disabled value={form.poLabel || form.poId || '—'} />
                ) : (
                  <LookupSelect
                    path="/po"
                    value={form.poId}
                    initialLabel={form.poLabel}
                    label={(r) => `${r.docNo ?? '(Draft)'} — ${r.title} (${r.bpName ?? ''})`}
                    onChange={(v, r) => setForm({ ...form, poId: v ?? '', poLabel: r?.docNo ?? '' })}
                  />
                )}
              </Field>
            )}

            {['CA', 'RMB'].includes(module) && (
              <>
                <Field label="Type of Transaction" required>
                  {readOnly ? (
                    <Input disabled value={form.transactionTypeLabel || '—'} />
                  ) : (
                    <LookupSelect
                      path="/transaction-types"
                      params={{ module: module === 'CA' ? 'CA' : 'RMB' }}
                      value={form.transactionTypeId}
                      initialLabel={form.transactionTypeLabel}
                      label={(r) => `${r.code} — ${r.name}`}
                      onChange={(v, r) =>
                        setForm({
                          ...form,
                          transactionTypeId: v,
                          transactionTypeLabel: r ? `${r.code} — ${r.name}` : '',
                        })
                      }
                    />
                  )}
                </Field>
                <Field label="Pay To / Beneficiary Name">
                  <Input
                    disabled={readOnly}
                    value={form.paidToText || (doc?.ownerName ?? me?.displayName ?? '')}
                    onChange={(e) => setForm({ ...form, paidToText: e.target.value })}
                    placeholder="Employee or Vendor Payee Name"
                  />
                </Field>
              </>
            )}

            {module === 'STL' && (
              <>
                <Field label="Cash Advance Document (Unsettled CA)" required>
                  {readOnly ? (
                    <Input disabled value={form.caLabel || form.caId} />
                  ) : (
                    <LookupSelect
                      path="/cash-advances"
                      value={form.caId}
                      initialLabel={form.caLabel}
                      label={(r) => `${r.docNo ?? '(Draft)'} — ${r.title} (${fmtMoney(r.totalAmount, r.currencyCode)})`}
                      onChange={(v, r) =>
                        setForm({
                          ...form,
                          caId: v ?? '',
                          caLabel: r ? `${r.docNo} — ${r.title}` : '',
                          caAmount: Number(r?.totalAmount ?? 0),
                          title: form.title || (r ? `Settlement — ${r.title}` : ''),
                        })
                      }
                    />
                  )}
                </Field>
                <Field label="Control Account">
                  <Input disabled value={form.controlAccount} />
                </Field>
                <Field label="Account Bank Transfer">
                  <Input disabled value={form.bankTransferInfo} />
                </Field>
              </>
            )}

            {['OPAP', 'OPCA', 'OPRMB'].includes(module) && (
              <>
                <Field
                  label={
                    module === 'OPAP'
                      ? 'Target AP Invoice Document (INV)'
                      : module === 'OPCA'
                      ? 'Target Cash Advance Document (CA)'
                      : 'Target Reimbursement Document (RMB)'
                  }
                  required
                >
                  {readOnly ? (
                    <Input disabled value={form.targetDocLabel || form.targetDocId} />
                  ) : (
                    <LookupSelect
                      path={
                        module === 'OPAP'
                          ? '/ap-invoices'
                          : module === 'OPCA'
                          ? '/cash-advances'
                          : '/reimbursements'
                      }
                      value={form.targetDocId}
                      initialLabel={form.targetDocLabel}
                      label={(r) => `${r.docNo ?? '(Draft)'} — ${r.title} (${fmtMoney(r.totalAmount, r.currencyCode)})`}
                      onChange={(v, r) =>
                        setForm({
                          ...form,
                          targetDocId: v ?? '',
                          targetDocLabel: r?.docNo ?? '',
                          amountApplied: r?.totalAmount ? String(r.totalAmount) : form.amountApplied,
                          title:
                            form.title ||
                            (r ? `Outgoing Payment (${module}) — ${r.docNo ?? ''} ${r.title}` : ''),
                        })
                      }
                    />
                  )}
                </Field>

                <Field label="Account Bank Transfer (Company Bank / Cash)" required>
                  {readOnly ? (
                    <Input disabled value={form.companyBankLabel || 'MUFG-IDR'} />
                  ) : (
                    <LookupSelect
                      path="/company-banks"
                      value={form.companyBankAccountId}
                      initialLabel={form.companyBankLabel}
                      label={(r) => `${r.code} — ${r.name} (${r.accountNo})`}
                      onChange={(v, r) =>
                        setForm({
                          ...form,
                          companyBankAccountId: v,
                          companyBankLabel: r ? `${r.code} — ${r.name}` : '',
                        })
                      }
                    />
                  )}
                </Field>
              </>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Issuance / Document Date" required>
                <Input
                  type="date"
                  disabled={readOnly}
                  value={form.docDate}
                  onChange={(e) => setForm({ ...form, docDate: e.target.value })}
                />
              </Field>

              {['PR', 'PR_RAW', 'CA'].includes(module) && (
                <Field label="Required Date" required>
                  <Input
                    type="date"
                    disabled={readOnly}
                    value={form.requiredDate}
                    onChange={(e) => setForm({ ...form, requiredDate: e.target.value })}
                  />
                </Field>
              )}

              {module === 'PO' && (
                <Field label="Expected Delivery Date" required>
                  <Input
                    type="date"
                    disabled={readOnly}
                    value={form.deliveryDate}
                    onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                  />
                </Field>
              )}

              {module === 'GR' && (
                <Field label="Goods Received Date" required>
                  <Input
                    type="date"
                    disabled={readOnly}
                    value={form.receivedDate}
                    onChange={(e) => setForm({ ...form, receivedDate: e.target.value })}
                  />
                </Field>
              )}

              {['INV', 'ARI'].includes(module) && (
                <>
                  <Field label="Invoice Date" required>
                    <Input
                      type="date"
                      disabled={readOnly}
                      value={form.invoiceDate}
                      onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
                    />
                  </Field>
                  <Field label="Due Date">
                    <Input
                      type="date"
                      disabled={readOnly}
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    />
                  </Field>
                </>
              )}

              {['OPAP', 'OPCA', 'OPRMB'].includes(module) && (
                <Field label="Plan Transfer / Payment Date" required>
                  <Input
                    type="date"
                    disabled={readOnly}
                    value={form.plannedDate}
                    onChange={(e) => setForm({ ...form, plannedDate: e.target.value })}
                  />
                </Field>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Document Currency" required>
                <Select
                  disabled={readOnly}
                  value={form.currencyCode}
                  onChange={(e) => setForm({ ...form, currencyCode: e.target.value })}
                >
                  {['IDR', 'USD', 'JPY', 'EUR', 'SGD'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Document Status">
                <Input disabled value={doc?.status ?? 'DRAFT'} />
              </Field>
            </div>

            {['PR', 'PR_RAW'].includes(module) && (
              <Field label="Sourcing Method">
                <Select
                  disabled={readOnly}
                  value={form.sourcingMethod}
                  onChange={(e) => setForm({ ...form, sourcingMethod: e.target.value })}
                >
                  <option value="DIRECT">DIRECT (Direct Purchase Order)</option>
                  <option value="RFQ">RFQ (Competitive Bidding / Quotation)</option>
                  <option value="CONTRACT">CONTRACT (Blanket Agreement Release)</option>
                </Select>
              </Field>
            )}

            {module === 'RFQ' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Submission Deadline" required>
                  <Input
                    type="datetime-local"
                    disabled={readOnly}
                    value={form.submissionDeadline}
                    onChange={(e) => setForm({ ...form, submissionDeadline: e.target.value })}
                  />
                </Field>
                <Field label="Evaluation Method">
                  <Select
                    disabled={readOnly}
                    value={form.evaluationMethod}
                    onChange={(e) => setForm({ ...form, evaluationMethod: e.target.value })}
                  >
                    <option value="LOWEST_PRICE">LOWEST_PRICE</option>
                    <option value="WEIGHTED">WEIGHTED (Technical + Commercial)</option>
                    <option value="MANUAL">MANUAL COMMITTEE</option>
                  </Select>
                </Field>
              </div>
            )}

            {['QUO', 'CTR', 'PO'].includes(module) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Payment Term" required={['CTR', 'PO'].includes(module)}>
                  {readOnly ? (
                    <Input disabled value={form.paymentTermLabel || 'NET30'} />
                  ) : (
                    <LookupSelect
                      path="/payment-terms"
                      params={{ isActive: 'true' }}
                      value={form.paymentTermId}
                      initialLabel={form.paymentTermLabel}
                      label={(r) => `${r.code} — ${r.name}`}
                      onChange={(v, r) =>
                        setForm({ ...form, paymentTermId: v, paymentTermLabel: r ? `${r.code} — ${r.name}` : '' })
                      }
                    />
                  )}
                </Field>
                <Field label="Vendor Reference / Quotation No.">
                  <Input
                    disabled={readOnly}
                    value={form.bpReference}
                    onChange={(e) => setForm({ ...form, bpReference: e.target.value })}
                    placeholder="e.g. QUO/VND/2026/001"
                  />
                </Field>
              </div>
            )}

            {module === 'CTR' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Agreement Type">
                  <Select
                    disabled={readOnly}
                    value={form.agreementType}
                    onChange={(e) => setForm({ ...form, agreementType: e.target.value })}
                  >
                    <option value="QUANTITY">QUANTITY CONTRACT</option>
                    <option value="AMOUNT">VALUE / BLANKET</option>
                  </Select>
                </Field>
                <Field label="Valid Start Date" required>
                  <Input
                    type="date"
                    disabled={readOnly}
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </Field>
                <Field label="Valid End Date" required>
                  <Input
                    type="date"
                    disabled={readOnly}
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </Field>
              </div>
            )}

            {module === 'PO' && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="PO Type">
                    <Select
                      disabled={readOnly}
                      value={form.poType}
                      onChange={(e) => setForm({ ...form, poType: e.target.value })}
                    >
                      <option value="STANDARD">STANDARD PO</option>
                      <option value="BLANKET">BLANKET RELEASE PO</option>
                      <option value="SERVICE">SERVICE WORK ORDER</option>
                    </Select>
                  </Field>
                  <Field label="Shipping Method">
                    <Input
                      disabled={readOnly}
                      value={form.shippingMethod}
                      onChange={(e) => setForm({ ...form, shippingMethod: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Delivery Address">
                  <Input
                    disabled={readOnly}
                    value={form.deliveryAddress}
                    onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                  />
                </Field>
              </>
            )}

            {module === 'GR' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Delivery Note No. (Nomor Surat Jalan)" required>
                  <Input
                    disabled={readOnly}
                    value={form.deliveryNoteNo}
                    onChange={(e) => setForm({ ...form, deliveryNoteNo: e.target.value })}
                    placeholder="e.g. SJ/KIN/2026/0891"
                  />
                </Field>
                <Field label="Vehicle Plate No.">
                  <Input
                    disabled={readOnly}
                    value={form.vehiclePlateNo}
                    onChange={(e) => setForm({ ...form, vehiclePlateNo: e.target.value })}
                    placeholder="e.g. B 9421 KXR"
                  />
                </Field>
                <Field label="Driver Name">
                  <Input
                    disabled={readOnly}
                    value={form.driverName}
                    onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                  />
                </Field>
                <Field label="Receiving Warehouse Location">
                  <Input
                    disabled={readOnly}
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </Field>
              </div>
            )}

            {['CA', 'STL', 'RMB'].includes(module) && (
              <>
                <Field label="Reference Voucher / Receipt No." required={module === 'RMB'}>
                  <Input
                    disabled={readOnly}
                    value={form.referenceNo}
                    onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
                    placeholder="e.g. INV-99281 / BKK-2026-01"
                  />
                </Field>
                <Field label="Purpose / Activity Detail" required>
                  <Input
                    disabled={readOnly}
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    placeholder="Detailed business purpose..."
                  />
                </Field>
              </>
            )}

            {module === 'INV' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Vendor Invoice No." required>
                  <Input
                    disabled={readOnly}
                    value={form.bpInvoiceNo}
                    onChange={(e) => setForm({ ...form, bpInvoiceNo: e.target.value })}
                    placeholder="e.g. INV/2026/0412"
                  />
                </Field>
                <Field label="Tax Invoice No. (Nomor Faktur Pajak)">
                  <Input
                    disabled={readOnly}
                    value={form.taxInvoiceNo}
                    onChange={(e) => setForm({ ...form, taxInvoiceNo: e.target.value })}
                    placeholder="e.g. 010.004-26.12345678"
                  />
                </Field>
                <Field label="Invoice Kind">
                  <Select
                    disabled={readOnly}
                    value={form.invoiceKind}
                    onChange={(e) => setForm({ ...form, invoiceKind: e.target.value })}
                  >
                    <option value="INVOICE">STANDARD AP INVOICE</option>
                    <option value="DOWN_PAYMENT">DOWN PAYMENT (DP)</option>
                    <option value="CREDIT_MEMO">CREDIT MEMO</option>
                  </Select>
                </Field>
                <Field label="Withholding Tax (PPh 23 / 4(2)) Amount">
                  <Input
                    type="number"
                    disabled={readOnly}
                    value={form.whtAmount}
                    onChange={(e) => setForm({ ...form, whtAmount: e.target.value })}
                  />
                </Field>
              </div>
            )}

            {module === 'ARI' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Number at Card (Customer PO No.)">
                  <Input
                    disabled={readOnly}
                    value={form.customerPoNo}
                    onChange={(e) => setForm({ ...form, customerPoNo: e.target.value })}
                    placeholder="e.g. CUST-PO-2026-99"
                  />
                </Field>
                <Field label="Commercial Invoice No.">
                  <Input
                    disabled={readOnly}
                    value={form.commercialInvoiceNo}
                    onChange={(e) => setForm({ ...form, commercialInvoiceNo: e.target.value })}
                    placeholder="e.g. CI-2026-0041"
                  />
                </Field>
                <Field label="Tax Invoice No. (Faktur Pajak Keluaran)">
                  <Input
                    disabled={readOnly}
                    value={form.taxInvoiceNo}
                    onChange={(e) => setForm({ ...form, taxInvoiceNo: e.target.value })}
                    placeholder="e.g. 010.005-26.99887766"
                  />
                </Field>
                <Field label="Shipping Type / Track No.">
                  <Input
                    disabled={readOnly}
                    value={form.trackNo}
                    onChange={(e) => setForm({ ...form, trackNo: e.target.value })}
                    placeholder="Land / Sea Freight Tracking"
                  />
                </Field>
              </div>
            )}

            {['OPAP', 'OPCA', 'OPRMB'].includes(module) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Payment Method">
                  <Select
                    disabled={readOnly}
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  >
                    <option value="TRANSFER">TRANSFER (MUFG / Bank Transfer)</option>
                    <option value="CASH">CASH (Petty Cash)</option>
                    <option value="GIRO">GIRO / CHEQUE</option>
                  </Select>
                </Field>
                <Field label="Bank Transfer / Batch Reference No.">
                  <Input
                    disabled={readOnly}
                    value={form.bankReference}
                    onChange={(e) => setForm({ ...form, bankReference: e.target.value })}
                    placeholder="e.g. MUFG-BATCH-2026-01"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Remittance / Transfer Amount" required>
                    <Input
                      type="number"
                      step="any"
                      disabled={readOnly}
                      value={form.amountApplied}
                      onChange={(e) => setForm({ ...form, amountApplied: e.target.value })}
                    />
                  </Field>
                </div>
              </div>
            )}

            {module === 'SVR' && (
              <Field label="Verification Request Type" required>
                <Select
                  disabled={readOnly}
                  value={form.requestType}
                  onChange={(e) => setForm({ ...form, requestType: e.target.value })}
                >
                  <option value="INITIAL_ONBOARDING">INITIAL_ONBOARDING (New Supplier Qualification)</option>
                  <option value="BANK_CHANGE">BANK_CHANGE (Bank Account Verification)</option>
                  <option value="TAX_UPDATE">TAX_UPDATE (NPWP / PKP Legal Update)</option>
                  <option value="PERIODIC_REVIEW">PERIODIC_REVIEW (Annual Vendor Evaluation)</option>
                </Select>
              </Field>
            )}
          </div>
        </div>
      </Card>

      {/* SECTION 2: Full-Width Line Items Grid (matching addPR, addPRRawMaterial, addCash, addSettle, addReim, add_ARInvoiceNew) */}
      {!['SVR', 'OPAP', 'OPCA', 'OPRMB'].includes(module) && (
        <Card
          title={
            module === 'PR_RAW'
              ? '2. Raw Material & SAP Inventory Line Items'
              : isExpenseDoc
              ? '2. Expense Breakdown & G/L Account (COA) Lines'
              : '2. Document Line Items & Specifications'
          }
          desc="Tambahkan seluruh baris item, spesifikasi detail, kuantitas, satuan (UoM), akun G/L (COA), dan harga satuan."
        >
          {isExpenseDoc ? (
            <LinesEditor<LineItem>
              lines={lines}
              onChange={setLines}
              newLine={emptyLine}
              readOnly={readOnly}
              columns={[
                {
                  key: 'coa',
                  header: 'G/L Account (COA) & Account Name *',
                  width: '30%',
                  render: (row, set) =>
                    readOnly ? (
                      <span className="font-mono text-xs font-semibold text-gray-800">
                        {row.coaLabel || `COA #${row.coaId ?? 1}`}
                      </span>
                    ) : (
                      <LookupSelect
                        path="/coas"
                        value={row.coaId}
                        initialLabel={row.coaLabel}
                        label={(r) => `${r.code} — ${r.name}`}
                        onChange={(v, r) => set({ coaId: v, coaLabel: r ? `${r.code} — ${r.name}` : '' })}
                      />
                    ),
                },
                {
                  key: 'cc',
                  header: 'Cost Center / Division',
                  width: '18%',
                  render: (row, set) =>
                    readOnly ? (
                      <span className="text-xs text-gray-700">{row.costCenterLabel || '—'}</span>
                    ) : (
                      <LookupSelect
                        path="/cost-centers"
                        value={row.costCenterId}
                        initialLabel={row.costCenterLabel}
                        label={(r) => `${r.code} — ${r.name}`}
                        onChange={(v, r) => set({ costCenterId: v, costCenterLabel: r?.code })}
                      />
                    ),
                },
                {
                  key: 'desc',
                  header: 'Expense / Receipt Description *',
                  width: '28%',
                  render: (row, set) => (
                    <Input
                      disabled={readOnly}
                      required
                      value={row.description}
                      onChange={(e) => set({ description: e.target.value })}
                      placeholder="Detailed expense item..."
                    />
                  ),
                },
                {
                  key: 'date',
                  header: 'Receipt Date',
                  width: '12%',
                  render: (row, set) => (
                    <Input
                      type="date"
                      disabled={readOnly}
                      value={row.expenseDate}
                      onChange={(e) => set({ expenseDate: e.target.value })}
                    />
                  ),
                },
                {
                  key: 'amt',
                  header: 'Amount *',
                  width: '12%',
                  render: (row, set) => (
                    <Input
                      type="number"
                      step="any"
                      disabled={readOnly}
                      required
                      value={row.unitPrice}
                      onChange={(e) => set({ unitPrice: e.target.value })}
                    />
                  ),
                },
              ]}
              footer={
                <>
                  {module === 'STL' && (
                    <tr>
                      <td colSpan={4} className="px-3 py-1.5 text-right text-xs text-gray-500">
                        Original Disbursed Cash Advance:
                      </td>
                      <td colSpan={2} className="px-3 py-1.5 text-xs font-semibold text-gray-800">
                        {fmtMoney(form.caAmount, form.currencyCode)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right text-xs font-bold text-gray-700">
                      Total Amount:
                    </td>
                    <td colSpan={2} className="px-3 py-2 text-sm font-bold text-brand-700">
                      {fmtMoney(subtotal, form.currencyCode)}
                    </td>
                  </tr>
                  {module === 'STL' && (
                    <tr className="border-t border-gray-200">
                      <td colSpan={4} className="px-3 py-2 text-right text-xs font-bold text-gray-700">
                        Settlement Difference ({stlDiff >= 0 ? 'Refund to Company' : 'Top-up to Employee'}):
                      </td>
                      <td colSpan={2} className="px-3 py-2 text-sm font-bold text-gray-900">
                        {fmtMoney(stlDiff, form.currencyCode)}
                      </td>
                    </tr>
                  )}
                </>
              }
            />
          ) : module === 'GR' ? (
            <LinesEditor<LineItem>
              lines={lines}
              onChange={setLines}
              newLine={emptyLine}
              readOnly={readOnly}
              columns={[
                {
                  key: 'desc',
                  header: 'PO Line Item Description',
                  width: '36%',
                  render: (row, set) => (
                    <Input
                      disabled={readOnly}
                      value={row.description}
                      onChange={(e) => set({ description: e.target.value })}
                      placeholder="Received item description"
                    />
                  ),
                },
                {
                  key: 'rec',
                  header: 'Delivered Qty (SJ) *',
                  width: '16%',
                  render: (row, set) => (
                    <Input
                      type="number"
                      step="any"
                      disabled={readOnly}
                      value={row.receivedQty}
                      onChange={(e) => set({ receivedQty: e.target.value, acceptedQty: e.target.value })}
                    />
                  ),
                },
                {
                  key: 'acc',
                  header: 'QC Accepted Qty *',
                  width: '16%',
                  render: (row, set) => (
                    <Input
                      type="number"
                      step="any"
                      disabled={readOnly}
                      value={row.acceptedQty}
                      onChange={(e) => set({ acceptedQty: e.target.value })}
                    />
                  ),
                },
                {
                  key: 'rej',
                  header: 'Rejected Qty',
                  width: '14%',
                  render: (row, set) => (
                    <Input
                      type="number"
                      step="any"
                      disabled={readOnly}
                      value={row.rejectedQty}
                      onChange={(e) => set({ rejectedQty: e.target.value })}
                    />
                  ),
                },
                {
                  key: 'reason',
                  header: 'QC / Reject Remarks',
                  width: '18%',
                  render: (row, set) => (
                    <Input
                      disabled={readOnly}
                      value={row.rejectReason}
                      onChange={(e) => set({ rejectReason: e.target.value })}
                      placeholder="Optional QC note"
                    />
                  ),
                },
              ]}
            />
          ) : (
            <LinesEditor<LineItem>
              lines={lines}
              onChange={setLines}
              newLine={emptyLine}
              readOnly={readOnly}
              columns={[
                {
                  key: 'item',
                  header: 'Item No. / Catalog',
                  width: '18%',
                  render: (row, set) =>
                    readOnly ? (
                      <span className="font-mono text-xs font-semibold text-gray-800">
                        {row.itemLabel || '—'}
                      </span>
                    ) : (
                      <LookupSelect
                        path="/items"
                        params={{ isActive: 'true' }}
                        value={row.itemId}
                        initialLabel={row.itemLabel}
                        label={(r) => `${r.code} — ${r.name}`}
                        onChange={(v, r) =>
                          set({
                            itemId: v,
                            itemLabel: r ? `${r.code} — ${r.name}` : '',
                            description: r ? r.name : row.description,
                            uomId: r?.uomId ?? row.uomId,
                            uomLabel: r?.uomCode ?? row.uomLabel,
                          })
                        }
                      />
                    ),
                },
                {
                  key: 'desc',
                  header: 'Description *',
                  width: module === 'PR_RAW' ? '20%' : '26%',
                  render: (row, set) => (
                    <Input
                      disabled={readOnly}
                      required
                      value={row.description}
                      onChange={(e) => set({ description: e.target.value })}
                      placeholder="Item description"
                    />
                  ),
                },
                ...(module === 'PR' || module === 'RFQ'
                  ? [
                      {
                        key: 'detail',
                        header: 'Detail / Spec',
                        width: '16%',
                        render: (row: LineItem, set: (p: Partial<LineItem>) => void) => (
                          <Input
                            disabled={readOnly}
                            value={row.detailSpec}
                            onChange={(e) => set({ detailSpec: e.target.value })}
                            placeholder="Spec / Grade"
                          />
                        ),
                      },
                      {
                        key: 'purpose',
                        header: 'Purpose',
                        width: '14%',
                        render: (row: LineItem, set: (p: Partial<LineItem>) => void) => (
                          <Input
                            disabled={readOnly}
                            value={row.purpose}
                            onChange={(e) => set({ purpose: e.target.value })}
                            placeholder="Usage purpose"
                          />
                        ),
                      },
                    ]
                  : []),
                ...(module === 'PR_RAW'
                  ? [
                      {
                        key: 'etaPlant',
                        header: 'ETA Plant',
                        width: '12%',
                        render: (row: LineItem, set: (p: Partial<LineItem>) => void) => (
                          <Input
                            type="date"
                            disabled={readOnly}
                            value={row.etaPlant}
                            onChange={(e) => set({ etaPlant: e.target.value })}
                          />
                        ),
                      },
                      {
                        key: 'etaJkt',
                        header: 'ETA Jakarta',
                        width: '12%',
                        render: (row: LineItem, set: (p: Partial<LineItem>) => void) => (
                          <Input
                            type="date"
                            disabled={readOnly}
                            value={row.etaJakarta}
                            onChange={(e) => set({ etaJakarta: e.target.value })}
                          />
                        ),
                      },
                      {
                        key: 'div',
                        header: 'Division',
                        width: '10%',
                        render: (row: LineItem, set: (p: Partial<LineItem>) => void) => (
                          <Input
                            disabled={readOnly}
                            value={row.division}
                            onChange={(e) => set({ division: e.target.value })}
                          />
                        ),
                      },
                    ]
                  : []),
                {
                  key: 'qty',
                  header: 'Quantity *',
                  width: '10%',
                  render: (row, set) => (
                    <Input
                      type="number"
                      min="0.0001"
                      step="any"
                      disabled={readOnly}
                      required
                      value={row.quantity}
                      onChange={(e) => set({ quantity: e.target.value })}
                    />
                  ),
                },
                {
                  key: 'uom',
                  header: 'UoM *',
                  width: '12%',
                  render: (row, set) =>
                    readOnly ? (
                      <span className="text-xs font-semibold text-gray-700">{row.uomLabel || 'EA'}</span>
                    ) : (
                      <LookupSelect
                        path="/uoms"
                        params={{ isActive: 'true' }}
                        value={row.uomId}
                        initialLabel={row.uomLabel}
                        label={(r) => `${r.code} — ${r.name}`}
                        onChange={(v, r) => set({ uomId: v, uomLabel: r?.code })}
                      />
                    ),
                },
                ...(module !== 'RFQ'
                  ? [
                      {
                        key: 'price',
                        header: 'Unit Price',
                        width: '14%',
                        render: (row: LineItem, set: (p: Partial<LineItem>) => void) => (
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            disabled={readOnly}
                            value={row.unitPrice}
                            onChange={(e) => set({ unitPrice: e.target.value })}
                          />
                        ),
                      },
                    ]
                  : []),
              ]}
              footer={
                module !== 'RFQ' ? (
                  <>
                    <tr>
                      <td colSpan={4} className="px-3 py-1.5 text-right text-xs text-gray-500">
                        Subtotal (DPP):
                      </td>
                      <td colSpan={4} className="px-3 py-1.5 text-xs font-semibold text-gray-800">
                        {fmtMoney(subtotal, form.currencyCode)}
                      </td>
                    </tr>
                    {isVatDoc && (
                      <tr>
                        <td colSpan={4} className="px-3 py-1.5 text-right text-xs text-gray-500">
                          VAT / PPN (11%):
                        </td>
                        <td colSpan={4} className="px-3 py-1.5 text-xs font-semibold text-gray-800">
                          {fmtMoney(vatAmount, form.currencyCode)}
                        </td>
                      </tr>
                    )}
                    {meta.docType === 'INV' && whtAmount > 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-1.5 text-right text-xs text-gray-500">
                          Less WHT / PPh:
                        </td>
                        <td colSpan={4} className="px-3 py-1.5 text-xs font-semibold text-error-600">
                          - {fmtMoney(whtAmount, form.currencyCode)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t border-gray-200">
                      <td colSpan={4} className="px-3 py-2 text-right text-xs font-bold text-gray-700">
                        Grand Total ({form.currencyCode}):
                      </td>
                      <td colSpan={4} className="px-3 py-2 text-sm font-bold text-brand-700">
                        {fmtMoney(grandTotal, form.currencyCode)}
                      </td>
                    </tr>
                  </>
                ) : undefined
              }
            />
          )}
        </Card>
      )}

      {/* SECTION 3: Supporting Attachments, Remarks & Multi-Level Sign-off Matrix */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Card
            title="3. Remarks, Justification & Terms"
            desc="Catatan bisnis, alasan pengadaan, instruksi pengiriman, atau memo jurnal."
          >
            <div className="space-y-4">
              {['PR', 'PR_RAW'].includes(module) && (
                <Field label="Business Justification / Purpose of Requisition">
                  <Textarea
                    rows={2}
                    disabled={readOnly}
                    value={form.justification}
                    onChange={(e) => setForm({ ...form, justification: e.target.value })}
                    placeholder="Explain why this requisition is needed..."
                  />
                </Field>
              )}

              {['RFQ', 'CTR'].includes(module) && (
                <Field label="Commercial Terms & Conditions">
                  <Textarea
                    rows={2}
                    disabled={readOnly}
                    value={form.terms}
                    onChange={(e) => setForm({ ...form, terms: e.target.value })}
                  />
                </Field>
              )}

              <Field label="Remarks / General Notes" required={['CA', 'RMB'].includes(module)}>
                <Textarea
                  rows={3}
                  disabled={readOnly}
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Enter remarks, notes, or payment instructions..."
                />
              </Field>

              {['OPAP', 'OPCA', 'OPRMB', 'INV', 'ARI'].includes(module) && (
                <Field label="Journal Remarks / G/L Memo">
                  <Input
                    disabled={readOnly}
                    value={form.journalRemarks}
                    onChange={(e) => setForm({ ...form, journalRemarks: e.target.value })}
                    placeholder="Optional accounting journal memo..."
                  />
                </Field>
              )}
            </div>
          </Card>

          {/* File Attachments on Create OR Live AttachmentPanel on Existing Doc */}
          {isNew ? (
            <Card
              title="4. Attach Supporting Documents (PDF / Quotations / Invoices)"
              desc="Pilih file PDF/lampiran pendukung. File akan otomatis diunggah begitu dokumen disimpan."
            >
              <div className="space-y-3">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.xlsx,.docx"
                  onChange={(e) => setPendingFiles(Array.from(e.target.files ?? []))}
                  className="block w-full rounded-lg border border-gray-300 bg-white text-xs text-gray-700 file:mr-3 file:rounded-l-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-700"
                />
                {pendingFiles.length > 0 && (
                  <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs">
                    {pendingFiles.map((f, i) => (
                      <li key={i} className="flex items-center justify-between py-1.5 px-2">
                        <span className="font-medium text-gray-800">{f.name}</span>
                        <span className="text-gray-500">{(f.size / 1024).toFixed(0)} KB</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          ) : (
            doc && <AttachmentPanel publicId={doc.id} readOnly={doc.isDeleted} />
          )}
        </div>

        {/* Multi-Level Approval Sign-off Section (Proposed / Checked / Acknowledged / Approved / Received / Closed) */}
        <div className="space-y-6 lg:col-span-5">
          <Card
            title="Approval Sign-Off Matrix"
            desc="Pejabat pemeriksa dan pemberi persetujuan berjenjang (Prepared, Checked, Acknowledged, Approved, Received, Closed)."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Prepared / Proposed By">
                <Input
                  disabled
                  value={form.preparedByName || doc?.ownerName || me?.displayName || 'System Administrator'}
                />
              </Field>
              <Field label="Checked By">
                <Input
                  disabled={readOnly}
                  value={form.checkedByName}
                  onChange={(e) => setForm({ ...form, checkedByName: e.target.value })}
                />
              </Field>
              <Field label="Acknowledged By">
                <Input
                  disabled={readOnly}
                  value={form.acknowledgedByName}
                  onChange={(e) => setForm({ ...form, acknowledgedByName: e.target.value })}
                />
              </Field>
              <Field label="Approved By">
                <Input
                  disabled={readOnly}
                  value={form.approvedByName}
                  onChange={(e) => setForm({ ...form, approvedByName: e.target.value })}
                />
              </Field>
              <Field label="Received By (Finance / Warehouse)">
                <Input
                  disabled={readOnly}
                  value={form.receivedByName}
                  onChange={(e) => setForm({ ...form, receivedByName: e.target.value })}
                />
              </Field>
              <Field label="Closed By">
                <Input
                  disabled={readOnly}
                  value={form.closedByName}
                  onChange={(e) => setForm({ ...form, closedByName: e.target.value })}
                />
              </Field>
            </div>

            {/* Bottom Form Save & Submit Buttons (matching Expressiv bottom action bar) */}
            {editMode && isEditableStatus && (
              <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <Button variant="secondary" onClick={() => handleSave(false)} disabled={busy}>
                  <Save className="h-4 w-4" />
                  <span>{busy ? 'Saving…' : 'Save Draft'}</span>
                </Button>
                <Button onClick={() => handleSave(true)} disabled={busy}>
                  <Send className="h-4 w-4" />
                  <span>{busy ? 'Submitting…' : 'Submit Document'}</span>
                </Button>
              </div>
            )}
          </Card>

          {!isNew && doc && <CommentPanel publicId={doc.id} />}
        </div>
      </div>

      {/* SECTION 4: Live Approval Decision Engine & Status Audit History */}
      {!isNew && doc && (
        <div className="space-y-6">
          <ApprovalPanel doc={doc} onDone={reload} />
          <StatusTimeline doc={doc} />
        </div>
      )}
    </div>
  )
}
