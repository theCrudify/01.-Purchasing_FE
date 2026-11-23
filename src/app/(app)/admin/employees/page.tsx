'use client'
import { useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { AutoForm, type FieldDef } from '@/components/form'
import { Button, Modal, PageHeader, fmtDate } from '@/components/ui'
import { patch, post } from '@/lib/api'
import { useCan } from '@/lib/me'
import { useList } from '@/lib/use-list'

type E = {
  id: string
  displayName: string
  email: string
  employeeNo: string
  departmentId: number
  departmentName: string
  jobTitle: string | null
  superiorId: string | null
  superiorName: string | null
  joinDate: string | null
  endDate: string | null
  endReason: string | null
  isActive: boolean
}

const userLookup = {
  path: '/user-lookup',
  label: (r: any) => `${r.displayName} <${r.email}>`,
  params: { userType: 'INTERNAL' },
}

const fields: FieldDef[] = [
  { name: 'userId', label: 'Akun Pengguna (User)', type: 'lookup', required: true, createOnly: true, lookup: userLookup },
  { name: 'employeeNo', label: 'Nomor Induk Karyawan (NIK)', required: true },
  {
    name: 'departmentId',
    label: 'Departemen',
    type: 'lookup',
    required: true,
    lookup: { path: '/departments', label: (r) => `${r.code} — ${r.name}`, params: { isActive: 'true' } },
  },
  { name: 'jobTitle', label: 'Jabatan (Job Title)' },
  { name: 'superiorId', label: 'Atasan Langsung (Superior Approval Chain)', type: 'lookup', lookup: userLookup },
  { name: 'joinDate', label: 'Tanggal Bergabung', type: 'date' },
  { name: 'endDate', label: 'Tanggal Berakhir', type: 'date' },
  {
    name: 'endReason',
    label: 'Alasan Berakhir',
    type: 'select',
    options: ['RESIGNED', 'TERMINATED', 'RETIRED', 'TRANSFERRED', 'DECEASED'].map((v) => ({ value: v, label: v })),
  },
  { name: 'isActive', label: 'Active', type: 'checkbox' },
]

export default function EmployeesPage() {
  const can = useCan()
  const list = useList<E>('/employees', 'displayName:asc')
  const [editing, setEditing] = useState<E | 'new' | null>(null)

  return (
    <div>
      <PageHeader
        title="Data Karyawan & Hierarki Atasan (Employees)"
        subtitle="Kelola NIK karyawan, penempatan departemen, jabatan, serta garis atasan langsung (superior) untuk alur approval."
        actions={
          can('USER.MANAGE') && (
            <Button onClick={() => setEditing('new')}>
              <Plus className="h-4 w-4" />
              <span>Add Employee</span>
            </Button>
          )
        }
      />
      <DataTable
        list={list}
        columns={[
          {
            key: 'employeeNo',
            header: 'NIK',
            sortable: true,
            render: (r) => (
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-gray-800">
                {r.employeeNo}
              </span>
            ),
          },
          {
            key: 'displayName',
            header: 'Karyawan',
            sortable: true,
            render: (r) => (
              <div>
                <div className="font-semibold text-gray-900">{r.displayName}</div>
                <div className="text-xs text-gray-500">{r.email}</div>
              </div>
            ),
          },
          { key: 'departmentName', header: 'Departemen', sortable: true },
          { key: 'jobTitle', header: 'Jabatan' },
          {
            key: 'superiorName',
            header: 'Atasan Langsung',
            render: (r) =>
              r.superiorName ? (
                <span className="inline-flex items-center rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                  {r.superiorName}
                </span>
              ) : (
                <span className="text-gray-400">—</span>
              ),
          },
          { key: 'joinDate', header: 'Bergabung', sortable: true, render: (r) => fmtDate(r.joinDate) },
          { key: 'isActive', header: 'Status', sortable: true, render: (r) => (r.isActive ? 'Yes' : 'No') },
          {
            key: '_a',
            header: 'Aksi',
            render: (r) =>
              can('USER.MANAGE') && (
                <button
                  type="button"
                  onClick={() => setEditing(r)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-100 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
              ),
          },
        ]}
      />
      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Tambah Data Karyawan' : 'Edit Data Karyawan'}
        onClose={() => setEditing(null)}
      >
        <AutoForm
          fields={fields}
          editing={editing !== 'new'}
          initial={editing && editing !== 'new' ? editing : { isActive: true }}
          onSubmit={async (v) => {
            if (editing === 'new') await post('/employees', v)
            else await patch(`/employees/${(editing as E).id}`, v)
            setEditing(null)
            list.reload()
          }}
        />
      </Modal>
    </div>
  )
}
