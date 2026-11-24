'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CreditCard,
  Edit3,
  Eye,
  FileText,
  Info,
  Paperclip,
  Printer,
  Receipt,
  Save,
  Send,
  Trash2,
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
  Modal,
  PageHeader,
  Select,
  Textarea,
  fmtDate,
  fmtMoney,
} from '@/components/ui'
import { api, patch, post } from '@/lib/api'
import { useAreaHref } from '@/lib/area-href'
import { useMe } from '@/lib/me'
import { DocumentPrintView } from './document-print'

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
    subtitle:
      'Form permintaan pembelian lengkap dengan Requester Card (NIK & Department), Classification, 9-kolom Item Detail/Purpose, Lampiran PDF, dan 6-Level Approval.',
  },
  PR_RAW: {
    docType: 'PR',
    apiPath: '/pr',
    listHref: '/purchasing/pr-raw-material',
    titleNew: 'Add Purchase Request — Raw Material',
    titleDetail: 'Detail & Edit PR Raw Material',
    subtitle:
      'Form pengadaan bahan baku produksi (SAP / Inventory) dengan 10 kolom: Item No., Description, ETA Plant, ETA Jakarta, Purchase Qty & UoM, Inventory Qty & UoM, dan Division.',
  },
  RFQ: {
    docType: 'RFQ',
    apiPath: '/rfq',
    listHref: '/purchasing/rfq',
    titleNew: 'Add Request for Quotation (RFQ)',
    titleDetail: 'Detail & Edit Request for Quotation (RFQ)',
    subtitle:
      'Dokumen undangan penawaran harga ke rekanan dengan spesifikasi teknis, batas waktu penawaran (Submission Deadline), metode evaluasi, dan daftar vendor.',
  },
  QUO: {
    docType: 'QUO',
    apiPath: '/quotations',
    listHref: '/purchasing/quotations',
    titleNew: 'Add Vendor Quotation (QUO)',
    titleDetail: 'Detail & Edit Vendor Quotation (QUO)',
    subtitle:
      'Pencatatan penawaran harga dari vendor berdasarkan RFQ, masa berlaku harga (Validity), termin pembayaran & pengiriman, lead time, serta diskon per baris.',
  },
  CTR: {
    docType: 'CTR',
    apiPath: '/contracts',
    listHref: '/purchasing/contracts',
    titleNew: 'Add Purchase Contract (CTR)',
    titleDetail: 'Detail & Edit Purchase Contract (CTR)',
    subtitle:
      'Kontrak payung pengadaan (Blanket Quantity / Value Agreement) dengan periode berlaku, nilai komitmen target, termin komersial, dan harga satuan terkontrak.',
  },
  PO: {
    docType: 'PO',
    apiPath: '/po',
    listHref: '/purchasing/po',
    titleNew: 'Add Purchase Order (PO)',
    titleDetail: 'Detail & Edit Purchase Order (PO)',
    subtitle:
      'Surat Pesanan Pembelian resmi ke vendor dengan rincian pengiriman, gudang tujuan, diskon item, ongkos kirim (Freight), PPN, Terbilang, dan matriks persetujuan.',
  },
  GR: {
    docType: 'GR',
    apiPath: '/gr',
    listHref: '/purchasing/gr',
    titleNew: 'Add Goods Receipt / BAST (GR)',
    titleDetail: 'Detail & Edit Goods Receipt (GR)',
    subtitle:
      'Penerimaan barang gudang & pemeriksaan QC atas Purchase Order lengkap dengan Nomor Surat Jalan, Pelat Kendaraan, Nama Supir, Qty Diterima, Qty Lolos QC, dan Qty Reject.',
  },
  CA: {
    docType: 'CA',
    apiPath: '/cash-advances',
    listHref: '/finance/cash-advances',
    titleNew: 'Add Cash Advance Request (CA)',
    titleDetail: 'Detail & Edit Cash Advance (CA)',
    subtitle:
      'Permohonan uang muka operasional karyawan lengkap dengan NIK, Type of Transaction, Paid To, 6 kolom rincian biaya (Category, Account Name, G/L Account Code, Description, Date, Amount), Terbilang, dan 6-Role Approval.',
  },
  STL: {
    docType: 'STL',
    apiPath: '/settlements',
    listHref: '/finance/settlements',
    titleNew: 'Add Cash Advance Settlement (STL)',
    titleDetail: 'Detail & Edit Settlement (STL)',
    subtitle:
      'Pertanggungjawaban realisasi Cash Advance dengan Kartu Info CA Interaktif, Control Account, Account Bank Transfer, rincian pengeluaran aktual, serta kalkulasi Selisih (Refund / Top-up).',
  },
  RMB: {
    docType: 'RMB',
    apiPath: '/reimbursements',
    listHref: '/finance/reimbursements',
    titleNew: 'Add Reimbursement Claim (RMB)',
    titleDetail: 'Detail & Edit Reimbursement (RMB)',
    subtitle:
      'Klaim penggantian biaya operasional (Voucher Reimbursement) dengan Pay To, Reference Doc (No. Invoice/Kwitansi), Type of Transaction, tabel biaya G/L Account (COA), dan 6-Role Approval.',
  },
  INV: {
    docType: 'INV',
    apiPath: '/ap-invoices',
    listHref: '/finance/ap-invoices',
    titleNew: 'Create AP Invoice (INV)',
    titleDetail: 'Detail & Edit AP Invoice (INV)',
    subtitle:
      'Tagihan vendor (AP Invoice) 2-kolom dengan No. Invoice Vendor, Nomor Faktur Pajak, Referensi PO, kalkulasi DPP PPN, Tarif PPN, DPP PPh, Tarif PPh (Withholding Tax), Kurs Pajak KMK, dan Preview Lampiran PDF.',
  },
  OPAP: {
    docType: 'PAY',
    apiPath: '/payments',
    listHref: '/finance/outgoing-ap',
    titleNew: 'Add Outgoing Payment — AP Invoice (OPAP)',
    titleDetail: 'Detail & Edit Outgoing Payment AP Invoice (OPAP)',
    subtitle:
      'Voucher pembayaran tagihan vendor (OVPM) lengkap dengan Beneficiary Bank / Swift / IBAN / NPWP, G/L Bank Account (MUFG / BCA), Tabel Alokasi Faktur, Preview Jurnal Debit/Kredit, dan 6-Role Sign-off.',
  },
  OPCA: {
    docType: 'PAY',
    apiPath: '/payments',
    listHref: '/finance/outgoing-ca',
    titleNew: 'Add Outgoing Payment — Cash Advance (OPCA)',
    titleDetail: 'Detail & Edit Outgoing Cash Advance (OPCA)',
    subtitle:
      'Voucher pencairan uang muka (OVPM Cash Advance) dengan pemilihan dokumen CA, Requester, Pay To, Remittance Request Amount, Account Bank Transfer, Control Account, dan Tabel Rincian G/L Biaya CA.',
  },
  OPRMB: {
    docType: 'PAY',
    apiPath: '/payments',
    listHref: '/finance/outgoing-reimbursement',
    titleNew: 'Add Outgoing Payment — Reimbursement',
    titleDetail: 'Detail & Edit Outgoing Reimbursement',
    subtitle:
      'Voucher pembayaran klaim reimbursement (OVPM Reimbursement) dengan pemilihan dokumen RMB, Pay To, Transfer Date, Account Bank Transfer, Control Account, dan Tabel Rincian G/L Biaya Reimbursement.',
  },
  ARI: {
    docType: 'ARI',
    apiPath: '/ar-invoices',
    listHref: '/finance/ar-invoices',
    titleNew: 'Create AR Invoice (ARI)',
    titleDetail: 'Detail & Edit AR Invoice (ARI)',
    subtitle:
      'Faktur penjualan pelanggan (AR Invoice — Item / Service Mode) dengan 22 atribut header (Card Code/Name, Customer PO, Commercial & Tax Invoice, Transport/Shipping/Track, UDF1/UDF2) dan 12 kolom baris.',
  },
  SVR: {
    docType: 'SVR',
    apiPath: '/verifications',
    listHref: '/vendors/verifications',
    titleNew: 'Add Supplier Verification (SVR)',
    titleDetail: 'Detail & Edit Supplier Verification (SVR)',
    subtitle:
      'Dokumen verifikasi kelayakan legalitas, pajak (NPWP/PKP/NIB), rekening bank (MUFG Remittance), dan kepatuhan rekanan.',
  },
}

/** Generator Terbilang Bahasa Indonesia untuk seluruh form keuangan & pengadaan */
function terbilangID(nilai: number): string {
  const satuan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ]
  const n = Math.floor(Math.abs(nilai))
  if (n === 0) return ''
  if (n < 12) return satuan[n]!
  if (n < 20) return `${terbilangID(n - 10)} Belas`
  if (n < 100) return `${terbilangID(Math.floor(n / 10))} Puluh ${terbilangID(n % 10)}`.trim()
  if (n < 200) return `Seratus ${terbilangID(n - 100)}`.trim()
  if (n < 1000) return `${terbilangID(Math.floor(n / 100))} Ratus ${terbilangID(n % 100)}`.trim()
  if (n < 2000) return `Seribu ${terbilangID(n - 1000)}`.trim()
  if (n < 1_000_000) return `${terbilangID(Math.floor(n / 1000))} Ribu ${terbilangID(n % 1000)}`.trim()
  if (n < 1_000_000_000)
    return `${terbilangID(Math.floor(n / 1_000_000))} Juta ${terbilangID(n % 1_000_000)}`.trim()
  if (n < 1_000_000_000_000)
    return `${terbilangID(Math.floor(n / 1_000_000_000))} Miliar ${terbilangID(n % 1_000_000_000)}`.trim()
  return `${terbilangID(Math.floor(n / 1_000_000_000_000))} Triliun ${terbilangID(n % 1_000_000_000_000)}`.trim()
}

export function formatAmountInWords(amount: number, currencyCode = 'IDR'): string {
  const clean = Math.round(Math.abs(amount || 0))
  const ccyName: Record<string, string> = {
    IDR: 'Rupiah',
    USD: 'Dolar Amerika Serikat',
    JPY: 'Yen Jepang',
    EUR: 'Euro',
    SGD: 'Dolar Singapura',
  }
  if (clean === 0) return `Nol ${ccyName[currencyCode] ?? currencyCode}`
  return `${terbilangID(clean)} ${ccyName[currencyCode] ?? currencyCode}`
}

type PendingUpload = {
  file: File
  category: string
  description: string
  visibility: string
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
  const areaHref = useAreaHref()
  const me = useMe()
  const isNew = !documentId
  const { doc, error: loadErr, reload } = useDocument(documentId ?? null)

  const [editMode, setEditMode] = useState(isNew)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([])
  const [previewPending, setPreviewPending] = useState<{ name: string; url: string; category: string } | null>(null)
  const [rawMatClassId, setRawMatClassId] = useState<number>(1)

  // Master data caches for rich dropdowns (Tax Codes, Expense Categories, Selected Vendor Details, Source Doc Detail)
  const [taxCodes, setTaxCodes] = useState<
    { id: number; code: string; name: string; taxType: string; ratePercent: string }[]
  >([])
  const [expenseCategories, setExpenseCategories] = useState<{ id: number; code: string; name: string }[]>([])
  const [selectedVendorDetail, setSelectedVendorDetail] = useState<any | null>(null)
  const [linkedCaDetail, setLinkedCaDetail] = useState<any | null>(null)
  const [linkedPayTargetDoc, setLinkedPayTargetDoc] = useState<any | null>(null)

  // Unified rich form state covering all fields from OLD/00. EXP_V1 & Supplier Portal
  const [form, setForm] = useState({
    title: '',
    docDate: new Date().toISOString().slice(0, 10),
    requiredDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    requesterUserId: null as number | null,
    requesterName: '',
    requesterNik: 'EMP-0001',
    requesterEmail: '',
    requesterJobTitle: 'Staff / Officer',
    departmentId: null as number | null,
    departmentLabel: '',
    purchaseClassId: null as number | null,
    purchaseClassLabel: '',
    costCenterId: null as number | null,
    costCenterLabel: '',
    currencyCode: 'IDR',
    exchangeRate: '1',
    taxExchangeRate: '1',
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
    bpCode: '',
    bpLabel: '',
    bpTaxId: '',
    vendors: [] as { id: string; label: string }[], // RFQ: invited vendors
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
    // INV (Supplier Portal 2-column InvoiceCreate.tsx fields)
    invoiceKind: 'INVOICE',
    bpInvoiceNo: '',
    taxInvoiceNo: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    downPaymentAmount: '0',
    vatTaxCodeId: 1,
    vatRatePercent: '11',
    taxBaseVat: '',
    whtTaxCodeId: 3,
    whtRatePercent: '0',
    taxBaseWht: '',
    whtAmount: '0',
    internalPicName: 'Andi Pratama (AP Finance Receiver)',
    // ARI (Expressiv add_ARInvoiceNew.html 25+ fields)
    ariDocMode: 'ITEM' as 'ITEM' | 'SERVICE',
    customerPoNo: '',
    commercialInvoiceNo: '',
    billToAddress: 'Kawasan Industri Jababeka Tahap II, Cikarang, Bekasi',
    receivingBankAccount: 'MUFG Bank Operational IDR (710-0012345-88)',
    transportCode: 'TRK-01 (Land Trucking)',
    shippingType: 'Franco Customer Warehouse',
    trackNo: '',
    groupNumber: 'GRP-AR-2026',
    udf1: '',
    udf2: '',
    isTransferred: 'No',
    // PAY (OPAP / OPCA / OPRMB — preparedOPAPInvoice.html, addOPCA.html, addOPReim.html)
    targetDocId: '',
    targetDocLabel: '',
    companyBankAccountId: null as number | null,
    companyBankCode: 'MUFG-IDR',
    companyBankLabel: '',
    companyBankGlCode: '110102',
    paymentMethod: 'TRANSFER',
    plannedDate: new Date().toISOString().slice(0, 10),
    amountApplied: '0',
    cashDiscountPercent: '0',
    bankReference: '',
    beneficiaryName: '',
    beneficiaryAccountNo: '',
    beneficiaryBankName: '',
    beneficiaryBranch: '',
    beneficiarySwift: '',
    beneficiaryIban: '',
    beneficiaryCountry: 'ID',
    beneficiaryCity: 'Bekasi',
    beneficiaryAddress: '',
    beneficiaryBankAddress: '',
    beneficiaryCitizenship: 'RESIDENT',
    virtualAccountNo: '',
    // SVR
    requestType: 'ONBOARDING',
    // Multi-level Approval Sign-off Matrix (Expressiv 6-Role Searchable User Pickers)
    preparedByUserId: null as number | null,
    preparedByName: '',
    checkedByUserId: null as number | null,
    checkedByName: 'Budi Santoso (Section Head)',
    acknowledgedByUserId: null as number | null,
    acknowledgedByName: 'Siti Rahma (Department Manager)',
    approvedByUserId: null as number | null,
    approvedByName: 'Hiroshi Tanaka (Division Director)',
    receivedByUserId: null as number | null,
    receivedByName: 'Andi Pratama (Finance & Accounting Verification)',
    closedByUserId: null as number | null,
    closedByName: 'Rina Kusuma (Treasury & Settlement Control)',
  })

  type LineItem = {
    itemId: number | null
    itemCode?: string
    itemLabel?: string
    bpCatalogNo: string
    packingSize: string
    description: string
    detailSpec: string
    purpose: string
    categoryId: number | null
    categoryLabel?: string
    expenseCategoryCode: string
    uomId: number | null
    uomLabel?: string
    quantity: string
    unitPrice: string
    discountPercent: string
    leadTimeDays: string
    // PR Raw Material SAP / Inventory 10-column fields
    invQuantity: string
    invUom: string
    etaPlant: string
    etaJakarta: string
    division: string
    // GR fields
    receivedQty: string
    acceptedQty: string
    rejectedQty: string
    rejectReason: string
    // Finance / Expense / Invoice fields
    coaId: number | null
    coaCode: string
    coaName: string
    coaLabel?: string
    costCenterId: number | null
    costCenterLabel?: string
    expenseDate: string
    vatCode: string
    whtLiable: 'Yes' | 'No'
  }

  const emptyLine = (): LineItem => ({
    itemId: null,
    itemCode: '',
    bpCatalogNo: '',
    packingSize: '20 KG / Pail',
    description: '',
    detailSpec: '',
    purpose: '',
    categoryId: 1,
    expenseCategoryCode: 'OPER',
    uomId: 1,
    uomLabel: 'EA',
    quantity: '1',
    unitPrice: '0',
    discountPercent: '0',
    leadTimeDays: '7',
    invQuantity: '1',
    invUom: 'KG',
    etaPlant: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    etaJakarta: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
    division: 'PROD-01',
    receivedQty: '1',
    acceptedQty: '1',
    rejectedQty: '0',
    rejectReason: '',
    coaId: null,
    coaCode: '610200',
    coaName: 'Beban Operasional & Perjalanan Dinas',
    costCenterId: null,
    expenseDate: new Date().toISOString().slice(0, 10),
    vatCode: 'PPN11',
    whtLiable: 'No',
  })

  const [lines, setLines] = useState<LineItem[]>([emptyLine()])

  // Load Tax Codes, Expense Categories, and Raw Material Purchase Class
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
      .catch(() => { })

    api<{ data: { id: number; code: string; name: string; taxType: string; ratePercent: string }[] }>(
      '/tax-codes?pageSize=50'
    )
      .then((r) => setTaxCodes(r.data ?? []))
      .catch(() => { })

    api<{ data: { id: number; code: string; name: string }[] }>('/expense-categories')
      .then((r) => setExpenseCategories(r.data ?? []))
      .catch(() => { })
  }, [module])

  // Load vendor details (NPWP, address, MUFG bank account, Swift, IBAN) whenever bpId changes
  useEffect(() => {
    if (!form.bpId) {
      setSelectedVendorDetail(null)
      return
    }
    api<{ data: any }>(`/vendors/${form.bpId}`)
      .then((r) => {
        const v = r.data
        setSelectedVendorDetail(v)
        const primaryBank = v.bankAccounts?.[0]
        const primaryAddr = v.addresses?.[0]
        setForm((f) => ({
          ...f,
          bpCode: v.bpCode ?? f.bpCode,
          bpTaxId: v.taxId ?? f.bpTaxId,
          billToAddress: primaryAddr
            ? `${primaryAddr.line1}, ${primaryAddr.city}${primaryAddr.province ? `, ${primaryAddr.province}` : ''}`
            : f.billToAddress,
          beneficiaryName: primaryBank?.accountHolderName ?? v.legalName ?? f.beneficiaryName,
          beneficiaryAccountNo: primaryBank?.accountNo ?? f.beneficiaryAccountNo,
          beneficiaryBankName: primaryBank?.bankName ?? 'MUFG Bank, Ltd.',
          beneficiaryBranch: primaryBank?.branchName ?? 'KCU Jakarta',
          beneficiarySwift: primaryBank?.swiftCode ?? 'BOTKIDJX',
          beneficiaryIban: primaryBank?.iban ?? 'ID01BOTK710008812345',
          beneficiaryCountry: primaryBank?.beneficiaryCountry ?? 'ID',
          beneficiaryCity: primaryBank?.beneficiaryCity ?? 'Bekasi',
          beneficiaryAddress: primaryBank?.beneficiaryAddress ?? primaryAddr?.line1 ?? '',
          beneficiaryBankAddress: primaryBank?.bankAddress ?? 'Jl. Jend. Sudirman, Jakarta',
          beneficiaryCitizenship: primaryBank?.citizenship ?? 'RESIDENT',
        }))
      })
      .catch(() => { })
  }, [form.bpId])

  // Load linked Cash Advance detail for Settlement (STL)
  useEffect(() => {
    if (module !== 'STL' || !form.caId) {
      setLinkedCaDetail(null)
      return
    }
    api<{ data: any }>(`/documents/${form.caId}`)
      .then((r) => {
        setLinkedCaDetail(r.data)
        const amt = Number(r.data?.totalAmount ?? 0)
        if (amt > 0) {
          setForm((f) => ({
            ...f,
            caAmount: amt,
            purpose: f.purpose || r.data?.detail?.Purpose || r.data?.title || '',
          }))
        }
      })
      .catch(() => { })
  }, [module, form.caId])

  // Load linked Target Document (INV / CA / RMB) for Outgoing Payments (OPAP / OPCA / OPRMB)
  useEffect(() => {
    if (!['OPAP', 'OPCA', 'OPRMB'].includes(module) || !form.targetDocId) {
      setLinkedPayTargetDoc(null)
      return
    }
    api<{ data: any }>(`/documents/${form.targetDocId}`)
      .then((r) => {
        const d = r.data
        setLinkedPayTargetDoc(d)
        const det = d?.detail ?? {}
        if (det.BpPublicId && !form.bpId) {
          setForm((f) => ({
            ...f,
            bpId: det.BpPublicId,
            bpCode: det.BpCode ?? '',
            bpLabel: det.BpName ? `${det.BpCode ?? ''} — ${det.BpName}` : f.bpLabel,
          }))
        }
      })
      .catch(() => { })
  }, [module, form.targetDocId])

  // Populate form when viewing/editing an existing document
  useEffect(() => {
    if (!doc) return
    const det = (doc as any).detail ?? {}
    const rawLines: any[] = (doc as any).lines ?? []

    setForm((f) => ({
      ...f,
      title: doc.title ?? '',
      docDate: doc.docDate ? String(doc.docDate).slice(0, 10) : f.docDate,
      requiredDate: det.RequiredDate ? String(det.RequiredDate).slice(0, 10) : f.requiredDate,
      requesterName: doc.ownerName || me?.displayName || 'System Administrator',
      requesterNik: det.EmployeeNo ?? 'EMP-0001',
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
      bpCode: det.BpCode ?? f.bpCode,
      bpLabel: det.BpName ? `${det.BpCode ?? ''} — ${det.BpName}` : f.bpLabel,
      bpReference: det.BpReference ?? f.bpReference,
      vendors: ((doc as any).participants ?? []).map((p: any) => ({ id: p.id, label: `${p.bpCode ?? ''} — ${p.legalName}` })),
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
      paidToText: det.BpName || det.EmployeeName || doc.ownerName || f.paidToText,
      caId: det.CaPublicId ?? f.caId,
      caLabel: det.CaDocNo ? `${det.CaDocNo} — ${det.CaTitle ?? ''}` : f.caLabel,
      caAmount: Number(det.AdvanceAmount ?? 0),
      referenceNo: det.ReferenceNo ?? '',
      payeeType: det.PayeeType ?? f.payeeType,
      invoiceKind: det.InvoiceKind ?? f.invoiceKind,
      bpInvoiceNo: det.BpInvoiceNo ?? '',
      taxInvoiceNo: det.TaxInvoiceNo ?? '',
      invoiceDate: det.InvoiceDate ? String(det.InvoiceDate).slice(0, 10) : String(doc.docDate).slice(0, 10),
      dueDate: det.DueDate ? String(det.DueDate).slice(0, 10) : f.dueDate,
      downPaymentAmount: String(det.DownPaymentAmount ?? '0'),
      whtAmount: String(det.WhtAmount ?? '0'),
      customerPoNo: det.CustomerPoNo ?? '',
      commercialInvoiceNo: det.CommercialInvoiceNo ?? '',
      targetDocId: det.TargetDocPublicId ?? f.targetDocId,
      targetDocLabel: det.TargetDocNo ?? f.targetDocLabel,
      companyBankAccountId: det.CompanyBankAccountId ?? f.companyBankAccountId,
      companyBankCode: det.CompanyBankCode ?? f.companyBankCode,
      companyBankLabel: det.CompanyBankName
        ? `${det.CompanyBankCode ?? ''} — ${det.CompanyBankName} (${det.CompanyBankAccountNo ?? ''})`
        : f.companyBankLabel,
      paymentMethod: det.PaymentMethod ?? f.paymentMethod,
      plannedDate: det.PlannedDate ? String(det.PlannedDate).slice(0, 10) : String(doc.docDate).slice(0, 10),
      amountApplied: String(doc.totalAmount ?? '0'),
      bankReference: det.BankReference ?? '',
      requestType: det.RequestType ?? f.requestType,
      preparedByName: doc.ownerName || me?.displayName || 'System Administrator',
    }))

    if (rawLines.length > 0) {
      setLines(
        rawLines.map((ln) => {
          // Parse encoded spec/purpose/SAP fields from description if stored with " | "
          const parts = String(ln.description ?? '').split(' | ')
          const baseDesc = parts[0] ?? ln.description ?? ''
          let spec = ln.specification ?? ''
          let purp = ln.purpose ?? ''
          let etaP = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
          let etaJ = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10)
          let invQ = String(ln.quantity ?? '1')
          let invU = ln.uomCode ?? 'KG'
          let div = 'PROD-01'
          let expCat = 'OPER'

          for (const p of parts.slice(1)) {
            if (p.startsWith('Spec:')) spec = p.replace('Spec:', '').trim()
            else if (p.startsWith('Purpose:')) purp = p.replace('Purpose:', '').trim()
            else if (p.startsWith('ETA Plant:')) etaP = p.replace('ETA Plant:', '').trim()
            else if (p.startsWith('ETA JKT:')) etaJ = p.replace('ETA JKT:', '').trim()
            else if (p.startsWith('Inv:')) {
              const [qPart, uPart] = p.replace('Inv:', '').trim().split(' ')
              if (qPart) invQ = qPart
              if (uPart) invU = uPart
            } else if (p.startsWith('Div:')) div = p.replace('Div:', '').trim()
            else if (p.startsWith('Cat:')) expCat = p.replace('Cat:', '').trim()
          }

          return {
            ...emptyLine(),
            itemId: ln.itemId ?? null,
            itemCode: ln.itemCode ?? '',
            itemLabel: ln.itemCode ? `${ln.itemCode} — ${ln.itemName ?? baseDesc}` : undefined,
            description: baseDesc,
            detailSpec: spec,
            purpose: purp,
            categoryId: ln.categoryId ?? 1,
            categoryLabel: ln.categoryName ?? undefined,
            expenseCategoryCode: expCat,
            uomId: ln.uomId ?? 1,
            uomLabel: ln.uomCode ?? 'EA',
            quantity: String(ln.quantity ?? ln.targetQty ?? '1'),
            unitPrice: String(ln.unitPrice ?? ln.estimatedUnitPrice ?? ln.amount ?? '0'),
            discountPercent: String(ln.discountPercent ?? '0'),
            leadTimeDays: String(ln.leadTimeDays ?? '7'),
            invQuantity: invQ,
            invUom: invU,
            etaPlant: etaP,
            etaJakarta: etaJ,
            division: div,
            receivedQty: String(ln.receivedQty ?? ln.quantity ?? '1'),
            acceptedQty: String(ln.acceptedQty ?? ln.quantity ?? '1'),
            rejectedQty: String(ln.rejectedQty ?? '0'),
            rejectReason: ln.rejectReason ?? '',
            coaId: ln.coaId ?? ln.revenueCoaId ?? null,
            coaCode: ln.itemCode ?? '610200',
            coaName: ln.itemName ?? 'Expense Account',
            coaLabel: ln.itemCode ? `${ln.itemCode} — ${ln.itemName ?? ''}` : undefined,
            costCenterId: ln.costCenterId ?? null,
            costCenterLabel: ln.costCenterCode ?? undefined,
            expenseDate: ln.expenseDate ? String(ln.expenseDate).slice(0, 10) : String(doc.docDate).slice(0, 10),
          }
        })
      )
    }

    setEditMode(false)
  }, [doc?.id, doc?.version])

  // Vendors (BP) only author quotations; every other document is view-only for them (the API enforces the same).
  const bpViewOnly = me?.userType === 'BP' && module !== 'QUO'
  const isEditableStatus =
    !bpViewOnly && (isNew || (doc && !doc.isDeleted && ['DRAFT', 'RETURNED', 'REVISION_REQUIRED'].includes(doc.status)))
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

  const downPaymentAmt = meta.docType === 'INV' ? Number(form.downPaymentAmount) || 0 : 0
  const vatRate = meta.docType === 'INV' ? Number(form.vatRatePercent ?? 11) : 11
  const dppVat =
    meta.docType === 'INV' && form.taxBaseVat !== ''
      ? Number(form.taxBaseVat) || 0
      : Math.max(0, subtotal - downPaymentAmt)
  const vatAmount = isVatDoc ? dppVat * (vatRate / 100) : 0

  const whtRate = Number(form.whtRatePercent || 0)
  const dppWht =
    meta.docType === 'INV' && form.taxBaseWht !== '' ? Number(form.taxBaseWht) || 0 : subtotal
  const whtAmount =
    meta.docType === 'INV'
      ? whtRate > 0
        ? dppWht * (whtRate / 100)
        : Number(form.whtAmount) || 0
      : 0

  const freightAmount = meta.docType === 'PO' ? Number(form.freightAmount) || 0 : 0
  const grandTotal =
    meta.docType === 'PAY'
      ? Number(form.amountApplied) || 0
      : subtotal - downPaymentAmt + vatAmount + freightAmount - whtAmount
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
            description:
              module === 'PR_RAW'
                ? [
                  l.description,
                  `ETA Plant: ${l.etaPlant}`,
                  `ETA JKT: ${l.etaJakarta}`,
                  `Inv: ${l.invQuantity} ${l.invUom}`,
                  `Div: ${l.division}`,
                ]
                  .filter(Boolean)
                  .join(' | ')
                : [
                  l.description,
                  l.detailSpec ? `Spec: ${l.detailSpec}` : '',
                  l.purpose ? `Purpose: ${l.purpose}` : '',
                ]
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
          vendorIds: form.vendors.map((v) => v.id),
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
          bpId: form.bpId || undefined, // BP users: API uses their own company
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
            description: [l.description, l.expenseCategoryCode ? `Cat: ${l.expenseCategoryCode}` : '']
              .filter(Boolean)
              .join(' | '),
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
            description: [l.description, l.expenseCategoryCode ? `Cat: ${l.expenseCategoryCode}` : '']
              .filter(Boolean)
              .join(' | '),
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
            description: [l.description, l.expenseCategoryCode ? `Cat: ${l.expenseCategoryCode}` : '']
              .filter(Boolean)
              .join(' | '),
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
          whtAmount: Number(whtAmount.toFixed(2)),
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
      setError('Document Title / Subject wajib diisi.')
      return
    }
    setBusy(true)
    try {
      const payload = buildPayload()
      let targetId = documentId

      if (isNew) {
        const res = await post<{ data: { id: string; docNo?: string } }>(meta.apiPath, payload)
        targetId = res.data.id
        for (const u of pendingUploads) {
          const fd = new FormData()
          fd.append('file', u.file)
          fd.append('category', u.category)
          fd.append('visibility', u.visibility)
          if (u.description) fd.append('description', u.description)
          await post(`/documents/${targetId}/attachments`, fd).catch(() => { })
        }
      } else if (targetId) {
        await patch(`${meta.apiPath}/${targetId}`, payload)
      }

      if (andSubmit && targetId) {
        await post(`${meta.apiPath}/${targetId}/submit`, {})
      }

      if (isNew && targetId) {
        router.push(areaHref(`${meta.listHref}/${targetId}`))
      } else {
        setSuccessMsg(
          andSubmit
            ? 'Dokumen berhasil disimpan dan diajukan ke alur persetujuan (Approval Workflow).'
            : 'Perubahan dokumen berhasil disimpan.'
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
        <Link href={backHref ?? areaHref(meta.listHref)}>
          <Button variant="secondary">← Kembali ke Daftar</Button>
        </Link>
      </div>
    )
  }

  if (!isNew && !doc) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500 shadow-theme-xs">
        Memuat formulir dokumen lengkap…
      </div>
    )
  }

  const targetDocDetail = linkedPayTargetDoc?.detail ?? {}
  const targetDocLines: any[] = linkedPayTargetDoc?.lines ?? []

  return (
    <>
      <DocumentPrintView
        module={module}
        doc={doc}
        form={form}
        lines={lines}
        targetDocLines={targetDocLines}
        subtotal={subtotal}
        vatAmount={vatAmount}
        whtAmount={whtAmount}
        freightAmount={freightAmount}
        grandTotal={grandTotal}
        terbilang={formatAmountInWords(grandTotal, form.currencyCode)}
      />
      <div className="space-y-6 pb-12 print:hidden">
        {/* Top Action Bar & Breadcrumb */}
        <PageHeader
          title={isNew ? meta.titleNew : `${meta.titleDetail} — ${doc?.docNo ?? '(Draft)'}`}
          subtitle={isNew ? meta.subtitle : undefined}
          actions={
            <div className="flex flex-wrap items-center gap-1.5">
              <Link href={backHref ?? areaHref(meta.listHref)}>
                <Button variant="secondary" size="sm">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </Button>
              </Link>

              {!isNew && doc && (
                <Button variant="secondary" size="sm" onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print</span>
                </Button>
              )}

              {!isNew && isEditableStatus && !editMode && (
                <Button variant="secondary" size="sm" onClick={() => setEditMode(true)}>
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </Button>
              )}

              {!isNew && isEditableStatus && !editMode && (
                <Button size="sm" onClick={() => handleSave(true)} disabled={busy}>
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit</span>
                </Button>
              )}

              {editMode && isEditableStatus && (
                <>
                  {!isNew && (
                    <Button variant="secondary" size="sm" onClick={() => setEditMode(false)}>
                      Cancel
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => handleSave(false)} disabled={busy}>
                    <Save className="h-3.5 w-3.5" />
                    <span>{busy ? 'Saving…' : 'Save Draft'}</span>
                  </Button>
                  <Button size="sm" onClick={() => handleSave(true)} disabled={busy}>
                    <Send className="h-3.5 w-3.5" />
                    <span>{busy ? 'Submitting…' : 'Save & Submit'}</span>
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

      {/* Mock MUFG Corporate Banking Gateway Panel (Outgoing Payments) */}
      {(module === 'OPAP' || module === 'OPCA' || module === 'OPRMB') && !isNew && doc && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-900">
                MUFG Corporate Banking Gateway (Mock)
              </span>
              <Badge value={doc.status} />
            </div>
            <p className="mt-0.5 text-xs text-gray-600">
              {(doc as any).detail?.BankReference
                ? `Bank Ref: ${(doc as any).detail.BankReference} · Batch: ${(doc as any).detail.BankBatchNo ?? '—'}`
                : (doc as any).detail?.FailureReason
                  ? `Bank Error: ${(doc as any).detail.FailureReason}`
                  : 'Simulasi transfer otomatis MUFG atau proses kliring bank bertahap.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {['APPROVED', 'FAILED'].includes(doc.status) && (
              <>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true)
                    setError(null)
                    try {
                      await post(`/payments/${doc.id}/mufg`, { mode: 'AUTO' })
                      setSuccessMsg('Mock MUFG Auto-Pay berhasil! Dana ditransfer & status tagihan diperbarui.')
                      reload()
                    } catch (e) {
                      setError((e as Error).message)
                    } finally {
                      setBusy(false)
                    }
                  }}
                >
                  <span>Auto-Pay MUFG (Instant)</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true)
                    setError(null)
                    try {
                      await post(`/payments/${doc.id}/mufg`, { mode: 'SEND' })
                      setSuccessMsg('Instruksi transfer dikirim ke gateway MUFG (SENT TO BANK).')
                      reload()
                    } catch (e) {
                      setError((e as Error).message)
                    } finally {
                      setBusy(false)
                    }
                  }}
                >
                  <span>Kirim ke Bank (Step)</span>
                </Button>
              </>
            )}
            {doc.status === 'SENT_TO_BANK' && (
              <>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true)
                    setError(null)
                    try {
                      await post(`/payments/${doc.id}/mufg`, { mode: 'COMPLETE' })
                      setSuccessMsg('Simulasi MUFG Sukses: Pembayaran COMPLETED.')
                      reload()
                    } catch (e) {
                      setError((e as Error).message)
                    } finally {
                      setBusy(false)
                    }
                  }}
                >
                  <span>Simulasi Bank Sukses</span>
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true)
                    setError(null)
                    try {
                      await post(`/payments/${doc.id}/mufg`, { mode: 'FAIL' })
                      setSuccessMsg('Simulasi MUFG Gagal: Status menjadi FAILED (bisa di-retry).')
                      reload()
                    } catch (e) {
                      setError((e as Error).message)
                    } finally {
                      setBusy(false)
                    }
                  }}
                >
                  <span>Simulasi Bank Gagal</span>
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* PR_RAW Blue Notes Alert Box (1:1 from addPRRawMaterial.html) */}
      {module === 'PR_RAW' && (
        <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50/70 px-4 py-3.5 text-xs text-brand-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <div>
            <span className="font-bold">Notes — Purchase Request Raw Material (SAP / Inventory Integration):</span>
            <p className="mt-0.5 text-brand-800">
              Pastikan kolom <strong>Required Date ETA Plant</strong>, <strong>Required Date ETA Jakarta</strong>,{' '}
              <strong>Purchase Qty &amp; UOM</strong>, <strong>Inventory Qty &amp; Inventory UOM</strong>, serta{' '}
              <strong>Division</strong> diisi lengkap sesuai kebutuhan jadwal produksi pabrik.
            </p>
          </div>
        </div>
      )}

      {/* Selected Requester Info Card & Total Value / Terbilang Banner (1:1 from addPR.html / addCash.html) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-brand-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Selected Requester Info &amp; Document Identity
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge value={meta.docType} />
              <Badge value={doc?.status ?? 'DRAFT'} />
              {doc?.version && <span className="font-mono text-xs text-gray-400">Rev #{doc.version}</span>}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
            <div>
              <span className="block text-gray-500">Document No.</span>
              <span className="mt-0.5 block font-mono font-bold text-gray-900">
                {doc?.docNo ?? 'AUTO-NUMBER'}
              </span>
            </div>
            <div>
              <span className="block text-gray-500">Requester Name</span>
              <span className="mt-0.5 block font-semibold text-gray-900">
                {form.requesterName || doc?.ownerName || me?.displayName || 'System Administrator'}
              </span>
            </div>
            <div>
              <span className="block text-gray-500">Employee NIK</span>
              <span className="mt-0.5 block font-mono font-semibold text-brand-700">{form.requesterNik}</span>
            </div>
            <div>
              <span className="block text-gray-500">Department</span>
              <span className="mt-0.5 block font-semibold text-gray-900">
                {form.departmentLabel || 'Operations & General'}
              </span>
            </div>
            <div>
              <span className="block text-gray-500">Submission Date</span>
              <span className="mt-0.5 block font-semibold text-gray-900">{fmtDate(form.docDate)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-brand-200 bg-brand-50/50 p-4 shadow-theme-xs lg:col-span-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
              Total Document Value ({form.currencyCode})
            </span>
            <span className="rounded bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-gray-600 border border-brand-100">
              Rate: {form.exchangeRate}
            </span>
          </div>
          <div className="my-1 text-2xl font-bold text-gray-900">
            {fmtMoney(grandTotal, form.currencyCode)}
          </div>
          <div className="rounded-lg border border-brand-100 bg-white/80 px-2.5 py-1.5 text-[11px] italic text-gray-700">
            <span className="font-semibold not-italic text-gray-500">Terbilang: </span>
            {formatAmountInWords(grandTotal, form.currencyCode)}
          </div>
        </div>
      </div>

      {/* SECTION 1: Document Header & Module-Specific Structured Layout */}
      <Card
        title="1. Document Header & Transaction Attributes"
        desc="Lengkapi seluruh atribut header sesuai dokumen asli. Kolom dengan tanda (*) wajib diisi."
      >
        {/* AR INVOICE: Item vs Service Mode Toggle (from add_ARInvoiceNew.html / detailINVItem.html / detailINVService.html) */}
        {module === 'ARI' && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                AR Invoice Document Mode (Item / Service)
              </span>
              <p className="text-xs text-gray-500">
                Pilih mode faktur penjualan: <strong>Item Invoice</strong> (Penjualan Barang/Produk) atau{' '}
                <strong>Service Invoice</strong> (Penjualan Jasa/Kontrak).
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
              <button
                type="button"
                disabled={readOnly}
                onClick={() => setForm({ ...form, ariDocMode: 'ITEM' })}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${form.ariDocMode === 'ITEM'
                  ? 'bg-brand-600 text-white shadow-theme-xs'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Item Invoice (Barang)
              </button>
              <button
                type="button"
                disabled={readOnly}
                onClick={() => setForm({ ...form, ariDocMode: 'SERVICE' })}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${form.ariDocMode === 'SERVICE'
                  ? 'bg-brand-600 text-white shadow-theme-xs'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Service Invoice (Jasa)
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* LEFT COLUMN */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label={
                  module === 'CA'
                    ? 'Cash Advance No.'
                    : module === 'STL'
                      ? 'Settlement No.'
                      : module === 'RMB'
                        ? 'Voucher No.'
                        : ['OPAP', 'OPCA', 'OPRMB'].includes(module)
                          ? 'Payment Voucher No. (DocNum)'
                          : 'Document Number'
                }
              >
                <Input disabled value={doc?.docNo ?? 'AUTO-GENERATED'} />
              </Field>

              <Field label="Employee NIK">
                <Input
                  disabled={readOnly}
                  value={form.requesterNik}
                  onChange={(e) => setForm({ ...form, requesterNik: e.target.value })}
                />
              </Field>
            </div>

            {/* Searchable Requester Picker (from addPR.html / addCash.html / addReim.html) */}
            {['PR', 'PR_RAW', 'CA', 'STL', 'RMB'].includes(module) && (
              <Field label="Requester Name (Searchable Employee)" required>
                {readOnly ? (
                  <Input
                    disabled
                    value={form.requesterName || doc?.ownerName || me?.displayName || 'System Administrator'}
                  />
                ) : (
                  <LookupSelect
                    path="/users/lookup"
                    value={form.requesterUserId}
                    initialLabel={form.requesterName || doc?.ownerName || me?.displayName || 'System Administrator'}
                    label={(r) => `${r.displayName} (${r.email})`}
                    onChange={(v, r) =>
                      setForm({
                        ...form,
                        requesterUserId: v,
                        requesterName: r?.displayName ?? '',
                        requesterEmail: r?.email ?? '',
                        requesterNik: v ? `EMP-${String(v).padStart(4, '0')}` : form.requesterNik,
                      })
                    }
                  />
                )}
              </Field>
            )}

            <Field label="Document Title / Transaction Subject" required>
              <Input
                disabled={readOnly}
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={`Masukkan judul ${meta.docType} atau ringkasan keperluan...`}
              />
            </Field>

            {['PR', 'PR_RAW', 'RFQ', 'CA', 'STL', 'RMB'].includes(module) && (
              <Field label="Department" required={['PR', 'PR_RAW', 'CA', 'RMB'].includes(module)}>
                {readOnly ? (
                  <Input disabled value={form.departmentLabel || 'Operations Department'} />
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
              <Field label="Classification (Purchase Class)" required>
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
              <Field label="Classification (Purchase Class)">
                <Input disabled value="RAW_MAT — Raw Materials & Chemical Resin (SAP Inventory)" />
              </Field>
            )}

            {['PR', 'PR_RAW'].includes(module) && (
              <Field label="Cost Center / Budget Allocation">
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

            {module === 'RFQ' && (
              <Field label={`Invited Vendors (${form.vendors.length})`}>
                <div className="space-y-2">
                  {!readOnly && (
                    <LookupSelect
                      key={form.vendors.length} // remount = clear the search box after each add
                      path="/vendors"
                      value={null}
                      label={(r) => `${r.bpCode ?? ''} — ${r.legalName}`}
                      onChange={(v, r) => {
                        if (!v || form.vendors.some((x) => x.id === v)) return
                        setForm({ ...form, vendors: [...form.vendors, { id: v, label: `${r?.bpCode ?? ''} — ${r?.legalName ?? ''}` }] })
                      }}
                    />
                  )}
                  {form.vendors.length ? (
                    <div className="flex flex-wrap gap-2">
                      {form.vendors.map((v) => (
                        <span key={v.id} className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                          {v.label}
                          {!readOnly && (
                            <button
                              type="button"
                              aria-label={`Remove ${v.label}`}
                              className="text-brand-500 hover:text-error-600"
                              onClick={() => setForm({ ...form, vendors: form.vendors.filter((x) => x.id !== v.id) })}
                            >
                              ✕
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Belum ada vendor diundang. Pilih vendor di atas; bisa lebih dari satu.</p>
                  )}
                </div>
              </Field>
            )}

            {['QUO', 'CTR', 'PO', 'INV', 'ARI', 'SVR'].includes(module) && (
              <>
                <Field
                  label={
                    module === 'ARI'
                      ? 'Customer / Business Partner (Card Code & Card Name)'
                      : 'Vendor / Business Partner (BP Code & Legal Name)'
                  }
                  required={module !== 'RFQ'}
                >
                  {readOnly ? (
                    <Input disabled value={form.bpLabel || '—'} />
                  ) : me?.userType === 'BP' ? (
                    // vendors can't browse /vendors; the API quotes as the user's own company
                    <Input disabled value={form.bpLabel || me.displayName} />
                  ) : (
                    <LookupSelect
                      path="/vendors"
                      value={form.bpId}
                      initialLabel={form.bpLabel}
                      label={(r) => `${r.bpCode ?? ''} — ${r.legalName}`}
                      onChange={(v, r) =>
                        setForm({
                          ...form,
                          bpId: v ?? '',
                          bpCode: r?.bpCode ?? '',
                          bpTaxId: r?.taxId ?? '',
                          bpLabel: r ? `${r.bpCode ?? ''} — ${r.legalName}` : '',
                        })
                      }
                    />
                  )}
                </Field>

                {/* Selected Partner Card Code & Tax ID (NPWP) Info Bar */}
                {form.bpId && (
                  <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-3 text-xs">
                    <div>
                      <span className="block text-gray-500">BP / Card Code</span>
                      <span className="font-mono font-bold text-gray-900">
                        {selectedVendorDetail?.bpCode || form.bpCode || 'VND-001'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-gray-500">NPWP (Tax ID)</span>
                      <span className="font-mono font-semibold text-gray-800">
                        {selectedVendorDetail?.taxId || form.bpTaxId || '01.234.567.8-091.000'}
                      </span>
                    </div>
                  </div>
                )}
              </>
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
              <Field label="Document Reference / Purchase Order (PO)" required={module === 'GR'}>
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

            {/* AP Invoice Left Column (1:1 with Supplier Portal InvoiceCreate.tsx) */}
            {module === 'INV' && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Invoice Kind" required>
                    <Select
                      disabled={readOnly}
                      value={form.invoiceKind}
                      onChange={(e) => setForm({ ...form, invoiceKind: e.target.value })}
                    >
                      <option value="INVOICE">INVOICE (Standard AP Invoice)</option>
                      <option value="DOWN_PAYMENT">DOWN_PAYMENT (Tagihan Uang Muka)</option>
                      <option value="CREDIT_MEMO">CREDIT_MEMO (Nota Kredit)</option>
                    </Select>
                  </Field>
                  <Field label="Vendor Invoice Number" required>
                    <Input
                      disabled={readOnly}
                      value={form.bpInvoiceNo}
                      onChange={(e) => setForm({ ...form, bpInvoiceNo: e.target.value })}
                      placeholder="e.g. INV/KIN/2026/0412"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Tax Invoice Number (Nomor Faktur Pajak)" required>
                    <Input
                      disabled={readOnly}
                      value={form.taxInvoiceNo}
                      onChange={(e) => setForm({ ...form, taxInvoiceNo: e.target.value })}
                      placeholder="e.g. 010.004-26.12345678"
                    />
                  </Field>
                  <Field label="Receiver / Internal Finance PIC">
                    <Input
                      disabled={readOnly}
                      value={form.internalPicName}
                      onChange={(e) => setForm({ ...form, internalPicName: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Invoice Date" required>
                    <Input
                      type="date"
                      disabled={readOnly}
                      value={form.invoiceDate}
                      onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
                    />
                  </Field>
                  <Field label="Due Date (Jatuh Tempo)" required>
                    <Input
                      type="date"
                      disabled={readOnly}
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    />
                  </Field>
                </div>
              </>
            )}

            {/* CA & RMB Left Column (1:1 with addCash.html & addReim.html) */}
            {['CA', 'RMB'].includes(module) && (
              <>
                <Field label="Type of Transaction" required>
                  {readOnly ? (
                    <Input disabled value={form.transactionTypeLabel || 'Operational Transaction'} />
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

                {module === 'RMB' && (
                  <Field label="Payee Type (Penerima Reimburse)">
                    <Select
                      disabled={readOnly}
                      value={form.payeeType}
                      onChange={(e) => setForm({ ...form, payeeType: e.target.value })}
                    >
                      <option value="EMPLOYEE">EMPLOYEE (Karyawan Internal)</option>
                      <option value="BP">BP (Business Partner / Vendor)</option>
                    </Select>
                  </Field>
                )}

                <Field label="Paid To / Pay To (Nama Penerima Dana)" required>
                  <Input
                    disabled={readOnly}
                    value={form.paidToText || form.requesterName || doc?.ownerName || me?.displayName || ''}
                    onChange={(e) => setForm({ ...form, paidToText: e.target.value })}
                    placeholder="Masukkan nama karyawan atau rekanan penerima pembayaran..."
                  />
                </Field>

                <Field label="Purpose / Rincian Keperluan" required>
                  <Input
                    disabled={readOnly}
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    placeholder="Tujuan penggunaan dana..."
                  />
                </Field>
              </>
            )}

            {/* Settlement Left Column + Interactive Selected CA Info Card (1:1 with addSettle.html / detailSettle.html) */}
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
                      label={(r) =>
                        `${r.docNo ?? '(Draft)'} — ${r.title} (${fmtMoney(r.totalAmount, r.currencyCode)})`
                      }
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

                {/* Interactive Selected Cash Advance Info Card */}
                {form.caId && (
                  <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-brand-100 pb-2">
                      <span className="font-bold uppercase tracking-wider text-brand-800">
                        Selected Cash Advance Information
                      </span>
                      <Link
                        href={`/finance/cash-advances/${form.caId}`}
                        className="font-semibold text-brand-600 hover:underline"
                      >
                        View Source CA ↗
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500">CA Document No:</span>
                        <span className="ml-1 font-mono font-bold text-gray-900">
                          {linkedCaDetail?.docNo || form.caLabel.split(' — ')[0] || 'CA-DOC'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">CA Status:</span>
                        <span className="ml-1 font-semibold text-emerald-700">
                          {linkedCaDetail?.status ?? 'APPROVED'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Disbursed Amount:</span>
                        <span className="ml-1 font-bold text-gray-900">
                          {fmtMoney(form.caAmount, form.currencyCode)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Requester:</span>
                        <span className="ml-1 font-semibold text-gray-800">
                          {linkedCaDetail?.ownerName ?? form.requesterName}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Settlement Ref. No.">
                    <Input
                      disabled={readOnly}
                      value={form.referenceNo}
                      onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
                      placeholder="e.g. STL-REF-2026-01"
                    />
                  </Field>
                  <Field label="Paid To">
                    <Input
                      disabled={readOnly}
                      value={form.paidToText || form.requesterName || doc?.ownerName || ''}
                      onChange={(e) => setForm({ ...form, paidToText: e.target.value })}
                    />
                  </Field>
                </div>
              </>
            )}

            {/* Outgoing Payments Left Column (OPAP / OPCA / OPRMB) */}
            {['OPAP', 'OPCA', 'OPRMB'].includes(module) && (
              <>
                <Field
                  label={
                    module === 'OPAP'
                      ? 'Target AP Invoice Document (INV)'
                      : module === 'OPCA'
                        ? 'Cash Advance No. (Approved CA)'
                        : 'Reimburse No. (Approved RMB)'
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
                      label={(r) =>
                        `${r.docNo ?? '(Draft)'} — ${r.title} (${fmtMoney(r.totalAmount, r.currencyCode)})`
                      }
                      onChange={(v, r) =>
                        setForm({
                          ...form,
                          targetDocId: v ?? '',
                          targetDocLabel: r?.docNo ?? '',
                          amountApplied: r?.totalAmount ? String(r.totalAmount) : form.amountApplied,
                          currencyCode: r?.currencyCode ?? form.currencyCode,
                          title:
                            form.title ||
                            (r ? `Outgoing Payment (${module}) — ${r.docNo ?? ''} ${r.title}` : ''),
                        })
                      }
                    />
                  )}
                </Field>

                {/* Auto-filled Source Info Card for OPCA / OPRMB / OPAP */}
                {linkedPayTargetDoc && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <span className="font-bold text-gray-800">
                        Source Document: {linkedPayTargetDoc.docNo}
                      </span>
                      <Link
                        href={
                          module === 'OPAP'
                            ? `/finance/ap-invoices/${linkedPayTargetDoc.id}`
                            : module === 'OPCA'
                              ? `/finance/cash-advances/${linkedPayTargetDoc.id}`
                              : `/finance/reimbursements/${linkedPayTargetDoc.id}`
                        }
                        className="font-semibold text-brand-600 hover:underline"
                      >
                        Open Reference Doc ↗
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500">Requester / Owner:</span>
                        <span className="ml-1 font-semibold text-gray-900">{linkedPayTargetDoc.ownerName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Pay To / Vendor:</span>
                        <span className="ml-1 font-semibold text-gray-900">
                          {targetDocDetail.BpName || targetDocDetail.EmployeeName || linkedPayTargetDoc.ownerName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Receive / Doc Date:</span>
                        <span className="ml-1 font-semibold text-gray-900">
                          {fmtDate(linkedPayTargetDoc.docDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Remittance Request Amount:</span>
                        <span className="ml-1 font-bold text-brand-700">
                          {fmtMoney(linkedPayTargetDoc.totalAmount, linkedPayTargetDoc.currencyCode)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {module === 'OPAP' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Beneficiary Name (Nama Rekening Vendor)">
                      <Input
                        disabled={readOnly}
                        value={form.beneficiaryName || targetDocDetail.BpName || ''}
                        onChange={(e) => setForm({ ...form, beneficiaryName: e.target.value })}
                      />
                    </Field>
                    <Field label="Beneficiary Account No.">
                      <Input
                        disabled={readOnly}
                        value={form.beneficiaryAccountNo}
                        onChange={(e) => setForm({ ...form, beneficiaryAccountNo: e.target.value })}
                        placeholder="e.g. 710-0088123-45"
                      />
                    </Field>
                    <Field label="Swift Code">
                      <Input
                        disabled={readOnly}
                        value={form.beneficiarySwift}
                        onChange={(e) => setForm({ ...form, beneficiarySwift: e.target.value })}
                        placeholder="BOTKIDJX"
                      />
                    </Field>
                    <Field label="IBAN">
                      <Input
                        disabled={readOnly}
                        value={form.beneficiaryIban}
                        onChange={(e) => setForm({ ...form, beneficiaryIban: e.target.value })}
                        placeholder="ID01BOTK710008812345"
                      />
                    </Field>
                  </div>
                )}
              </>
            )}

            {/* AR Invoice Left Column Extra Fields (1:1 with add_ARInvoiceNew.html) */}
            {module === 'ARI' && (
              <>
                <Field label="Bill-To Address (Alamat Penagihan Pelanggan)">
                  <Input
                    disabled={readOnly}
                    value={form.billToAddress}
                    onChange={(e) => setForm({ ...form, billToAddress: e.target.value })}
                  />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Number at Card (Customer PO No.)">
                    <Input
                      disabled={readOnly}
                      value={form.customerPoNo}
                      onChange={(e) => setForm({ ...form, customerPoNo: e.target.value })}
                      placeholder="CUST-PO-2026"
                    />
                  </Field>
                  <Field label="Commercial Invoice No.">
                    <Input
                      disabled={readOnly}
                      value={form.commercialInvoiceNo}
                      onChange={(e) => setForm({ ...form, commercialInvoiceNo: e.target.value })}
                      placeholder="CI-2026-0041"
                    />
                  </Field>
                  <Field label="Tax Invoice No. (Faktur Pajak)">
                    <Input
                      disabled={readOnly}
                      value={form.taxInvoiceNo}
                      onChange={(e) => setForm({ ...form, taxInvoiceNo: e.target.value })}
                      placeholder="010.005-26.9988"
                    />
                  </Field>
                </div>
              </>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            {/* Dates & Currency Row (for non-INV modules; INV has dedicated Financial & Tax Breakdown on right) */}
            {module !== 'INV' && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label={
                      ['CA', 'RMB'].includes(module)
                        ? 'Submission Date'
                        : ['OPAP', 'OPCA', 'OPRMB'].includes(module)
                          ? 'Document Date'
                          : 'Issuance / Document Date'
                    }
                    required
                  >
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

                  {module === 'ARI' && (
                    <Field label="Due Date (Jatuh Tempo)" required>
                      <Input
                        type="date"
                        disabled={readOnly}
                        value={form.dueDate}
                        onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      />
                    </Field>
                  )}

                  {['OPAP', 'OPCA', 'OPRMB'].includes(module) && (
                    <Field label="Transfer Plan Date" required>
                      <Input
                        type="date"
                        disabled={readOnly}
                        value={form.plannedDate}
                        onChange={(e) => setForm({ ...form, plannedDate: e.target.value })}
                      />
                    </Field>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Currency" required>
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
                  <Field label="Exchange Rate">
                    <Input
                      type="number"
                      step="any"
                      disabled={readOnly || form.currencyCode === 'IDR'}
                      value={form.exchangeRate}
                      onChange={(e) => setForm({ ...form, exchangeRate: e.target.value })}
                    />
                  </Field>
                  <Field label="Status">
                    <Input disabled value={doc?.status ?? 'DRAFT'} />
                  </Field>
                </div>
              </>
            )}

            {/* AP INVOICE RIGHT COLUMN: Financial & Tax Breakdown (1:1 with Supplier Portal InvoiceCreate.tsx) */}
            {module === 'INV' && (
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-3.5">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-brand-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                      Financial &amp; Tax Breakdown (Kalkulasi DPP, PPN &amp; PPh)
                    </span>
                  </div>
                  <Badge value={form.currencyCode} />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Transaction Currency" required>
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
                  <Field label="Commercial Exchange Rate">
                    <Input
                      type="number"
                      step="any"
                      disabled={readOnly || form.currencyCode === 'IDR'}
                      value={form.exchangeRate}
                      onChange={(e) => setForm({ ...form, exchangeRate: e.target.value })}
                    />
                  </Field>
                  <Field label="Tax Exchange Rate (Kurs KMK)">
                    <Input
                      type="number"
                      step="any"
                      disabled={readOnly}
                      value={form.taxExchangeRate}
                      onChange={(e) => setForm({ ...form, taxExchangeRate: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Transaction Amount (Before Tax / DPP)">
                    <Input disabled value={fmtMoney(subtotal, form.currencyCode)} />
                  </Field>
                  <Field label="Down Payment Applied (Potongan DP)">
                    <Input
                      type="number"
                      step="any"
                      disabled={readOnly}
                      value={form.downPaymentAmount}
                      onChange={(e) => setForm({ ...form, downPaymentAmount: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="VAT Rate (Tarif PPN)" required>
                    <Select
                      disabled={readOnly}
                      value={form.vatRatePercent}
                      onChange={(e) => setForm({ ...form, vatRatePercent: e.target.value })}
                    >
                      {taxCodes
                        .filter((t) => t.taxType === 'VAT')
                        .map((t) => (
                          <option key={t.id} value={String(Number(t.ratePercent))}>
                            {t.code} — {t.name} ({Number(t.ratePercent)}%)
                          </option>
                        ))}
                      {taxCodes.filter((t) => t.taxType === 'VAT').length === 0 && (
                        <>
                          <option value="11">PPN 11%</option>
                          <option value="12">PPN 12%</option>
                          <option value="0">Non-PPN (0%)</option>
                        </>
                      )}
                    </Select>
                  </Field>
                  <Field label="Tax Base VAT (DPP PPN)">
                    <Input
                      type="number"
                      step="any"
                      disabled={readOnly}
                      value={form.taxBaseVat !== '' ? form.taxBaseVat : String(Math.max(0, subtotal - downPaymentAmt))}
                      onChange={(e) => setForm({ ...form, taxBaseVat: e.target.value })}
                    />
                  </Field>
                  <Field label="VAT Amount (Jumlah PPN)">
                    <Input disabled value={fmtMoney(vatAmount, form.currencyCode)} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Withholding Tax Rate (Tarif PPh)">
                    <Select
                      disabled={readOnly}
                      value={form.whtRatePercent}
                      onChange={(e) => {
                        const rate = Number(e.target.value)
                        const base = form.taxBaseWht !== '' ? Number(form.taxBaseWht) : subtotal
                        setForm({
                          ...form,
                          whtRatePercent: e.target.value,
                          whtAmount: String(((base * rate) / 100).toFixed(2)),
                        })
                      }}
                    >
                      <option value="0">Tanpa Potongan PPh (0%)</option>
                      <option value="2">PPh Pasal 23 Jasa &amp; Sewa (2%)</option>
                      <option value="1.5">PPh Pasal 22 Pembelian Barang (1.5%)</option>
                      <option value="10">PPh Final Pasal 4(2) Sewa Tanah/Bangunan (10%)</option>
                      <option value="2.65">PPh Final Konstruksi (2.65%)</option>
                    </Select>
                  </Field>
                  <Field label="Tax Base WHT (DPP PPh)">
                    <Input
                      type="number"
                      step="any"
                      disabled={readOnly}
                      value={form.taxBaseWht !== '' ? form.taxBaseWht : String(subtotal)}
                      onChange={(e) => setForm({ ...form, taxBaseWht: e.target.value })}
                    />
                  </Field>
                  <Field label="Withholding Tax Amount (Jumlah PPh)">
                    <Input
                      type="number"
                      step="any"
                      disabled={readOnly}
                      value={whtRate > 0 ? String(whtAmount.toFixed(2)) : form.whtAmount}
                      onChange={(e) => setForm({ ...form, whtRatePercent: '0', whtAmount: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-2.5">
                  <span className="text-xs font-bold text-brand-900">
                    Total Invoice / Net Payable (DPP - DP + PPN - PPh):
                  </span>
                  <span className="text-base font-bold text-brand-700">
                    {fmtMoney(grandTotal, form.currencyCode)}
                  </span>
                </div>
              </div>
            )}

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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                  <Field label="Freight / Shipping Cost">
                    <Input
                      type="number"
                      step="any"
                      disabled={readOnly}
                      value={form.freightAmount}
                      onChange={(e) => setForm({ ...form, freightAmount: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Delivery Address (Gudang Penerima)">
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
                <Field label="Vehicle Plate No. (Nomor Polisi)">
                  <Input
                    disabled={readOnly}
                    value={form.vehiclePlateNo}
                    onChange={(e) => setForm({ ...form, vehiclePlateNo: e.target.value })}
                    placeholder="e.g. B 9421 KXR"
                  />
                </Field>
                <Field label="Driver Name (Nama Pengemudi)">
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
                <Field
                  label={
                    module === 'RMB'
                      ? 'Reference Doc (No. Invoice / Kwitansi) *'
                      : 'Reference Voucher / Supporting Doc No.'
                  }
                  required={module === 'RMB'}
                >
                  <Input
                    disabled={readOnly}
                    value={form.referenceNo}
                    onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
                    placeholder="e.g. INV-99281 / KWITANSI-2026-01"
                  />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Control Account (G/L Control)">
                    <Input
                      disabled
                      value={
                        module === 'RMB'
                          ? '210200 — Hutang Klaim Karyawan (Reimbursement Payable)'
                          : form.controlAccount
                      }
                    />
                  </Field>
                  <Field label="Account Bank Transfer">
                    <Input disabled value={form.bankTransferInfo} />
                  </Field>
                </div>
              </>
            )}

            {/* AR INVOICE RIGHT COLUMN EXTRA FIELDS (1:1 with add_ARInvoiceNew.html) */}
            {module === 'ARI' && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Document Type / Kind">
                    <Select
                      disabled={readOnly}
                      value={form.invoiceKind}
                      onChange={(e) => setForm({ ...form, invoiceKind: e.target.value })}
                    >
                      <option value="INVOICE">A — Standard AR Invoice</option>
                      <option value="CREDIT_MEMO">S — AR Credit Memo</option>
                      <option value="DEBIT_MEMO">D — AR Debit Memo</option>
                    </Select>
                  </Field>
                  <Field label="Receiving Bank Account">
                    <Input
                      disabled={readOnly}
                      value={form.receivingBankAccount}
                      onChange={(e) => setForm({ ...form, receivingBankAccount: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Transport Code">
                    <Input
                      disabled={readOnly}
                      value={form.transportCode}
                      onChange={(e) => setForm({ ...form, transportCode: e.target.value })}
                    />
                  </Field>
                  <Field label="Shipping Type">
                    <Input
                      disabled={readOnly}
                      value={form.shippingType}
                      onChange={(e) => setForm({ ...form, shippingType: e.target.value })}
                    />
                  </Field>
                  <Field label="Track Number">
                    <Input
                      disabled={readOnly}
                      value={form.trackNo}
                      onChange={(e) => setForm({ ...form, trackNo: e.target.value })}
                      placeholder="DO / AWB / Seal No."
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <Field label="Group Number">
                    <Input
                      disabled={readOnly}
                      value={form.groupNumber}
                      onChange={(e) => setForm({ ...form, groupNumber: e.target.value })}
                    />
                  </Field>
                  <Field label="UDF 1 (Custom Ref 1)">
                    <Input
                      disabled={readOnly}
                      value={form.udf1}
                      onChange={(e) => setForm({ ...form, udf1: e.target.value })}
                      placeholder="Optional UDF1"
                    />
                  </Field>
                  <Field label="UDF 2 (Custom Ref 2)">
                    <Input
                      disabled={readOnly}
                      value={form.udf2}
                      onChange={(e) => setForm({ ...form, udf2: e.target.value })}
                      placeholder="Optional UDF2"
                    />
                  </Field>
                  <Field label="Is Transferred (SAP)">
                    <Input disabled value={form.isTransferred} />
                  </Field>
                </div>
              </>
            )}

            {/* OUTGOING PAYMENTS RIGHT COLUMN (OPAP / OPCA / OPRMB) */}
            {['OPAP', 'OPCA', 'OPRMB'].includes(module) && (
              <>
                <Field label="Account Bank Transfer (G/L Company Bank / Cash)" required>
                  {readOnly ? (
                    <Input disabled value={form.companyBankLabel || 'MUFG-IDR — MUFG Bank Operational'} />
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
                          companyBankCode: r?.code ?? 'MUFG-IDR',
                          companyBankLabel: r ? `${r.code} — ${r.name} (${r.accountNo})` : '',
                        })
                      }
                    />
                  )}
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Control Account">
                    <Input
                      disabled
                      value={
                        module === 'OPAP'
                          ? '210100 — AP Trade Payable'
                          : module === 'OPCA'
                            ? '114100 — Cash Advance Control'
                            : '210200 — Reimbursement Payable'
                      }
                    />
                  </Field>
                  <Field label="Payment Method">
                    <Select
                      disabled={readOnly}
                      value={form.paymentMethod}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    >
                      <option value="TRANSFER">TRANSFER (MUFG / Bank)</option>
                      <option value="CASH">CASH (Petty Cash)</option>
                      <option value="GIRO">GIRO / CHEQUE</option>
                    </Select>
                  </Field>
                  <Field label="SAP / Bank Batch Ref No.">
                    <Input
                      disabled={readOnly}
                      value={form.bankReference}
                      onChange={(e) => setForm({ ...form, bankReference: e.target.value })}
                      placeholder="MUFG-BATCH-2026"
                    />
                  </Field>
                </div>

                {module === 'OPAP' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="Beneficiary Bank / Branch">
                      <Input
                        disabled={readOnly}
                        value={`${form.beneficiaryBankName} — ${form.beneficiaryBranch}`}
                        onChange={(e) => setForm({ ...form, beneficiaryBankName: e.target.value })}
                      />
                    </Field>
                    <Field label="Country & City">
                      <Input
                        disabled={readOnly}
                        value={`${form.beneficiaryCountry} / ${form.beneficiaryCity}`}
                        onChange={(e) => setForm({ ...form, beneficiaryCity: e.target.value })}
                      />
                    </Field>
                    <Field label="Resident / Citizenship">
                      <Input
                        disabled={readOnly}
                        value={form.beneficiaryCitizenship}
                        onChange={(e) => setForm({ ...form, beneficiaryCitizenship: e.target.value })}
                      />
                    </Field>
                  </div>
                )}

                <Field label="Total Remittance / Payment Amount Applied" required>
                  <Input
                    type="number"
                    step="any"
                    disabled={readOnly}
                    value={form.amountApplied}
                    onChange={(e) => setForm({ ...form, amountApplied: e.target.value })}
                  />
                </Field>
              </>
            )}

            {module === 'SVR' && (
              <Field label="Verification Request Type" required>
                <Select
                  disabled={readOnly}
                  value={form.requestType}
                  onChange={(e) => setForm({ ...form, requestType: e.target.value })}
                >
                  <option value="ONBOARDING">ONBOARDING (New Supplier Qualification)</option>
                  <option value="BANK_CHANGE">BANK_CHANGE (Bank Account &amp; MUFG Verification)</option>
                  <option value="PROFILE_UPDATE">PROFILE_UPDATE (NPWP / PKP Legal Update)</option>
                  <option value="REVERIFICATION">REVERIFICATION (Annual Vendor Evaluation)</option>
                </Select>
              </Field>
            )}
          </div>
        </div>
      </Card>

      {/* SECTION 2A: OUTGOING PAYMENT SPECIFIC TABLES (OPAP Invoice Allocation + Journal Preview, OPCA/OPRMB Source Expense Breakdown) */}
      {['OPAP', 'OPCA', 'OPRMB'].includes(module) && (
        <div className="space-y-6">
          {module === 'OPAP' ? (
            <Card
              title="2. Detail Invoice Allocation Table (VPM2 — Faktur AP yang Dibayar)"
              desc="Daftar tagihan AP Invoice vendor yang dialokasikan dalam voucher pembayaran keluar ini beserta PPN, PPh (WTax), dan Terbilang."
            >
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-left text-xs">
                  <thead className="border-b border-gray-200 bg-gray-50 font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2.5 text-center">#</th>
                      <th className="px-3 py-2.5">Invoice No.</th>
                      <th className="px-3 py-2.5">Vendor Invoice / Faktur Pajak</th>
                      <th className="px-3 py-2.5">Object Type</th>
                      <th className="px-3 py-2.5">Invoice Date</th>
                      <th className="px-3 py-2.5">Due Date</th>
                      <th className="px-3 py-2.5 text-center">Overdue Days</th>
                      <th className="px-3 py-2.5">Ccy</th>
                      <th className="px-3 py-2.5 text-right">DPP Amount</th>
                      <th className="px-3 py-2.5 text-right">VAT (PPN)</th>
                      <th className="px-3 py-2.5 text-right">WTax (PPh)</th>
                      <th className="px-3 py-2.5 text-right">Net Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50/70">
                      <td className="px-3 py-3 text-center font-medium text-gray-500">1</td>
                      <td className="px-3 py-3 font-mono font-bold text-brand-700">
                        {linkedPayTargetDoc?.docNo || form.targetDocLabel || '(Select AP Invoice)'}
                      </td>
                      <td className="px-3 py-3 text-gray-800">
                        <div>{targetDocDetail.BpInvoiceNo || 'INV-VENDOR-001'}</div>
                        <div className="font-mono text-[11px] text-gray-500">
                          FP: {targetDocDetail.TaxInvoiceNo || '010.004-26.00000000'}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge value="AP_INVOICE" />
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        {fmtDate(targetDocDetail.InvoiceDate || linkedPayTargetDoc?.docDate || form.docDate)}
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        {fmtDate(targetDocDetail.DueDate || form.plannedDate)}
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-gray-600">0</td>
                      <td className="px-3 py-3 font-semibold">{form.currencyCode}</td>
                      <td className="px-3 py-3 text-right font-mono text-gray-800">
                        {fmtMoney(targetDocDetail.TransactionAmount ?? grandTotal, '')}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-gray-800">
                        {fmtMoney(targetDocDetail.VatAmount ?? 0, '')}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-error-600">
                        {fmtMoney(targetDocDetail.WhtAmount ?? 0, '')}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-gray-900">
                        {fmtMoney(grandTotal, '')}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="border-t border-gray-200 bg-gray-50 font-semibold">
                    <tr>
                      <td colSpan={11} className="px-3 py-2 text-right text-gray-700">
                        Total Amount Due ({form.currencyCode}):
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-bold text-brand-700">
                        {fmtMoney(grandTotal, form.currencyCode)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={12} className="bg-brand-50/40 px-3 py-2 text-xs italic text-gray-700">
                        <strong className="not-italic text-gray-600">Amount in Words (Invoice): </strong>
                        {formatAmountInWords(grandTotal, form.currencyCode)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          ) : (
            <Card
              title={`2. Source ${module === 'OPCA' ? 'Cash Advance' : 'Reimbursement'
                } G/L Expense Breakdown (VPM2 Account Lines)`}
              desc="Rincian akun biaya (G/L Account COA) dari dokumen sumber yang dicairkan melalui voucher Outgoing Payment ini."
            >
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-left text-xs">
                  <thead className="border-b border-gray-200 bg-gray-50 font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2.5 text-center">#</th>
                      <th className="px-3 py-2.5">G/L Account (COA)</th>
                      <th className="px-3 py-2.5">Account Name</th>
                      <th className="px-3 py-2.5">Description</th>
                      <th className="px-3 py-2.5">Expense Date</th>
                      <th className="px-3 py-2.5">Currency</th>
                      <th className="px-3 py-2.5 text-right">Net Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {targetDocLines.length > 0 ? (
                      targetDocLines.map((ln, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/70">
                          <td className="px-3 py-2.5 text-center text-gray-500">{idx + 1}</td>
                          <td className="px-3 py-2.5 font-mono font-bold text-brand-700">
                            {ln.itemCode || '610200'}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-gray-800">
                            {ln.itemName || 'Operational Expense Account'}
                          </td>
                          <td className="px-3 py-2.5 text-gray-700">{ln.description}</td>
                          <td className="px-3 py-2.5 text-gray-600">
                            {fmtDate(ln.expenseDate || linkedPayTargetDoc?.docDate)}
                          </td>
                          <td className="px-3 py-2.5 font-semibold">{form.currencyCode}</td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-gray-900">
                            {fmtMoney(ln.unitPrice ?? ln.lineTotal ?? 0, '')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-3 py-3 text-center text-gray-500">1</td>
                        <td className="px-3 py-3 font-mono font-bold text-brand-700">
                          {module === 'OPCA' ? '114100' : '210200'}
                        </td>
                        <td className="px-3 py-3 font-semibold text-gray-800">
                          {module === 'OPCA'
                            ? 'Uang Muka Operasional Karyawan (Cash Advance)'
                            : 'Klaim Penggantian Biaya Operasional (Reimbursement)'}
                        </td>
                        <td className="px-3 py-3 text-gray-700">{form.title || 'Remittance Disbursement'}</td>
                        <td className="px-3 py-3 text-gray-600">{fmtDate(form.plannedDate)}</td>
                        <td className="px-3 py-3 font-semibold">{form.currencyCode}</td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-gray-900">
                          {fmtMoney(grandTotal, '')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="border-t border-gray-200 bg-gray-50 font-semibold">
                    <tr>
                      <td colSpan={6} className="px-3 py-2 text-right text-gray-700">
                        Total Remittance Amount ({form.currencyCode}):
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-bold text-brand-700">
                        {fmtMoney(grandTotal, form.currencyCode)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={7} className="bg-brand-50/40 px-3 py-2 text-xs italic text-gray-700">
                        <strong className="not-italic text-gray-600">Amount in Words (Terbilang): </strong>
                        {formatAmountInWords(grandTotal, form.currencyCode)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          )}

          {/* Journal Information Table (G/L Debit & Credit Preview — 1:1 with preparedOPAPInvoice.html) */}
          <Card
            title="3. Journal Information (Preview Jurnal Akuntansi G/L Debit & Credit)"
            desc="Simulasi jurnal buku besar otomatis (Control Account Debit vs Company Bank Account Credit) saat pembayaran diposting."
          >
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50 font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2.5">Account Code</th>
                    <th className="px-4 py-2.5">Account Name (G/L COA)</th>
                    <th className="px-4 py-2.5">Journal Remarks</th>
                    <th className="px-4 py-2.5">Currency</th>
                    <th className="px-4 py-2.5 text-right">Debit</th>
                    <th className="px-4 py-2.5 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-2.5 font-mono font-bold text-gray-900">
                      {module === 'OPAP' ? '210100' : module === 'OPCA' ? '114100' : '210200'}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-gray-800">
                      {module === 'OPAP'
                        ? 'Hutang Usaha Vendor (AP Trade Payable Control)'
                        : module === 'OPCA'
                          ? 'Uang Muka Operasional Karyawan (Cash Advance Control)'
                          : 'Hutang Klaim Reimbursement (Employee Reimbursement Payable)'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {form.title || `Settlement of ${linkedPayTargetDoc?.docNo ?? module}`}
                    </td>
                    <td className="px-4 py-2.5 font-semibold">{form.currencyCode}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700">
                      {fmtMoney(grandTotal, '')}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-gray-400">0,00</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono font-bold text-gray-900">{form.companyBankGlCode}</td>
                    <td className="px-4 py-2.5 font-semibold text-gray-800">
                      {form.companyBankLabel || 'MUFG Bank Operational Account'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      Outgoing Bank Transfer {form.bankReference ? `(${form.bankReference})` : ''}
                    </td>
                    <td className="px-4 py-2.5 font-semibold">{form.currencyCode}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-gray-400">0,00</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-brand-700">
                      {fmtMoney(grandTotal, '')}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="border-t border-gray-200 bg-gray-50 font-bold">
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right text-gray-700">
                      Balanced Journal Total ({form.currencyCode}):
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-emerald-700">
                      {fmtMoney(grandTotal, '')}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-brand-700">
                      {fmtMoney(grandTotal, '')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* SECTION 2B: LINE ITEMS GRID FOR PR, PR_RAW, RFQ, QUO, CTR, PO, GR, CA, STL, RMB, INV, ARI */}
      {!['SVR', 'OPAP', 'OPCA', 'OPRMB'].includes(module) && (
        <Card
          title={
            module === 'PR_RAW'
              ? '2. Raw Material & SAP Inventory Line Items (10 Kolom Standar Pabrik)'
              : isExpenseDoc
                ? '2. Expense Details & G/L Account (COA) Breakdown (6 Kolom)'
                : module === 'ARI'
                  ? `2. AR Invoice Line Items (${form.ariDocMode === 'ITEM' ? 'Item Sales Mode' : 'Service Revenue Mode'
                  })`
                  : '2. Document Line Items & Detailed Specifications'
          }
          desc="Tambahkan seluruh baris item, kategori biaya, kode G/L Account (COA), spesifikasi, kuantitas, satuan, dan harga."
        >
          {isExpenseDoc ? (
            /* 6-Column Expense Table matching addCash.html / addSettle.html / addReim.html */
            <LinesEditor<LineItem>
              lines={lines}
              onChange={setLines}
              newLine={emptyLine}
              readOnly={readOnly}
              columns={[
                {
                  key: 'cat',
                  header: 'Category *',
                  width: '18%',
                  render: (row, set) => (
                    <Select
                      disabled={readOnly}
                      value={row.expenseCategoryCode}
                      onChange={(e) => set({ expenseCategoryCode: e.target.value })}
                    >
                      {expenseCategories.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.name}
                        </option>
                      ))}
                      {expenseCategories.length === 0 && (
                        <>
                          <option value="TRAVEL">TRAVEL — Perjalanan Dinas &amp; Hotel</option>
                          <option value="OFFICE">OFFICE — Keperluan Kantor &amp; ATK</option>
                          <option value="MAINT">MAINT — Pemeliharaan &amp; Perbaikan</option>
                          <option value="OPER">OPER — Operasional Pabrik &amp; Logistik</option>
                        </>
                      )}
                    </Select>
                  ),
                },
                {
                  key: 'coaName',
                  header: 'Account Name (Searchable COA) *',
                  width: '26%',
                  render: (row, set) =>
                    readOnly ? (
                      <span className="text-xs font-semibold text-gray-800">
                        {row.coaLabel || `${row.coaCode} — ${row.coaName}`}
                      </span>
                    ) : (
                      <LookupSelect
                        path="/coas"
                        value={row.coaId}
                        initialLabel={row.coaLabel}
                        label={(r) => `${r.name} (${r.code})`}
                        onChange={(v, r) =>
                          set({
                            coaId: v,
                            coaCode: r?.code ?? '610200',
                            coaName: r?.name ?? '',
                            coaLabel: r ? `${r.name} (${r.code})` : '',
                          })
                        }
                      />
                    ),
                },
                {
                  key: 'coaCode',
                  header: 'G/L Account (COA)',
                  width: '13%',
                  render: (row) => (
                    <Input
                      disabled
                      className="font-mono font-bold text-brand-700"
                      value={row.coaCode || '610200'}
                    />
                  ),
                },
                {
                  key: 'desc',
                  header: 'Description *',
                  width: '22%',
                  render: (row, set) => (
                    <Input
                      disabled={readOnly}
                      required
                      value={row.description}
                      onChange={(e) => set({ description: e.target.value })}
                      placeholder="Rincian pengeluaran..."
                    />
                  ),
                },
                {
                  key: 'date',
                  header: 'Expense Date',
                  width: '10%',
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
                  width: '11%',
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
                      <td colSpan={5} className="px-3 py-1.5 text-right text-xs text-gray-500">
                        Cash Advance Amount (Uang Muka Awal):
                      </td>
                      <td colSpan={2} className="px-3 py-1.5 text-xs font-semibold text-gray-800">
                        {fmtMoney(form.caAmount, form.currencyCode)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-right text-xs font-bold text-gray-700">
                      {module === 'STL' ? 'Total Realized / Spent Amount:' : 'Total Amount:'}
                    </td>
                    <td colSpan={2} className="px-3 py-2 text-sm font-bold text-brand-700">
                      {fmtMoney(subtotal, form.currencyCode)}
                    </td>
                  </tr>
                  {module === 'STL' && (
                    <tr className="border-t border-gray-200">
                      <td colSpan={5} className="px-3 py-2 text-right text-xs font-bold text-gray-700">
                        Difference Amount ({stlDiff >= 0 ? 'Refund to Company' : 'Top-up to Employee'}):
                      </td>
                      <td
                        colSpan={2}
                        className={`px-3 py-2 text-sm font-bold ${stlDiff >= 0 ? 'text-emerald-700' : 'text-warning-700'
                          }`}
                      >
                        {fmtMoney(stlDiff, form.currencyCode)}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t border-gray-100 bg-brand-50/40">
                    <td colSpan={7} className="px-3 py-2 text-xs italic text-gray-700">
                      <strong className="not-italic text-gray-600">Amount in Words (Terbilang): </strong>
                      {formatAmountInWords(subtotal, form.currencyCode)}
                    </td>
                  </tr>
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
                      placeholder="Deskripsi barang yang diterima"
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
                      placeholder="Catatan QC / alasan reject"
                    />
                  ),
                },
              ]}
            />
          ) : module === 'PR_RAW' ? (
            /* 10-Column PR Raw Material Table (1:1 with addPRRawMaterial.html) */
            <LinesEditor<LineItem>
              lines={lines}
              onChange={setLines}
              newLine={emptyLine}
              readOnly={readOnly}
              columns={[
                {
                  key: 'item',
                  header: 'Item No. *',
                  width: '15%',
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
                            itemCode: r?.code ?? '',
                            itemLabel: r ? `${r.code} — ${r.name}` : '',
                            description: r ? r.name : row.description,
                            uomId: r?.uomId ?? row.uomId,
                            uomLabel: r?.uomCode ?? row.uomLabel,
                            invUom: r?.uomCode ?? row.invUom,
                          })
                        }
                      />
                    ),
                },
                {
                  key: 'desc',
                  header: 'Description *',
                  width: '18%',
                  render: (row, set) => (
                    <Input
                      disabled={readOnly}
                      required
                      value={row.description}
                      onChange={(e) => set({ description: e.target.value })}
                      placeholder="Raw material name"
                    />
                  ),
                },
                {
                  key: 'etaPlant',
                  header: 'Req. Date ETA Plant *',
                  width: '12%',
                  render: (row, set) => (
                    <Input
                      type="date"
                      disabled={readOnly}
                      value={row.etaPlant}
                      onChange={(e) => set({ etaPlant: e.target.value })}
                    />
                  ),
                },
                {
                  key: 'etaJakarta',
                  header: 'Req. Date ETA Jakarta *',
                  width: '12%',
                  render: (row, set) => (
                    <Input
                      type="date"
                      disabled={readOnly}
                      value={row.etaJakarta}
                      onChange={(e) => set({ etaJakarta: e.target.value })}
                    />
                  ),
                },
                {
                  key: 'qty',
                  header: 'Quantity *',
                  width: '9%',
                  render: (row, set) => (
                    <Input
                      type="number"
                      step="any"
                      disabled={readOnly}
                      value={row.quantity}
                      onChange={(e) => set({ quantity: e.target.value, invQuantity: e.target.value })}
                    />
                  ),
                },
                {
                  key: 'uom',
                  header: 'UOM *',
                  width: '9%',
                  render: (row, set) =>
                    readOnly ? (
                      <span className="text-xs font-semibold">{row.uomLabel || 'KG'}</span>
                    ) : (
                      <LookupSelect
                        path="/uoms"
                        params={{ isActive: 'true' }}
                        value={row.uomId}
                        initialLabel={row.uomLabel}
                        label={(r) => r.code}
                        onChange={(v, r) => set({ uomId: v, uomLabel: r?.code })}
                      />
                    ),
                },
                {
                  key: 'invQty',
                  header: 'Inventory Qty',
                  width: '9%',
                  render: (row, set) => (
                    <Input
                      type="number"
                      step="any"
                      disabled={readOnly}
                      value={row.invQuantity}
                      onChange={(e) => set({ invQuantity: e.target.value })}
                    />
                  ),
                },
                {
                  key: 'invUom',
                  header: 'Inventory UOM',
                  width: '8%',
                  render: (row, set) => (
                    <Input
                      disabled={readOnly}
                      value={row.invUom}
                      onChange={(e) => set({ invUom: e.target.value })}
                    />
                  ),
                },
                {
                  key: 'div',
                  header: 'Division *',
                  width: '8%',
                  render: (row, set) => (
                    <Input
                      disabled={readOnly}
                      value={row.division}
                      onChange={(e) => set({ division: e.target.value })}
                      placeholder="PROD-01"
                    />
                  ),
                },
              ]}
            />
          ) : module === 'ARI' ? (
            /* 12-Column AR Invoice Table (1:1 with add_ARInvoiceNew.html / detailINVItem.html) */
            <LinesEditor<LineItem>
              lines={lines}
              onChange={setLines}
              newLine={emptyLine}
              readOnly={readOnly}
              columns={[
                ...(form.ariDocMode === 'ITEM'
                  ? [
                    {
                      key: 'item',
                      header: 'Item No.',
                      width: '13%',
                      render: (row: LineItem, set: (p: Partial<LineItem>) => void) =>
                        readOnly ? (
                          <span className="font-mono text-xs font-semibold">{row.itemLabel || '—'}</span>
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
                      key: 'bpCat',
                      header: 'BP Catalog No.',
                      width: '10%',
                      render: (row: LineItem, set: (p: Partial<LineItem>) => void) => (
                        <Input
                          disabled={readOnly}
                          value={row.bpCatalogNo}
                          onChange={(e) => set({ bpCatalogNo: e.target.value })}
                          placeholder="CAT-01"
                        />
                      ),
                    },
                    {
                      key: 'pack',
                      header: 'Packing Size',
                      width: '10%',
                      render: (row: LineItem, set: (p: Partial<LineItem>) => void) => (
                        <Input
                          disabled={readOnly}
                          value={row.packingSize}
                          onChange={(e) => set({ packingSize: e.target.value })}
                        />
                      ),
                    },
                  ]
                  : []),
                {
                  key: 'desc',
                  header: 'Item / Service Description *',
                  width: form.ariDocMode === 'ITEM' ? '18%' : '28%',
                  render: (row, set) => (
                    <Input
                      disabled={readOnly}
                      required
                      value={row.description}
                      onChange={(e) => set({ description: e.target.value })}
                      placeholder="Deskripsi produk atau jasa..."
                    />
                  ),
                },
                {
                  key: 'qty',
                  header: 'Qty *',
                  width: '7%',
                  render: (row, set) => (
                    <Input
                      type="number"
                      step="any"
                      disabled={readOnly}
                      value={row.quantity}
                      onChange={(e) => set({ quantity: e.target.value })}
                    />
                  ),
                },
                {
                  key: 'uom',
                  header: 'UoM',
                  width: '7%',
                  render: (row, set) =>
                    readOnly ? (
                      <span className="text-xs font-semibold">{row.uomLabel || 'EA'}</span>
                    ) : (
                      <LookupSelect
                        path="/uoms"
                        params={{ isActive: 'true' }}
                        value={row.uomId}
                        initialLabel={row.uomLabel}
                        label={(r) => r.code}
                        onChange={(v, r) => set({ uomId: v, uomLabel: r?.code })}
                      />
                    ),
                },
                {
                  key: 'price',
                  header: 'Unit Price *',
                  width: '11%',
                  render: (row, set) => (
                    <Input
                      type="number"
                      step="any"
                      disabled={readOnly}
                      value={row.unitPrice}
                      onChange={(e) => set({ unitPrice: e.target.value })}
                    />
                  ),
                },
                {
                  key: 'disc',
                  header: 'Disc %',
                  width: '6%',
                  render: (row, set) => (
                    <Input
                      type="number"
                      step="any"
                      disabled={readOnly}
                      value={row.discountPercent}
                      onChange={(e) => set({ discountPercent: e.target.value })}
                    />
                  ),
                },
                {
                  key: 'coa',
                  header: 'Revenue G/L (COA)',
                  width: '13%',
                  render: (row, set) =>
                    readOnly ? (
                      <span className="font-mono text-xs">{row.coaLabel || '410100'}</span>
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
                  key: 'wht',
                  header: 'WTax Liable',
                  width: '7%',
                  render: (row, set) => (
                    <Select
                      disabled={readOnly}
                      value={row.whtLiable}
                      onChange={(e) => set({ whtLiable: e.target.value as 'Yes' | 'No' })}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </Select>
                  ),
                },
                {
                  key: 'total',
                  header: 'Line Total',
                  width: '10%',
                  render: (row) => {
                    const lineTotal =
                      (Number(row.quantity) || 0) *
                      (Number(row.unitPrice) || 0) *
                      (1 - (Number(row.discountPercent) || 0) / 100)
                    return (
                      <span className="block pt-2 text-right font-mono text-xs font-bold text-gray-900">
                        {fmtMoney(lineTotal, '')}
                      </span>
                    )
                  },
                },
              ]}
              footer={
                <>
                  <tr>
                    <td colSpan={7} className="px-3 py-1.5 text-right text-xs text-gray-500">
                      Sub Total (DPP):
                    </td>
                    <td colSpan={5} className="px-3 py-1.5 text-right text-xs font-semibold text-gray-800">
                      {fmtMoney(subtotal, form.currencyCode)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={7} className="px-3 py-1.5 text-right text-xs text-gray-500">
                      VAT Sum (PPN 11%):
                    </td>
                    <td colSpan={5} className="px-3 py-1.5 text-right text-xs font-semibold text-gray-800">
                      {fmtMoney(vatAmount, form.currencyCode)}
                    </td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td colSpan={7} className="px-3 py-2 text-right text-xs font-bold text-gray-700">
                      Document Total (Net Receivable):
                    </td>
                    <td colSpan={5} className="px-3 py-2 text-right text-sm font-bold text-brand-700">
                      {fmtMoney(grandTotal, form.currencyCode)}
                    </td>
                  </tr>
                </>
              }
            />
          ) : (
            /* Standard PR (9 columns), RFQ, QUO, CTR, PO, INV Table */
            <LinesEditor<LineItem>
              lines={lines}
              onChange={setLines}
              newLine={emptyLine}
              readOnly={readOnly}
              columns={[
                ...(module !== 'INV'
                  ? [
                    {
                      key: 'item',
                      header: 'Item No. / Catalog',
                      width: '16%',
                      render: (row: LineItem, set: (p: Partial<LineItem>) => void) =>
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
                  ]
                  : [
                    {
                      key: 'coa',
                      header: 'G/L Account (COA)',
                      width: '20%',
                      render: (row: LineItem, set: (p: Partial<LineItem>) => void) =>
                        readOnly ? (
                          <span className="font-mono text-xs font-semibold">
                            {row.coaLabel || '610100'}
                          </span>
                        ) : (
                          <LookupSelect
                            path="/coas"
                            value={row.coaId}
                            initialLabel={row.coaLabel}
                            label={(r) => `${r.code} — ${r.name}`}
                            onChange={(v, r) =>
                              set({ coaId: v, coaLabel: r ? `${r.code} — ${r.name}` : '' })
                            }
                          />
                        ),
                    },
                  ]),
                {
                  key: 'desc',
                  header: 'Description *',
                  width: '22%',
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
                      width: '15%',
                      render: (row: LineItem, set: (p: Partial<LineItem>) => void) => (
                        <Input
                          disabled={readOnly}
                          value={row.detailSpec}
                          onChange={(e) => set({ detailSpec: e.target.value })}
                          placeholder="Spec / Grade / Model"
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
                {
                  key: 'qty',
                  header: 'Quantity *',
                  width: '9%',
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
                ...(module !== 'INV'
                  ? [
                    {
                      key: 'uom',
                      header: 'UOM *',
                      width: '10%',
                      render: (row: LineItem, set: (p: Partial<LineItem>) => void) =>
                        readOnly ? (
                          <span className="text-xs font-semibold text-gray-700">
                            {row.uomLabel || 'EA'}
                          </span>
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
                  ]
                  : []),
                ...(module !== 'RFQ'
                  ? [
                    {
                      key: 'price',
                      header: module === 'PR' ? 'Est. Unit Price' : 'Unit Price *',
                      width: '12%',
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
                    ...(['QUO', 'CTR', 'PO', 'INV'].includes(module)
                      ? [
                        {
                          key: 'disc',
                          header: 'Disc %',
                          width: '8%',
                          render: (row: LineItem, set: (p: Partial<LineItem>) => void) => (
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              disabled={readOnly}
                              value={row.discountPercent}
                              onChange={(e) => set({ discountPercent: e.target.value })}
                            />
                          ),
                        },
                      ]
                      : []),
                    {
                      key: 'lineTotal',
                      header: 'Line Total',
                      width: '11%',
                      render: (row: LineItem) => {
                        const lt =
                          (Number(row.quantity) || 0) *
                          (Number(row.unitPrice) || 0) *
                          (1 - (Number(row.discountPercent) || 0) / 100)
                        return (
                          <span className="block pt-2 text-right font-mono text-xs font-bold text-gray-900">
                            {fmtMoney(lt, '')}
                          </span>
                        )
                      },
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
                      <td colSpan={4} className="px-3 py-1.5 text-right text-xs font-semibold text-gray-800">
                        {fmtMoney(subtotal, form.currencyCode)}
                      </td>
                    </tr>
                    {isVatDoc && (
                      <tr>
                        <td colSpan={4} className="px-3 py-1.5 text-right text-xs text-gray-500">
                          VAT / PPN ({vatRate}%):
                        </td>
                        <td colSpan={4} className="px-3 py-1.5 text-right text-xs font-semibold text-gray-800">
                          {fmtMoney(vatAmount, form.currencyCode)}
                        </td>
                      </tr>
                    )}
                    {meta.docType === 'PO' && freightAmount > 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-1.5 text-right text-xs text-gray-500">
                          Freight / Shipping Cost:
                        </td>
                        <td colSpan={4} className="px-3 py-1.5 text-right text-xs font-semibold text-gray-800">
                          {fmtMoney(freightAmount, form.currencyCode)}
                        </td>
                      </tr>
                    )}
                    {meta.docType === 'INV' && whtAmount > 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-1.5 text-right text-xs text-gray-500">
                          Less Withholding Tax (PPh):
                        </td>
                        <td colSpan={4} className="px-3 py-1.5 text-right text-xs font-semibold text-error-600">
                          - {fmtMoney(whtAmount, form.currencyCode)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t border-gray-200">
                      <td colSpan={4} className="px-3 py-2 text-right text-xs font-bold text-gray-700">
                        Grand Total ({form.currencyCode}):
                      </td>
                      <td colSpan={4} className="px-3 py-2 text-right text-sm font-bold text-brand-700">
                        {fmtMoney(grandTotal, form.currencyCode)}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-100 bg-brand-50/40">
                      <td colSpan={8} className="px-3 py-2 text-xs italic text-gray-700">
                        <strong className="not-italic text-gray-600">Amount in Words (Terbilang): </strong>
                        {formatAmountInWords(grandTotal, form.currencyCode)}
                      </td>
                    </tr>
                  </>
                ) : undefined
              }
            />
          )}
        </Card>
      )}

      {/* SECTION 3: Supporting Attachments (with File Type, Attachment Detail & Inline PDF Preview), Remarks & 6-Role Searchable Approval Matrix */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Card
            title="3. Remarks, Business Justification & Journal Memo"
            desc="Catatan bisnis, alasan pengadaan, instruksi pengiriman, atau memo jurnal akuntansi."
          >
            <div className="space-y-4">
              {['PR', 'PR_RAW'].includes(module) && (
                <Field label="Business Justification / Purpose of Requisition">
                  <Textarea
                    rows={2}
                    disabled={readOnly}
                    value={form.justification}
                    onChange={(e) => setForm({ ...form, justification: e.target.value })}
                    placeholder="Jelaskan urgensi atau alasan pengadaan ini..."
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
                  placeholder="Masukkan catatan tambahan, rincian pembayaran, atau keterangan dokumen..."
                />
              </Field>

              {['OPAP', 'OPCA', 'OPRMB', 'INV', 'ARI'].includes(module) && (
                <Field label="Journal Remarks / G/L Memo">
                  <Input
                    disabled={readOnly}
                    value={form.journalRemarks}
                    onChange={(e) => setForm({ ...form, journalRemarks: e.target.value })}
                    placeholder="Memo buku besar / jurnal akuntansi..."
                  />
                </Field>
              )}
            </div>
          </Card>

          {/* File Attachments on Create (with File Type, Attachment Detail & Inline PDF Preview like InvoiceCreate.tsx) OR Live AttachmentPanel on Existing Doc */}
          {isNew ? (
            <Card
              title="4. Attach Supporting Documents (File Type, Detail & Preview PDF)"
              desc="Unggah file PDF/lampiran (Invoice, Faktur Pajak, Surat Jalan, BAST, Penawaran). Anda dapat menentukan Tipe File, Keterangan, dan melakukan Preview PDF sebelum menyimpan."
            >
              <div className="space-y-4">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.xlsx,.docx"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? [])
                    const added: PendingUpload[] = files.map((file) => ({
                      file,
                      category:
                        module === 'INV'
                          ? 'INVOICE'
                          : ['PR', 'RFQ', 'QUO'].includes(module)
                            ? 'QUOTATION'
                            : module === 'GR'
                              ? 'DELIVERY_NOTE'
                              : 'OTHER',
                      description: '',
                      visibility: 'SHARED',
                    }))
                    setPendingUploads((prev) => [...prev, ...added])
                  }}
                  className="block w-full rounded-lg border border-gray-300 bg-white text-xs text-gray-700 file:mr-3 file:rounded-l-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-700"
                />

                {pendingUploads.length > 0 && (
                  <div className="space-y-2.5">
                    {pendingUploads.map((u, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-1 gap-2.5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs sm:grid-cols-12 sm:items-center"
                      >
                        <div className="sm:col-span-4 min-w-0">
                          <span className="block truncate font-semibold text-gray-900">{u.file.name}</span>
                          <span className="text-[11px] text-gray-500">{(u.file.size / 1024).toFixed(0)} KB</span>
                        </div>
                        <div className="sm:col-span-3">
                          <Select
                            value={u.category}
                            onChange={(e) =>
                              setPendingUploads((prev) =>
                                prev.map((x, idx) => (idx === i ? { ...x, category: e.target.value } : x))
                              )
                            }
                          >
                            {[
                              'INVOICE',
                              'TAX_INVOICE',
                              'DELIVERY_NOTE',
                              'BAST',
                              'QUOTATION',
                              'CONTRACT',
                              'SPECIFICATION',
                              'QC_REPORT',
                              'OTHER',
                            ].map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="sm:col-span-3">
                          <Input
                            value={u.description}
                            onChange={(e) =>
                              setPendingUploads((prev) =>
                                prev.map((x, idx) => (idx === i ? { ...x, description: e.target.value } : x))
                              )
                            }
                            placeholder="Attachment Detail..."
                          />
                        </div>
                        <div className="sm:col-span-2 flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewPending({
                                name: u.file.name,
                                url: URL.createObjectURL(u.file),
                                category: u.category,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Preview</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingUploads((prev) => prev.filter((_, idx) => idx !== i))}
                            className="rounded-lg border border-error-200 bg-error-50 p-1 text-error-600 hover:bg-error-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            doc && <AttachmentPanel publicId={doc.id} readOnly={doc.isDeleted} />
          )}
        </div>

        {/* Multi-Level Approval Sign-off Section (Searchable User Pickers for Prepared / Checked / Acknowledged / Approved / Received / Closed) */}
        <div className="space-y-6 lg:col-span-5">
          <Card
            title="Approval Sign-Off Matrix (6-Role Pejabat Pemeriksa)"
            desc="Pilih pejabat pemeriksa dan pemberi persetujuan berjenjang (Prepared, Checked, Acknowledged, Approved, Received, Closed) sesuai form asli."
          >
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="1. Prepared / Proposed By">
                <Input
                  disabled
                  value={form.preparedByName || doc?.ownerName || me?.displayName || 'System Administrator'}
                />
              </Field>

              <Field label="2. Checked By">
                {readOnly ? (
                  <Input disabled value={form.checkedByName} />
                ) : (
                  <LookupSelect
                    path="/users/lookup"
                    value={form.checkedByUserId}
                    initialLabel={form.checkedByName}
                    label={(r) => `${r.displayName}`}
                    onChange={(v, r) =>
                      setForm({ ...form, checkedByUserId: v, checkedByName: r?.displayName ?? form.checkedByName })
                    }
                  />
                )}
              </Field>

              <Field label="3. Acknowledged By">
                {readOnly ? (
                  <Input disabled value={form.acknowledgedByName} />
                ) : (
                  <LookupSelect
                    path="/users/lookup"
                    value={form.acknowledgedByUserId}
                    initialLabel={form.acknowledgedByName}
                    label={(r) => `${r.displayName}`}
                    onChange={(v, r) =>
                      setForm({
                        ...form,
                        acknowledgedByUserId: v,
                        acknowledgedByName: r?.displayName ?? form.acknowledgedByName,
                      })
                    }
                  />
                )}
              </Field>

              <Field label="4. Approved By">
                {readOnly ? (
                  <Input disabled value={form.approvedByName} />
                ) : (
                  <LookupSelect
                    path="/users/lookup"
                    value={form.approvedByUserId}
                    initialLabel={form.approvedByName}
                    label={(r) => `${r.displayName}`}
                    onChange={(v, r) =>
                      setForm({
                        ...form,
                        approvedByUserId: v,
                        approvedByName: r?.displayName ?? form.approvedByName,
                      })
                    }
                  />
                )}
              </Field>

              <Field label="5. Received By (Finance / Warehouse)">
                {readOnly ? (
                  <Input disabled value={form.receivedByName} />
                ) : (
                  <LookupSelect
                    path="/users/lookup"
                    value={form.receivedByUserId}
                    initialLabel={form.receivedByName}
                    label={(r) => `${r.displayName}`}
                    onChange={(v, r) =>
                      setForm({
                        ...form,
                        receivedByUserId: v,
                        receivedByName: r?.displayName ?? form.receivedByName,
                      })
                    }
                  />
                )}
              </Field>

              <Field label="6. Closed By (Treasury / Settlement)">
                {readOnly ? (
                  <Input disabled value={form.closedByName} />
                ) : (
                  <LookupSelect
                    path="/users/lookup"
                    value={form.closedByUserId}
                    initialLabel={form.closedByName}
                    label={(r) => `${r.displayName}`}
                    onChange={(v, r) =>
                      setForm({ ...form, closedByUserId: v, closedByName: r?.displayName ?? form.closedByName })
                    }
                  />
                )}
              </Field>
            </div>

            {/* Bottom Form Save & Submit Buttons */}
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

          {!isNew && doc && (
            <div className="print:hidden">
              <CommentPanel publicId={doc.id} />
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: Live Approval Decision Engine & Status Audit History */}
      {!isNew && doc && (
        <div className="space-y-6 print:space-y-3">
          <ApprovalPanel doc={doc} onDone={reload} />
          <div className="print:hidden">
            <StatusTimeline doc={doc} />
          </div>
        </div>
      )}

      {/* Modal for Pending File Inline Preview */}
      <Modal
        open={previewPending !== null}
        wide
        title={previewPending ? `Preview File — ${previewPending.name} (${previewPending.category})` : 'Preview File'}
        onClose={() => setPreviewPending(null)}
      >
        {previewPending && (
          <iframe
            src={previewPending.url}
            title={previewPending.name}
            className="h-[72vh] w-full rounded-xl border border-gray-200 bg-gray-100"
          />
        )}
      </Modal>
    </div >
    </>
  )
}
