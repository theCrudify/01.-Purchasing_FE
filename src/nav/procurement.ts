import type { NavItem } from './types'

/** Sidebar entries owned by the "procurement" & "finance" groups. */
export const nav: NavItem[] = [
  // Internal Purchasing Documents
  { section: 'Purchasing Documents', label: 'Purchase Request (PR)', href: '/purchasing/pr' },
  { section: 'Purchasing Documents', label: 'PR Raw Material', href: '/purchasing/pr-raw-material' },
  { section: 'Purchasing Documents', label: 'Request for Quotation (RFQ)', href: '/purchasing/rfq' },
  { section: 'Purchasing Documents', label: 'Vendor Quotations (QUO)', href: '/purchasing/quotations' },
  { section: 'Purchasing Documents', label: 'Purchase Contracts (CTR)', href: '/purchasing/contracts' },
  { section: 'Purchasing Documents', label: 'Purchase Orders (PO)', href: '/purchasing/po' },
  { section: 'Purchasing Documents', label: 'Goods Receipts (GR)', href: '/purchasing/gr' },

  // Cash Advance, Reimbursement & Settlement
  { section: 'Cash Advance & Reimbursement', label: 'Cash Advance (CA)', href: '/finance/cash-advances' },
  { section: 'Cash Advance & Reimbursement', label: 'Settlement (STL)', href: '/finance/settlements' },
  { section: 'Cash Advance & Reimbursement', label: 'Reimbursement (RMB)', href: '/finance/reimbursements' },

  // AP / AR Invoices & Outgoing Payments
  { section: 'Invoicing & Outgoing Payment', label: 'AP Invoice (INV)', href: '/finance/ap-invoices' },
  { section: 'Invoicing & Outgoing Payment', label: 'OP AP Invoice (OPAP)', href: '/finance/outgoing-ap' },
  { section: 'Invoicing & Outgoing Payment', label: 'Outgoing Cash Advance (OPCA)', href: '/finance/outgoing-ca' },
  { section: 'Invoicing & Outgoing Payment', label: 'Outgoing Reimbursement', href: '/finance/outgoing-reimbursement' },
  { section: 'Invoicing & Outgoing Payment', label: 'AR Invoice (ARI)', href: '/finance/ar-invoices' },

  // Supplier Portal Documents
  { section: 'Procurement', label: 'My Quotations', href: '/portal/quotations', area: 'portal' },
  { section: 'Procurement', label: 'Purchase Orders', href: '/portal/po', area: 'portal' },
  { section: 'Procurement', label: 'Contracts', href: '/portal/contracts', area: 'portal' },
  { section: 'Procurement', label: 'Goods Receipts', href: '/portal/receipts', area: 'portal' },
  { section: 'Procurement', label: 'AP Invoices', href: '/portal/invoices', area: 'portal' },
]
