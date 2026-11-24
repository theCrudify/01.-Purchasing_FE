'use client'
import { usePathname } from 'next/navigation'

// The portal reuses internal pages; inside /portal, rewrite their internal links so BP users stay in the portal shell.
const PORTAL: Record<string, string> = {
  '/purchasing/quotations': '/portal/quotations',
  '/purchasing/rfq': '/portal/rfq',
  '/purchasing/contracts': '/portal/contracts',
  '/purchasing/po': '/portal/po',
  '/purchasing/gr': '/portal/receipts',
  '/finance/ap-invoices': '/portal/invoices',
}

export function toAreaHref(href: string, inPortal: boolean) {
  if (!inPortal) return href
  const k = Object.keys(PORTAL).find((p) => href === p || href.startsWith(p + '/'))
  return k ? PORTAL[k] + href.slice(k.length) : href
}

export function useAreaHref() {
  const inPortal = usePathname().startsWith('/portal')
  return (href: string) => toAreaHref(href, inPortal)
}
