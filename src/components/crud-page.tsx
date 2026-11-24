'use client'
import { useState } from 'react'
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { DataTable, type Column } from './data-table'
import { AutoForm, type FieldDef } from './form'
import { Button, ConfirmDeleteModal, ErrorText, Modal, PageHeader, Select } from './ui'
import { api, del, patch, post } from '@/lib/api'
import { useList } from '@/lib/use-list'
import { useMe } from '@/lib/me'

/**
 * Complete master-data page from config: TailAdmin server-side list (search/sort/paging), active filter,
 * deleted-data view, create/edit modal, soft delete + restore with ConfirmDeleteModal.
 */
export function CrudPage<T extends object>({
  title,
  subtitle,
  path,
  columns,
  fields,
  defaultSort,
  keyField = 'id',
  perms = { manage: 'MASTER.MANAGE', del: 'MASTER.DELETE', viewDeleted: 'MASTER.VIEW_DELETED' },
  softDelete = true,
  allowCreate = true,
  hasActive = true,
  extraFilters,
  toForm,
}: {
  title: string
  subtitle?: string
  path: string
  columns: Column<T>[]
  fields: FieldDef[]
  defaultSort: string
  keyField?: string
  perms?: { manage: string; del?: string; viewDeleted?: string }
  softDelete?: boolean
  allowCreate?: boolean
  hasActive?: boolean
  extraFilters?: Record<string, string | undefined>
  toForm?: (row: T) => Record<string, any>
}) {
  const me = useMe()
  const [active, setActive] = useState<string>('')
  const [deleted, setDeleted] = useState(false)
  const list = useList<T>(path, defaultSort, {
    isActive: active || undefined,
    deleted: deleted ? 'true' : undefined,
    ...extraFilters,
  })
  const [editing, setEditing] = useState<T | null | 'new'>(null)
  const [deleting, setDeleting] = useState<T | null>(null)
  const [delBusy, setDelBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const can = (p?: string) => !!p && !!me?.permissions.includes(p)
  const key = (r: T) => (r as any)[keyField]
  const labelOf = (r: T | null) =>
    r ? String((r as any).name ?? (r as any).code ?? (r as any).ipOrCidr ?? key(r)) : ''

  async function act(fn: () => Promise<unknown>) {
    setError(null)
    try {
      await fn()
      list.reload()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const actionCol: Column<T> = {
    key: '_actions',
    header: 'Actions',
    render: (r) => (
      <div className="flex items-center gap-1.5">
        {deleted ? (
          can(perms.del) && (
            <button
              type="button"
              onClick={() => act(() => post(`${path}/${key(r)}/restore`))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-success-200 bg-success-50 px-2.5 py-1.5 text-xs font-semibold text-success-700 hover:bg-success-100 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restore</span>
            </button>
          )
        ) : (
          <>
            {can(perms.manage) && (
              <button
                type="button"
                onClick={() => setEditing(r)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-100 transition-colors"
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
            )}
            {softDelete && can(perms.del) && (
              <button
                type="button"
                onClick={() => setDeleting(r)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-error-200 bg-error-50 px-2.5 py-1.5 text-xs font-semibold text-error-600 hover:bg-error-100 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            )}
          </>
        )}
      </div>
    ),
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle ?? `Kelola, cari, urutkan, dan perbarui data master ${title.toLowerCase()}.`}
        actions={
          allowCreate &&
          can(perms.manage) &&
          !deleted && (
            <Button onClick={() => setEditing('new')}>
              <Plus className="h-4 w-4" />
              <span>Add {title}</span>
            </Button>
          )
        }
      />
      <ErrorText error={error} />
      <DataTable
        list={list}
        columns={[...columns, actionCol]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {hasActive && (
              <Select
                value={active}
                onChange={(e) => {
                  setActive(e.target.value)
                  list.setPage(1)
                }}
                aria-label="Active filter"
                className="w-36"
              >
                <option value="">Semua Status</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </Select>
            )}
            {softDelete && can(perms.viewDeleted) && (
              <label className="inline-flex h-[38px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 shadow-theme-xs cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={deleted}
                  onChange={(e) => {
                    setDeleted(e.target.checked)
                    list.setPage(1)
                  }}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span>Trash / Deleted</span>
              </label>
            )}
          </div>
        }
      />

      {/* Create / Edit Modal */}
      <Modal
        open={editing !== null}
        title={editing === 'new' ? `Add New ${title}` : `Edit ${title}`}
        onClose={() => setEditing(null)}
      >
        <AutoForm
          fields={fields}
          editing={editing !== 'new'}
          initial={editing && editing !== 'new' ? (toForm ? toForm(editing) : (editing as any)) : { isActive: true }}
          onSubmit={async (v) => {
            if (editing === 'new') await post(path, v)
            else await patch(`${path}/${key(editing as T)}`, v)
            setEditing(null)
            list.reload()
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={deleting !== null}
        title={`Hapus ${title}`}
        itemName={labelOf(deleting)}
        busy={delBusy}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return
          setDelBusy(true)
          await act(() => del(`${path}/${key(deleting)}`))
          setDelBusy(false)
          setDeleting(null)
        }}
      />
    </div>
  )
}

export { api }
