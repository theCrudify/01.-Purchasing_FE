/** perm: shown only when the user has it (any of, when array). area: internal app or BP portal. */
export type NavItem = { href: string; label: string; section: string; perm?: string | string[]; area?: 'internal' | 'portal' }
