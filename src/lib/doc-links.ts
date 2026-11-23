/** Where each document type lives in the UI (internal / portal). */
const INTERNAL: Record<string, string> = { PR: '/purchasing/pr', RFQ: '/purchasing/rfq', QUO: '/purchasing/quotations', CTR: '/purchasing/contracts', PO: '/purchasing/po', GR: '/purchasing/gr', SVR: '/vendors/verifications' }
const PORTAL: Record<string, string> = { QUO: '/portal/quotations', PO: '/portal/po', CTR: '/portal/contracts', GR: '/portal/receipts', SVR: '/portal/profile' }
export const docHref = (docType: string, id: string, portal = false) => `${(portal ? PORTAL : INTERNAL)[docType] ?? '/documents'}/${id}`
