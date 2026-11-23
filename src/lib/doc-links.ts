/** Where each document type lives in the UI (internal / portal). Routes to the unified document detail viewer. */
export const docHref = (_docType: string, id: string, portal = false) =>
  portal ? `/portal/documents/${id}` : `/documents/${id}`
