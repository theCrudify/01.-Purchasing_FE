import type { NavItem } from './types'

/** Sidebar entries owned by the "workflow" group. */
export const nav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', section: 'Overview' },
  { href: '/approvals', label: 'My Approvals', section: 'Overview' },
  { href: '/notifications', label: 'Notifications', section: 'Overview' },
  { href: '/settings/approval-templates', label: 'Approval Templates', section: 'Workflow & Approval', perm: 'APPROVAL.CONFIG' },
  { href: '/settings/approver-mappings', label: 'Approver Mappings', section: 'Workflow & Approval', perm: 'APPROVAL.CONFIG' },
  { href: '/settings/delegations', label: 'Delegations & Backups', section: 'Workflow & Approval' },
  { href: '/settings/reassignments', label: 'Reassignments', section: 'Workflow & Approval' },
  { href: '/settings/handovers', label: 'User Handovers', section: 'Workflow & Approval', perm: 'HANDOVER.MANAGE' },
  { href: '/documents/deleted', label: 'Deleted Documents', section: 'Documents', perm: 'DOC.DELETE' },
]
