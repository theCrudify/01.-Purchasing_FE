import type { NavItem } from './types'

/** Sidebar entries owned by the "procurement" group. */
export const nav: NavItem[] = [
  { href: '/purchasing/pr', label: 'Purchase Requests (PR)', section: 'Purchasing Documents' },
  { href: '/purchasing/rfq', label: 'Requests for Quotation (RFQ)', section: 'Purchasing Documents' },
  { href: '/purchasing/quotations', label: 'Vendor Quotations (QUO)', section: 'Purchasing Documents' },
  { href: '/purchasing/contracts', label: 'Purchase Contracts (CTR)', section: 'Purchasing Documents' },
  { href: '/purchasing/po', label: 'Purchase Orders (PO)', section: 'Purchasing Documents' },
  { href: '/purchasing/gr', label: 'Goods Receipts (GR)', section: 'Purchasing Documents' },
  { href: '/portal/quotations', label: 'My Quotations', section: 'Procurement', area: 'portal' },
  { href: '/portal/po', label: 'My Purchase Orders', section: 'Procurement', area: 'portal' },
  { href: '/portal/contracts', label: 'My Contracts', section: 'Procurement', area: 'portal' },
  { href: '/portal/receipts', label: 'Delivery & Receipts', section: 'Procurement', area: 'portal' },
]
