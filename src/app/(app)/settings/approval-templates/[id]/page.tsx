'use client'
import Link from 'next/link'
import { use, useEffect, useState } from 'react'
import { Badge, Button, Card, ErrorText, Field, Input, Modal, PageHeader, Select } from '@/components/ui'
import { api } from '@/lib/api'
import { useCan } from '@/lib/me'
import { LookupSelect } from '@/components/form'

type Step = {
  stepNo: number
  name: string
  stepCode: string | null
  approverType: string
  approverUserId: string | null
  approverUserName?: string | null
  approverRoleId: number | null
  approverRoleCode?: string | null
  picRole: string | null
  requiredApprovals: number
  isOptional: boolean
}

type Tpl = {
  id: number
  code: string
  name: string
  docType: string
  priority: number
  isActive: boolean
}

const APPROVER_TYPES = [
  { value: 'SUPERIOR', label: 'Direct Superior (from Employee hierarchy)' },
  { value: 'DEPARTMENT_HEAD', label: 'Department Head' },
  { value: 'ROLE', label: 'Specific Role' },
  { value: 'USER', label: 'Specific User' },
  { value: 'PREPARER_MAPPING', label: 'Preparer Mapping' },
  { value: 'PREPARER_MAPPING_PICK', label: 'Preparer Mapping (Pick from group)' },
  { value: 'REQUESTER_PICK', label: 'Requester Pick at Submit' },
  { value: 'BP_PIC', label: 'Business Partner PIC' },
]

export default function TemplateStepsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const can = useCan()
  const [tpl, setTpl] = useState<Tpl | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [editing, setEditing] = useState<{ index: number | null; step: Step } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const reload = () => {
    api<{ data: Tpl }>(`/approval-templates/${id}`).then((r) => setTpl(r.data)).catch((e) => setError(e.message))
    api<{ data: Step[] }>(`/approval-templates/${id}/steps`).then((r) => setSteps(r.data)).catch((e) => setError(e.message))
  }

  useEffect(() => { reload() }, [id])

  const move = (i: number, dir: -1 | 1) => {
    const next = [...steps]
    const target = i + dir
    if (target < 0 || target >= next.length) return
    const temp = next[i]
    next[i] = next[target]
    next[target] = temp
    setSteps(next.map((s, idx) => ({ ...s, stepNo: idx + 1 })))
  }

  const remove = (i: number) => {
    if (!confirm('Remove this step?')) return
    setSteps(steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, stepNo: idx + 1 })))
  }

  const saveAll = async () => {
    setError(null)
    setMsg(null)
    setSaving(true)
    try {
      const payload = {
        steps: steps.map((s) => ({
          name: s.name,
          stepCode: s.stepCode || null,
          approverType: s.approverType,
          approverUserId: s.approverType === 'USER' ? s.approverUserId : null,
          approverRoleId: s.approverType === 'ROLE' ? Number(s.approverRoleId) : null,
          picRole: s.approverType === 'BP_PIC' ? s.picRole : null,
          requiredApprovals: Number(s.requiredApprovals || 1),
          isOptional: Boolean(s.isOptional),
        })),
      }
      await api(`/approval-templates/${id}/steps`, { method: 'PUT', body: JSON.stringify(payload) })
      setMsg('Steps updated successfully.')
      reload()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const openNew = () => {
    setEditing({
      index: null,
      step: {
        stepNo: steps.length + 1,
        name: `Step ${steps.length + 1}`,
        stepCode: 'AP',
        approverType: 'SUPERIOR',
        approverUserId: null,
        approverRoleId: null,
        picRole: null,
        requiredApprovals: 1,
        isOptional: false,
      },
    })
  }

  const saveModal = () => {
    if (!editing) return
    if (!editing.step.name.trim()) {
      alert('Step name is required')
      return
    }
    const next = [...steps]
    if (editing.index === null) {
      next.push({ ...editing.step, stepNo: next.length + 1 })
    } else {
      next[editing.index] = { ...editing.step }
    }
    setSteps(next.map((s, idx) => ({ ...s, stepNo: idx + 1 })))
    setEditing(null)
  }

  const manage = can('APPROVAL.CONFIG')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/settings/approval-templates" className="hover:underline">
          Approval Templates
        </Link>
        <span>/</span>
        <span className="font-semibold text-gray-900">{tpl?.code ?? id}</span>
      </div>

      <PageHeader
        title={tpl ? `${tpl.code} — ${tpl.name} (${tpl.docType})` : 'Approval Template Steps'}
        actions={
          manage && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={openNew}>
                Add Step
              </Button>
              <Button onClick={saveAll} disabled={saving}>
                {saving ? 'Saving…' : 'Save Steps'}
              </Button>
            </div>
          )
        }
      />

      {msg && <p className="text-sm text-green-700">{msg}</p>}
      <ErrorText error={error} />

      <Card title="Workflow Approval Steps">
        {!steps.length ? (
          <p className="py-6 text-center text-sm text-gray-500">
            No steps defined. Click "Add Step" to configure the approval sequence.
          </p>
        ) : (
          <div className="divide-y">
            {steps.map((s, i) => (
              <div key={i} className="flex flex-wrap items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">
                    {s.stepNo}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{s.name}</span>
                      {s.stepCode && <Badge value={s.stepCode} />}
                      {s.isOptional && <Badge value="OPTIONAL" />}
                    </div>
                    <p className="text-xs text-gray-500">
                      Type: <span className="font-medium text-gray-700">{s.approverType}</span>
                      {s.approverType === 'USER' && s.approverUserName && ` (${s.approverUserName})`}
                      {s.approverType === 'ROLE' && s.approverRoleCode && ` (${s.approverRoleCode})`}
                      {s.approverType === 'BP_PIC' && s.picRole && ` (${s.picRole})`}
                      {' • '}
                      Requires: {s.requiredApprovals} approval(s)
                    </p>
                  </div>
                </div>

                {manage && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move Up">
                      ↑
                    </Button>
                    <Button variant="ghost" disabled={i === steps.length - 1} onClick={() => move(i, 1)} aria-label="Move Down">
                      ↓
                    </Button>
                    <Button variant="ghost" onClick={() => setEditing({ index: i, step: { ...s } })}>
                      Edit
                    </Button>
                    <Button variant="ghost" className="text-red-600" onClick={() => remove(i)}>
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={editing !== null}
        title={editing?.index === null ? 'Add Approval Step' : `Edit Step ${editing?.step.stepNo}`}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              saveModal()
            }}
            className="space-y-3"
          >
            <Field label="Step Name" required>
              <Input
                value={editing.step.name}
                onChange={(e) => setEditing({ ...editing, step: { ...editing.step, name: e.target.value } })}
                required
              />
            </Field>

            <Field label="Step Code">
              <Select
                value={editing.step.stepCode ?? ''}
                onChange={(e) => setEditing({ ...editing, step: { ...editing.step, stepCode: e.target.value || null } })}
              >
                <option value="">(None)</option>
                <option value="CH">Check (CH)</option>
                <option value="AC">Acknowledge (AC)</option>
                <option value="AP">Approve (AP)</option>
                <option value="RE">Review (RE)</option>
                <option value="CL">Close / Settle (CL)</option>
              </Select>
            </Field>

            <Field label="Approver Type" required>
              <Select
                value={editing.step.approverType}
                onChange={(e) => setEditing({ ...editing, step: { ...editing.step, approverType: e.target.value } })}
              >
                {APPROVER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>

            {editing.step.approverType === 'USER' && (
              <Field label="Specific User" required>
                <LookupSelect
                  path="/user-lookup"
                  params={{ userType: 'INTERNAL' }}
                  value={editing.step.approverUserId}
                  initialLabel={editing.step.approverUserName ?? undefined}
                  label={(r) => `${r.displayName} <${r.email}>`}
                  onChange={(v, r) =>
                    setEditing({
                      ...editing,
                      step: {
                        ...editing.step,
                        approverUserId: v,
                        approverUserName: r?.displayName,
                      },
                    })
                  }
                />
              </Field>
            )}

            {editing.step.approverType === 'ROLE' && (
              <Field label="Specific Role" required>
                <LookupSelect
                  path="/roles"
                  value={editing.step.approverRoleId}
                  initialLabel={editing.step.approverRoleCode ?? undefined}
                  label={(r) => `${r.code} — ${r.name}`}
                  onChange={(v, r) =>
                    setEditing({
                      ...editing,
                      step: {
                        ...editing.step,
                        approverRoleId: v,
                        approverRoleCode: r?.code,
                      },
                    })
                  }
                />
              </Field>
            )}

            {editing.step.approverType === 'BP_PIC' && (
              <Field label="BP PIC Role" required>
                <Select
                  value={editing.step.picRole ?? ''}
                  onChange={(e) => setEditing({ ...editing, step: { ...editing.step, picRole: e.target.value || null } })}
                >
                  <option value="BUYER">BUYER</option>
                  <option value="INVOICE_RECEIVER">INVOICE_RECEIVER</option>
                  <option value="ACCOUNT_MANAGER">ACCOUNT_MANAGER</option>
                </Select>
              </Field>
            )}

            <Field label="Required Approvals">
              <Input
                type="number"
                min="1"
                max="10"
                value={editing.step.requiredApprovals}
                onChange={(e) =>
                  setEditing({ ...editing, step: { ...editing.step, requiredApprovals: Number(e.target.value) || 1 } })
                }
              />
            </Field>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={editing.step.isOptional}
                onChange={(e) => setEditing({ ...editing, step: { ...editing.step, isOptional: e.target.checked } })}
              />
              Optional step (skip if no approver found)
            </label>

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit">Apply Step</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
