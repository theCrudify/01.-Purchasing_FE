import type { NavItem } from './types'

/** Sidebar entries owned by the "identity" group. */
export const nav: NavItem[] = [
  { href: '/admin/users', label: 'Users', section: 'Administration', perm: 'USER.VIEW' },
  { href: '/admin/roles', label: 'Roles & Permissions', section: 'Administration', perm: ['USER.VIEW', 'ROLE.MANAGE'] },
  { href: '/admin/employees', label: 'Employees', section: 'Administration', perm: ['MASTER.VIEW', 'USER.VIEW'] },
  { href: '/admin/cost-centers', label: 'Cost Centers', section: 'Administration', perm: 'MASTER.VIEW' },
  { href: '/admin/audit', label: 'Audit Trail', section: 'Administration', perm: 'AUDIT.VIEW' },
  { href: '/admin/security', label: 'IP Allow List', section: 'Administration', perm: 'SECURITY.MANAGE' },
  { href: '/profile', label: 'My Profile', section: 'Account' },
  { href: '/portal/profile', label: 'My Profile', section: 'Account', area: 'portal' },
]
