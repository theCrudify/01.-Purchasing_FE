'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Eye, UserPlus } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { AutoForm } from '@/components/form'
import { Badge, Button, Modal, PageHeader, Select, fmtDateTime } from '@/components/ui'
import { post } from '@/lib/api'
import { useCan } from '@/lib/me'
import { useList } from '@/lib/use-list'

type U = {
  id: string
  email: string
  displayName: string
  userType: string
  status: string
  roles: string | null
  departmentName: string | null
  lastLoginAt: string | null
}

export default function UsersPage() {
  const can = useCan()
  const [userType, setUserType] = useState('')
  const [status, setStatus] = useState('')
  const list = useList<U>('/users', 'displayName:asc', {
    userType: userType || undefined,
    status: status || undefined,
  })
  const [open, setOpen] = useState(false)

  return (
    <div>
      <PageHeader
        title="Manajemen Pengguna (Users)"
        subtitle="Kelola akun staf internal maupun akun portal rekanan (Business Partner), peran, dan sesi login."
        actions={
          can('USER.MANAGE') && (
            <Button onClick={() => setOpen(true)}>
              <UserPlus className="h-4 w-4" />
              <span>Invite User</span>
            </Button>
          )
        }
      />

      <DataTable
        list={list}
        columns={[
          {
            key: 'displayName',
            header: 'Pengguna',
            sortable: true,
            render: (r) => {
              const initials = r.displayName
                ? r.displayName
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'U'
              return (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600 border border-brand-200">
                    {initials}
                  </div>
                  <div>
                    <Link
                      className="font-semibold text-gray-900 hover:text-brand-600 hover:underline"
                      href={`/admin/users/${r.id}`}
                    >
                      {r.displayName}
                    </Link>
                    <div className="text-xs text-gray-500">{r.email}</div>
                  </div>
                </div>
              )
            },
          },
          { key: 'userType', header: 'Tipe', sortable: true, render: (r) => <Badge value={r.userType} /> },
          {
            key: 'departmentName',
            header: 'Departemen',
            render: (r) =>
              r.departmentName ? (
                <span className="font-medium text-gray-800">{r.departmentName}</span>
              ) : (
                <span className="text-gray-400">—</span>
              ),
          },
          {
            key: 'roles',
            header: 'Roles',
            render: (r) =>
              r.roles ? (
                <div className="flex flex-wrap gap-1">
                  {r.roles.split(',').map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-700"
                    >
                      {role.trim()}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400">—</span>
              ),
          },
          { key: 'status', header: 'Status', sortable: true, render: (r) => <Badge value={r.status} /> },
          {
            key: 'lastLoginAt',
            header: 'Login Terakhir',
            sortable: true,
            render: (r) =>
              r.lastLoginAt ? (
                <span className="text-xs text-gray-600">{fmtDateTime(r.lastLoginAt)}</span>
              ) : (
                <span className="text-xs text-gray-400">Belum pernah</span>
              ),
          },
          {
            key: '_a',
            header: 'Aksi',
            render: (r) => (
              <Link
                href={`/admin/users/${r.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-100 transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Detail</span>
              </Link>
            ),
          },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Select
              className="h-[40px] w-36"
              aria-label="User type"
              value={userType}
              onChange={(e) => {
                setUserType(e.target.value)
                list.setPage(1)
              }}
            >
              <option value="">Semua Tipe</option>
              <option value="INTERNAL">INTERNAL</option>
              <option value="BP">BP (Vendor)</option>
            </Select>
            <Select
              className="h-[40px] w-44"
              aria-label="Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                list.setPage(1)
              }}
            >
              <option value="">Semua Status</option>
              {['ACTIVE', 'PENDING_ACTIVATION', 'LOCKED', 'DISABLED'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </div>
        }
      />

      <Modal open={open} title="Undang Pengguna Internal Baru" onClose={() => setOpen(false)}>
        <p className="mb-4 rounded-xl border border-brand-100 bg-brand-50/50 p-3 text-xs text-gray-600">
          Pengguna akan menerima email berisi kode aktivasi untuk mengatur kata sandi mereka sendiri.
        </p>
        <AutoForm
          fields={[
            { name: 'email', label: 'Alamat Email Kerja', type: 'email', required: true },
            { name: 'displayName', label: 'Nama Lengkap', required: true },
            { name: 'phone', label: 'Nomor Telepon / HP' },
          ]}
          onSubmit={async (v) => {
            await post('/users', v)
            setOpen(false)
            list.reload()
          }}
          submitLabel="Kirim Undangan"
        />
      </Modal>
    </div>
  )
}
