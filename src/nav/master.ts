import type { NavItem } from './types'

/** Sidebar entries owned by the "master" group. */
export const nav: NavItem[] = [
  { href: '/master/items', label: 'Items', section: 'Master Data', perm: 'MASTER.VIEW' },
  { href: '/master/categories', label: 'Categories', section: 'Master Data', perm: 'MASTER.VIEW' },
  { href: '/master/uoms', label: 'Units of Measure', section: 'Master Data', perm: 'MASTER.VIEW' },
  { href: '/master/purchase-classes', label: 'Purchase Classes', section: 'Master Data', perm: 'MASTER.VIEW' },
  { href: '/master/departments', label: 'Departments', section: 'Master Data', perm: 'MASTER.VIEW' },
  { href: '/master/payment-terms', label: 'Payment Terms', section: 'Master Data', perm: 'MASTER.VIEW' },
  { href: '/master/tax-codes', label: 'Tax Codes', section: 'Master Data', perm: 'MASTER.VIEW' },
  { href: '/master/banks', label: 'Banks', section: 'Master Data', perm: 'MASTER.VIEW' },
  { href: '/master/bp-document-types', label: 'BP Document Types', section: 'Master Data', perm: 'MASTER.VIEW' },
  { href: '/master/form-notes', label: 'Form Notes', section: 'Master Data', perm: 'MASTER.VIEW' },
  { href: '/master/budgets', label: 'Budgets', section: 'Purchasing Setup', perm: 'MASTER.VIEW' },
  { href: '/master/currencies', label: 'Currencies', section: 'Purchasing Setup', perm: 'MASTER.VIEW' },
  { href: '/master/exchange-rates', label: 'Exchange Rates', section: 'Purchasing Setup', perm: 'MASTER.VIEW' },
  { href: '/master/number-series', label: 'Number Series', section: 'Purchasing Setup', perm: 'SYS.NUMBER_SERIES_MANAGE' },
]
