'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { ArrowLeft, Building2, CheckCircle2, Edit3, Save } from 'lucide-react'
import { LookupSelect } from '@/components/form'
import { Badge, Button, Card, ErrorText, Field, Input, PageHeader, Select } from '@/components/ui'
import { api, patch, post } from '@/lib/api'

export function VendorFormWorkbench({ vendorId }: { vendorId?: string }) {
  const router = useRouter()
  const isNew = !vendorId
  const [editMode, setEditMode] = useState(isNew)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({
    bpCode: '',
    entityType: 'COMPANY',
    legalName: '',
    tradeName: '',
    taxId: '',
    businessRegNo: '',
    isVatRegistered: true,
    isSupplier: true,
    isCustomer: false,
    email: '',
    phone: '',
    defaultCurrencyCode: 'IDR',
    paymentTermId: null as number | null,
    onboardingStatus: 'APPROVED',
    operationalStatus: 'ACTIVE',
  })

  useEffect(() => {
    if (!vendorId) return
    api<{ data: any }>(`/vendors/${vendorId}`)
      .then((r) => {
        const d = r.data
        setForm({
          bpCode: d.bpCode ?? '',
          entityType: d.entityType ?? 'COMPANY',
          legalName: d.legalName ?? '',
          tradeName: d.tradeName ?? '',
          taxId: d.taxId ?? '',
          businessRegNo: d.businessRegNo ?? '',
          isVatRegistered: d.isVatRegistered ?? true,
          isSupplier: d.isSupplier ?? true,
          isCustomer: d.isCustomer ?? false,
          email: d.email ?? '',
          phone: d.phone ?? '',
          defaultCurrencyCode: d.defaultCurrencyCode ?? 'IDR',
          paymentTermId: d.paymentTermId ?? null,
          onboardingStatus: d.onboardingStatus ?? 'APPROVED',
          operationalStatus: d.operationalStatus ?? 'ACTIVE',
        })
        setEditMode(false)
      })
      .catch((e) => setError(e.message))
  }, [vendorId])

  const readOnly = !editMode

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setBusy(true)
    try {
      if (isNew) {
        const res = await post<{ data: { id: string } }>('/vendors', {
          ...form,
          bpCode: form.bpCode || null,
          tradeName: form.tradeName || null,
          taxId: form.taxId || null,
          businessRegNo: form.businessRegNo || null,
          email: form.email || null,
          phone: form.phone || null,
        })
        router.push(`/vendors/${res.data.id}`)
      } else {
        await patch(`/vendors/${vendorId}`, {
          legalName: form.legalName,
          tradeName: form.tradeName || null,
          taxId: form.taxId || null,
          businessRegNo: form.businessRegNo || null,
          email: form.email || null,
          phone: form.phone || null,
          defaultCurrencyCode: form.defaultCurrencyCode,
          paymentTermId: form.paymentTermId,
          operationalStatus: form.operationalStatus,
        })
        setSuccess('Vendor profile updated successfully.')
        setEditMode(false)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={isNew ? 'Add New Vendor / Business Partner' : `Vendor Profile — ${form.legalName || form.bpCode}`}
        subtitle="Complete supplier & customer master profile with Legal Name, NPWP, NIB, PKP status, Payment Term, and Operational Status."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/vendors">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Vendors</span>
              </Button>
            </Link>
            {!isNew && !editMode && (
              <Button onClick={() => setEditMode(true)}>
                <Edit3 className="h-4 w-4" />
                <span>Edit Vendor Profile</span>
              </Button>
            )}
          </div>
        }
      />

      <ErrorText error={error} />
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={save} className="space-y-6">
        <Card
          title="1. Corporate Identity & Legal Registration"
          desc="Informasi badan hukum, kode rekanan, NPWP, dan Nomor Induk Berusaha (NIB)."
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Vendor / BP Code (Auto if blank)">
              <Input
                disabled={!isNew || readOnly}
                value={form.bpCode}
                onChange={(e) => setForm({ ...form, bpCode: e.target.value.toUpperCase() })}
                placeholder="e.g. VND-004"
              />
            </Field>

            <Field label="Entity Type" required>
              <Select
                disabled={!isNew || readOnly}
                value={form.entityType}
                onChange={(e) => setForm({ ...form, entityType: e.target.value })}
              >
                <option value="COMPANY">COMPANY (PT / CV / Corporate)</option>
                <option value="INDIVIDUAL">INDIVIDUAL (Perorangan)</option>
                <option value="GOVERNMENT">GOVERNMENT / BUMN</option>
              </Select>
            </Field>

            <Field label="Legal Company Name" required>
              <Input
                required
                disabled={readOnly}
                value={form.legalName}
                onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                placeholder="e.g. PT Kimia Industri Nusantara"
              />
            </Field>

            <Field label="Trade / Brand Name">
              <Input
                disabled={readOnly}
                value={form.tradeName}
                onChange={(e) => setForm({ ...form, tradeName: e.target.value })}
                placeholder="e.g. Kimia Nusantara"
              />
            </Field>

            <Field label="Tax ID (NPWP)" required>
              <Input
                disabled={readOnly}
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                placeholder="01.234.567.8-091.000"
              />
            </Field>

            <Field label="Business Registration No. (NIB / SIUP)">
              <Input
                disabled={readOnly}
                value={form.businessRegNo}
                onChange={(e) => setForm({ ...form, businessRegNo: e.target.value })}
                placeholder="NIB-9120301122"
              />
            </Field>
          </div>
        </Card>

        <Card
          title="2. Contact, Commercial Terms & Operational Status"
          desc="Pengaturan mata uang default, termin pembayaran, email korespondensi, dan status aktif transaksi."
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Primary Email" required>
              <Input
                type="email"
                disabled={readOnly}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="procurement@vendor.co.id"
              />
            </Field>

            <Field label="Phone / Mobile Number">
              <Input
                disabled={readOnly}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+62 21 555 0192"
              />
            </Field>

            <Field label="Default Currency">
              <Select
                disabled={readOnly}
                value={form.defaultCurrencyCode}
                onChange={(e) => setForm({ ...form, defaultCurrencyCode: e.target.value })}
              >
                {['IDR', 'USD', 'JPY', 'EUR', 'SGD'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Default Payment Term">
              {readOnly ? (
                <Input disabled value={form.paymentTermId ? `Payment Term #${form.paymentTermId}` : 'NET30'} />
              ) : (
                <LookupSelect
                  path="/payment-terms"
                  params={{ isActive: 'true' }}
                  value={form.paymentTermId}
                  label={(r) => `${r.code} — ${r.name}`}
                  onChange={(v) => setForm({ ...form, paymentTermId: v })}
                />
              )}
            </Field>

            <Field label="Operational Status">
              <Select
                disabled={readOnly}
                value={form.operationalStatus}
                onChange={(e) => setForm({ ...form, operationalStatus: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE (Ready for Purchasing & Invoicing)</option>
                <option value="ON_HOLD">ON_HOLD (Temporary Hold)</option>
                <option value="BLACKLISTED">BLACKLISTED</option>
                <option value="INACTIVE">INACTIVE</option>
              </Select>
            </Field>

            <Field label="Onboarding Verification Status">
              <div className="pt-2">
                <Badge value={form.onboardingStatus} />
              </div>
            </Field>
          </div>

          {editMode && (
            <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
              {!isNew && (
                <Button variant="secondary" onClick={() => setEditMode(false)}>
                  Cancel Edit
                </Button>
              )}
              <Button type="submit" disabled={busy}>
                <Save className="h-4 w-4" />
                <span>{busy ? 'Saving…' : isNew ? 'Register Vendor' : 'Save Vendor Changes'}</span>
              </Button>
            </div>
          )}
        </Card>
      </form>
    </div>
  )
}

export default function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <VendorFormWorkbench vendorId={id} />
}
