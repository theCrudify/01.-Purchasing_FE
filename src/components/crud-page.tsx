'use client'
import { useState } from 'react'
import { DataTable, type Column } from './data-table'
import { AutoForm, type FieldDef } from './form'
import { Button, Modal, PageHeader, Select, ErrorText } from './ui'
import { api, del, patch, post } from '@/lib/api'
import { useList } from '@/lib/use-list'
import { useMe } from '@/lib/me'

/**
 * Complete master-data page from config: server-side list (search/sort/paging), active filter,
 * deleted-data view, create/edit modal, soft delete + restore. Buttons follow the user's permissions.
 */
export function CrudPage<T extends object>({ title, path, columns, fields, defaultSort, keyField = 'id', perms = { manage: 'MASTER.MANAGE', del: 'MASTER.DELETE', viewDeleted: 'MASTER.VIEW_DELETED' }, softDelete = true, allowCreate = true, hasActive = true, extraFilters, toForm }: {
  title: string; path: string; columns: Column<T>[]; fields: FieldDef[]; defaultSort: string; keyField?: string
  perms?: { manage: string; del?: string; viewDeleted?: string }; softDelete?: boolean
  allowCreate?: boolean; hasActive?: boolean
  extraFilters?: Record<string, string | undefined>
  /** map a row to initial form values when the API shape differs */
  toForm?: (row: T) => Record<string, any>
}) {
  const me = useMe()
  const [active, setActive] = useState<string>('')
  const [deleted, setDeleted] = useState(false)
  const list = useList<T>(path, defaultSort, { isActive: active || undefined, deleted: deleted ? 'true' : undefined, ...extraFilters })
  const [editing, setEditing] = useState<T | null | 'new'>(null)
  const [error, setError] = useState<string | null>(null)
  const can = (p?: string) => !!p && !!me?.permissions.includes(p)
  const key = (r: T) => (r as any)[keyField]

  async function act(fn: () => Promise<unknown>) { setError(null); try { await fn(); list.reload() } catch (e) { setError((e as Error).message) } }

  const actionCol: Column<T> = {
    key: '_actions', header: '', render: (r) => (
      <div className="flex justify-end gap-1">
        {deleted
          ? can(perms.del) && <Button variant="secondary" onClick={() => act(() => post(`${path}/${key(r)}/restore`))}>Restore</Button>
          : <>
              {can(perms.manage) && <Button variant="ghost" onClick={() => setEditing(r)}>Edit</Button>}
              {softDelete && can(perms.del) && <Button variant="ghost" className="text-red-600" onClick={() => confirm('Delete this record?') && act(() => del(`${path}/${key(r)}`))}>Delete</Button>}
            </>}
      </div>
    ),
  }

  return (
    <div>
      <PageHeader title={title} actions={allowCreate && can(perms.manage) && !deleted && <Button onClick={() => setEditing('new')}>Add</Button>} />
      <ErrorText error={error} />
      <DataTable list={list} columns={[...columns, actionCol]} actions={
        <div className="flex items-center gap-2">
          {hasActive && <Select value={active} onChange={(e) => { setActive(e.target.value); list.setPage(1) }} aria-label="Active filter" className="w-32">
            <option value="">All</option><option value="true">Active</option><option value="false">Inactive</option>
          </Select>}
          {softDelete && can(perms.viewDeleted) && (
            <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={deleted} onChange={(e) => { setDeleted(e.target.checked); list.setPage(1) }} /> Deleted</label>
          )}
        </div>
      } />
      <Modal open={editing !== null} title={editing === 'new' ? `New ${title}` : `Edit ${title}`} onClose={() => setEditing(null)}>
        <AutoForm
          fields={fields}
          editing={editing !== 'new'}
          initial={editing && editing !== 'new' ? (toForm ? toForm(editing) : (editing as any)) : { isActive: true }}
          onSubmit={async (v) => {
            if (editing === 'new') await post(path, v)
            else await patch(`${path}/${key(editing as T)}`, v)
            setEditing(null); list.reload()
          }}
        />
      </Modal>
    </div>
  )
}

export { api }
