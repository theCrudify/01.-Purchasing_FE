'use client'
import Link from 'next/link'
import { Shield } from 'lucide-react'
import { CrudPage } from '@/components/crud-page'
import { Badge } from '@/components/ui'

export default function RolesPage() {
  return (
    <CrudPage
      title="Roles & Permissions"
      subtitle="Kelola peran akses pengguna. Klik kode role untuk mengatur matriks hak akses (permissions) secara rinci."
      path="/roles"
      defaultSort="code:asc"
      perms={{ manage: 'ROLE.MANAGE', del: 'ROLE.MANAGE', viewDeleted: 'MASTER.VIEW_DELETED' }}
      columns={[
        {
          key: 'code',
          header: 'Kode Role',
          sortable: true,
          render: (r: any) => (
            <Link
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 font-mono text-xs font-bold text-brand-700 hover:bg-brand-100 transition-colors"
              href={`/admin/roles/${r.id}`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>{r.code}</span>
            </Link>
          ),
        },
        { key: 'name', header: 'Nama Role', sortable: true },
        { key: 'scope', header: 'Scope', sortable: true, render: (r: any) => <Badge value={r.scope} /> },
        { key: 'isActive', header: 'Status', render: (r: any) => (r.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'code', label: 'Kode Role', required: true, createOnly: true },
        { name: 'name', label: 'Nama Role', required: true },
        {
          name: 'scope',
          label: 'Scope Area',
          type: 'select',
          required: true,
          createOnly: true,
          options: [
            { value: 'INTERNAL', label: 'Internal Staff' },
            { value: 'BP', label: 'Vendor / Supplier Portal' },
          ],
        },
        { name: 'description', label: 'Keterangan', type: 'textarea' },
        { name: 'isActive', label: 'Active', type: 'checkbox' },
      ]}
    />
  )
}
