'use client'
import { CrudPage } from '@/components/crud-page'

/** IP allow list for admin pages. Empty list = no restriction. */
export default function SecurityPage() {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">Admin pages (users, roles, audit, security) are only reachable from these addresses once at least one active entry exists. Add your own address first.</p>
      <CrudPage
        title="IP Allow List"
        path="/security/ip-allow-list"
        defaultSort="ipOrCidr:asc"
        softDelete={false}
        perms={{ manage: 'SECURITY.MANAGE' }}
        columns={[
          { key: 'ipOrCidr', header: 'IP / CIDR', sortable: true },
          { key: 'description', header: 'Description', sortable: true },
          { key: 'isActive', header: 'Active', sortable: true, render: (r: any) => (r.isActive ? 'Yes' : 'No') },
        ]}
        fields={[
          { name: 'ipOrCidr', label: 'IP address or CIDR', required: true, placeholder: '203.0.113.0/24' },
          { name: 'description', label: 'Description' },
          { name: 'isActive', label: 'Active', type: 'checkbox' },
        ]}
      />
    </div>
  )
}
