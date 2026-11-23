'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CreditCard,
  Edit3,
  MapPin,
  Plus,
  Save,
  Trash2,
  Users,
} from 'lucide-react'
import { LookupSelect } from '@/components/form'
import { Badge, Button, Card, ErrorText, Field, Input, PageHeader, Select } from '@/components/ui'
import { api, patch, post } from '@/lib/api'

type BpAddress = {
  addressType: 'HEAD' | 'BILLING' | 'SHIPPING' | 'BRANCH'
  line1: string
  line2: string
  city: string
  province: string
  postalCode: string
  countryCode: string
  isPrimary: boolean
}

type BpContact = {
  name: string
  position: string
  email: string
  phone: string
  isPrimary: boolean
}

type BpBankAccount = {
  bankId: number
  bankCode?: string
  bankName?: string
  swiftCode?: string
  accountNo: string
  accountHolderName: string
  branchName: string
  currencyCode: string
  iban: string
  beneficiaryCountry: string
  beneficiaryCity: string
  beneficiaryAddress: string
  bankAddress: string
  citizenship: string
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
  isPrimary: boolean
}

export function VendorFormWorkbench({ vendorId }: { vendorId?: string }) {
  const router = useRouter()
  const isNew = !vendorId
  const [editMode, setEditMode] = useState(isNew)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [banks, setBanks] = useState<{ id: number; code: string; name: string; swiftCode: string }[]>([])

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

  const emptyAddress = (): BpAddress => ({
    addressType: 'HEAD',
    line1: '',
    line2: '',
    city: 'Bekasi',
    province: 'Jawa Barat',
    postalCode: '17530',
    countryCode: 'ID',
    isPrimary: true,
  })

  const emptyContact = (): BpContact => ({
    name: '',
    position: 'Key Account & Finance Manager',
    email: '',
    phone: '',
    isPrimary: true,
  })

  const emptyBank = (): BpBankAccount => ({
    bankId: 1,
    bankCode: 'MUFG',
    bankName: 'MUFG Bank, Ltd. — Jakarta Branch',
    swiftCode: 'BOTKIDJX',
    accountNo: '',
    accountHolderName: '',
    branchName: 'KCU Jakarta MidPlaza',
    currencyCode: 'IDR',
    iban: '',
    beneficiaryCountry: 'ID',
    beneficiaryCity: 'Bekasi',
    beneficiaryAddress: '',
    bankAddress: 'Jl. Jend. Sudirman Kav. 10-11, Jakarta Pusat',
    citizenship: 'RESIDENT',
    verificationStatus: 'VERIFIED',
    isPrimary: true,
  })

  const [addresses, setAddresses] = useState<BpAddress[]>([emptyAddress()])
  const [contacts, setContacts] = useState<BpContact[]>([emptyContact()])
  const [bankAccounts, setBankAccounts] = useState<BpBankAccount[]>([emptyBank()])

  useEffect(() => {
    api<{ data: { id: number; code: string; name: string; swiftCode: string }[] }>('/banks?pageSize=50')
      .then((r) => setBanks(r.data ?? []))
      .catch(() => {})
  }, [])

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
        if (Array.isArray(d.addresses) && d.addresses.length > 0) {
          setAddresses(
            d.addresses.map((a: any) => ({
              addressType: a.addressType ?? 'HEAD',
              line1: a.line1 ?? '',
              line2: a.line2 ?? '',
              city: a.city ?? '',
              province: a.province ?? '',
              postalCode: a.postalCode ?? '',
              countryCode: a.countryCode ?? 'ID',
              isPrimary: !!a.isPrimary,
            }))
          )
        }
        if (Array.isArray(d.contacts) && d.contacts.length > 0) {
          setContacts(
            d.contacts.map((c: any) => ({
              name: c.name ?? '',
              position: c.position ?? '',
              email: c.email ?? '',
              phone: c.phone ?? '',
              isPrimary: !!c.isPrimary,
            }))
          )
        }
        if (Array.isArray(d.bankAccounts) && d.bankAccounts.length > 0) {
          setBankAccounts(
            d.bankAccounts.map((b: any) => ({
              bankId: Number(b.bankId ?? 1),
              bankCode: b.bankCode ?? 'MUFG',
              bankName: b.bankName ?? '',
              swiftCode: b.swiftCode ?? 'BOTKIDJX',
              accountNo: b.accountNo ?? '',
              accountHolderName: b.accountHolderName ?? '',
              branchName: b.branchName ?? '',
              currencyCode: b.currencyCode ?? 'IDR',
              iban: b.iban ?? '',
              beneficiaryCountry: b.beneficiaryCountry ?? 'ID',
              beneficiaryCity: b.beneficiaryCity ?? 'Bekasi',
              beneficiaryAddress: b.beneficiaryAddress ?? '',
              bankAddress: b.bankAddress ?? '',
              citizenship: b.citizenship ?? 'RESIDENT',
              verificationStatus: b.verificationStatus ?? 'VERIFIED',
              isPrimary: !!b.isPrimary,
            }))
          )
        }
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
      const subPayload = {
        addresses: addresses
          .filter((a) => a.line1.trim() && a.city.trim())
          .map((a) => ({
            addressType: a.addressType,
            line1: a.line1,
            line2: a.line2 || null,
            city: a.city,
            province: a.province || null,
            postalCode: a.postalCode || null,
            countryCode: a.countryCode || 'ID',
            isPrimary: a.isPrimary,
          })),
        contacts: contacts
          .filter((c) => c.name.trim())
          .map((c) => ({
            name: c.name,
            position: c.position || null,
            email: c.email || null,
            phone: c.phone || null,
            isPrimary: c.isPrimary,
          })),
        bankAccounts: bankAccounts
          .filter((b) => b.accountNo.trim() && b.accountHolderName.trim())
          .map((b) => ({
            bankId: Number(b.bankId || 1),
            accountNo: b.accountNo,
            accountHolderName: b.accountHolderName,
            branchName: b.branchName || null,
            currencyCode: b.currencyCode || 'IDR',
            iban: b.iban || null,
            beneficiaryCountry: b.beneficiaryCountry || 'ID',
            beneficiaryCity: b.beneficiaryCity || null,
            beneficiaryAddress: b.beneficiaryAddress || null,
            bankAddress: b.bankAddress || null,
            citizenship: b.citizenship || 'RESIDENT',
            verificationStatus: b.verificationStatus || 'VERIFIED',
            isPrimary: b.isPrimary,
          })),
      }

      if (isNew) {
        const res = await post<{ data: { id: string } }>('/vendors', {
          bpCode: form.bpCode || undefined,
          entityType: form.entityType,
          legalName: form.legalName,
          tradeName: form.tradeName || null,
          taxId: form.taxId || null,
          businessRegNo: form.businessRegNo || null,
          isVatRegistered: form.isVatRegistered,
          isSupplier: form.isSupplier,
          isCustomer: form.isCustomer,
          email: form.email || null,
          phone: form.phone || null,
          defaultCurrencyCode: form.defaultCurrencyCode,
          paymentTermId: form.paymentTermId,
          operationalStatus: form.operationalStatus,
          ...subPayload,
        })
        router.push(`/vendors/${res.data.id}`)
      } else {
        await patch(`/vendors/${vendorId}`, {
          legalName: form.legalName,
          tradeName: form.tradeName || null,
          taxId: form.taxId || null,
          businessRegNo: form.businessRegNo || null,
          isVatRegistered: form.isVatRegistered,
          isSupplier: form.isSupplier,
          isCustomer: form.isCustomer,
          email: form.email || null,
          phone: form.phone || null,
          defaultCurrencyCode: form.defaultCurrencyCode,
          paymentTermId: form.paymentTermId,
          operationalStatus: form.operationalStatus,
          ...subPayload,
        })
        setSuccess('Profil lengkap Vendor (Identitas, Alamat, PIC, dan Rekening Bank MUFG) berhasil disimpan.')
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
        title={isNew ? 'Add New Vendor / Business Partner' : `Vendor Master Profile — ${form.legalName || form.bpCode}`}
        subtitle="Formulir master rekanan lengkap: Identitas Badan Hukum, Pajak (NPWP/PKP/NIB), Alamat Kantor/Pabrik, Kontak Person (PIC), serta Rekening Bank & MUFG Remittance (Swift/IBAN)."
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
        {/* SECTION 1: Corporate Identity & Tax Profile */}
        <Card
          title="1. Corporate Identity, Tax (NPWP / PKP / NIB) & Partner Role"
          desc="Informasi badan hukum, kode rekanan, NPWP, Nomor Induk Berusaha (NIB), dan peran bisnis (Supplier / Customer)."
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
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
              </Select>
            </Field>

            <Field label="Partner Role & PKP Status">
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-gray-700">
                <label className="inline-flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={form.isSupplier}
                    onChange={(e) => setForm({ ...form, isSupplier: e.target.checked })}
                  />
                  <span>Supplier (AP)</span>
                </label>
                <label className="inline-flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={form.isCustomer}
                    onChange={(e) => setForm({ ...form, isCustomer: e.target.checked })}
                  />
                  <span>Customer (AR)</span>
                </label>
                <label className="inline-flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={form.isVatRegistered}
                    onChange={(e) => setForm({ ...form, isVatRegistered: e.target.checked })}
                  />
                  <span>PKP (Wajib PPN)</span>
                </label>
              </div>
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

            <Field label="Tax ID (NPWP 15/16 Digit)" required>
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

            <Field label="Primary Corporate Email" required>
              <Input
                type="email"
                disabled={readOnly}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="procurement@vendor.co.id"
              />
            </Field>

            <Field label="Primary Phone / Hunting Number">
              <Input
                disabled={readOnly}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+62 21 8983 4410"
              />
            </Field>

            <Field label="Default Transaction Currency">
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

            <Field label="Default Payment Term (TOP)">
              {readOnly ? (
                <Input disabled value={form.paymentTermId ? `Payment Term #${form.paymentTermId}` : 'NET30 (30 Days)'} />
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
                <option value="ACTIVE">ACTIVE (Ready for Purchasing &amp; Invoicing)</option>
                <option value="SUSPENDED">SUSPENDED (Temporary Hold)</option>
                <option value="BLACKLISTED">BLACKLISTED</option>
                <option value="INACTIVE">INACTIVE</option>
              </Select>
            </Field>
          </div>
        </Card>

        {/* SECTION 2: Addresses (Head Office, Billing, Shipping, Plant) */}
        <Card
          title="2. Registered Addresses (Kantor Pusat, Penagihan, Gudang & Pabrik)"
          desc="Daftar alamat resmi rekanan untuk pengiriman PO, penagihan Faktur Pajak, dan korespondensi."
          actions={
            !readOnly && (
              <Button
                variant="secondary"
                onClick={() => setAddresses([...addresses, { ...emptyAddress(), isPrimary: false }])}
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Alamat</span>
              </Button>
            )
          }
        >
          <div className="space-y-4">
            {addresses.map((addr, idx) => (
              <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                    <MapPin className="h-4 w-4 text-brand-600" />
                    <span>Address #{idx + 1}</span>
                    {addr.isPrimary && <Badge value="ACTIVE" />}
                  </div>
                  {!readOnly && addresses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setAddresses(addresses.filter((_, i) => i !== idx))}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-error-600 hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <Field label="Address Type">
                    <Select
                      disabled={readOnly}
                      value={addr.addressType}
                      onChange={(e) =>
                        setAddresses(
                          addresses.map((a, i) =>
                            i === idx ? { ...a, addressType: e.target.value as BpAddress['addressType'] } : a
                          )
                        )
                      }
                    >
                      <option value="HEAD">HEAD (Head Office / NPWP)</option>
                      <option value="BILLING">BILLING (Invoicing &amp; Finance)</option>
                      <option value="SHIPPING">SHIPPING (Warehouse / Plant)</option>
                      <option value="BRANCH">BRANCH (Kantor Cabang)</option>
                    </Select>
                  </Field>

                  <div className="md:col-span-2">
                    <Field label="Street Address (Line 1)" required>
                      <Input
                        disabled={readOnly}
                        value={addr.line1}
                        onChange={(e) =>
                          setAddresses(addresses.map((a, i) => (i === idx ? { ...a, line1: e.target.value } : a)))
                        }
                        placeholder="Kawasan Industri Jababeka Tahap II, Jl. Industri Selatan..."
                      />
                    </Field>
                  </div>

                  <Field label="Building / Industrial Estate (Line 2)">
                    <Input
                      disabled={readOnly}
                      value={addr.line2}
                      onChange={(e) =>
                        setAddresses(addresses.map((a, i) => (i === idx ? { ...a, line2: e.target.value } : a)))
                      }
                      placeholder="Blok GG-12"
                    />
                  </Field>

                  <Field label="City / Regency" required>
                    <Input
                      disabled={readOnly}
                      value={addr.city}
                      onChange={(e) =>
                        setAddresses(addresses.map((a, i) => (i === idx ? { ...a, city: e.target.value } : a)))
                      }
                      placeholder="Bekasi"
                    />
                  </Field>

                  <Field label="Province">
                    <Input
                      disabled={readOnly}
                      value={addr.province}
                      onChange={(e) =>
                        setAddresses(addresses.map((a, i) => (i === idx ? { ...a, province: e.target.value } : a)))
                      }
                      placeholder="Jawa Barat"
                    />
                  </Field>

                  <Field label="Postal Code">
                    <Input
                      disabled={readOnly}
                      value={addr.postalCode}
                      onChange={(e) =>
                        setAddresses(addresses.map((a, i) => (i === idx ? { ...a, postalCode: e.target.value } : a)))
                      }
                      placeholder="17530"
                    />
                  </Field>

                  <Field label="Country Code">
                    <Input
                      disabled={readOnly}
                      maxLength={2}
                      value={addr.countryCode}
                      onChange={(e) =>
                        setAddresses(
                          addresses.map((a, i) => (i === idx ? { ...a, countryCode: e.target.value.toUpperCase() } : a))
                        )
                      }
                      placeholder="ID"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* SECTION 3: Contact Persons (PIC Sales, Finance, Director) */}
        <Card
          title="3. Contact Persons / PIC (Sales, Finance, Tax & Director)"
          desc="Daftar pejabat penghubung (PIC) rekanan untuk konfirmasi RFQ, PO, penagihan AP Invoice, dan bukti potong pajak."
          actions={
            !readOnly && (
              <Button
                variant="secondary"
                onClick={() => setContacts([...contacts, { ...emptyContact(), isPrimary: false }])}
              >
                <Plus className="h-4 w-4" />
                <span>Tambah PIC Kontak</span>
              </Button>
            )
          }
        >
          <div className="space-y-3">
            {contacts.map((ct, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50/60 p-4 md:grid-cols-12 md:items-end"
              >
                <div className="md:col-span-3">
                  <Field label="Contact Person Name" required>
                    <Input
                      disabled={readOnly}
                      value={ct.name}
                      onChange={(e) =>
                        setContacts(contacts.map((c, i) => (i === idx ? { ...c, name: e.target.value } : c)))
                      }
                      placeholder="e.g. Hendra Wijaya"
                    />
                  </Field>
                </div>
                <div className="md:col-span-3">
                  <Field label="Position / Job Title">
                    <Input
                      disabled={readOnly}
                      value={ct.position}
                      onChange={(e) =>
                        setContacts(contacts.map((c, i) => (i === idx ? { ...c, position: e.target.value } : c)))
                      }
                      placeholder="Key Account & Finance Manager"
                    />
                  </Field>
                </div>
                <div className="md:col-span-3">
                  <Field label="Direct Email">
                    <Input
                      type="email"
                      disabled={readOnly}
                      value={ct.email}
                      onChange={(e) =>
                        setContacts(contacts.map((c, i) => (i === idx ? { ...c, email: e.target.value } : c)))
                      }
                      placeholder="hendra@vendor.co.id"
                    />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Mobile / WhatsApp">
                    <Input
                      disabled={readOnly}
                      value={ct.phone}
                      onChange={(e) =>
                        setContacts(contacts.map((c, i) => (i === idx ? { ...c, phone: e.target.value } : c)))
                      }
                      placeholder="+62 812 8899 0011"
                    />
                  </Field>
                </div>
                <div className="md:col-span-1 flex justify-end pb-1">
                  {!readOnly && contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setContacts(contacts.filter((_, i) => i !== idx))}
                      className="rounded-lg border border-error-200 bg-error-50 p-2 text-error-600 hover:bg-error-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* SECTION 4: Bank Accounts & MUFG Remittance Details (1:1 with Supplier Portal & preparedOPAPInvoice.html) */}
        <Card
          title="4. Bank Accounts & MUFG Remittance Information (Swift Code, IBAN & Beneficiary)"
          desc="Data rekening bank penerima pembayaran (Beneficiary Bank) yang digunakan secara otomatis pada modul Outgoing Payment AP Invoice (OPAP)."
          actions={
            !readOnly && (
              <Button
                variant="secondary"
                onClick={() => setBankAccounts([...bankAccounts, { ...emptyBank(), isPrimary: false }])}
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Rekening Bank</span>
              </Button>
            )
          }
        >
          <div className="space-y-4">
            {bankAccounts.map((ba, idx) => (
              <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                    <CreditCard className="h-4 w-4 text-brand-600" />
                    <span>Beneficiary Bank Account #{idx + 1}</span>
                    <Badge value={ba.verificationStatus} />
                  </div>
                  {!readOnly && bankAccounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setBankAccounts(bankAccounts.filter((_, i) => i !== idx))}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-error-600 hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus Rekening</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <Field label="Bank Name" required>
                    <Select
                      disabled={readOnly}
                      value={String(ba.bankId)}
                      onChange={(e) => {
                        const found = banks.find((x) => x.id === Number(e.target.value))
                        setBankAccounts(
                          bankAccounts.map((b, i) =>
                            i === idx
                              ? {
                                  ...b,
                                  bankId: Number(e.target.value),
                                  bankCode: found?.code ?? b.bankCode,
                                  bankName: found?.name ?? b.bankName,
                                  swiftCode: found?.swiftCode ?? b.swiftCode,
                                }
                              : b
                          )
                        )
                      }}
                    >
                      {banks.map((b) => (
                        <option key={b.id} value={String(b.id)}>
                          {b.code} — {b.name} ({b.swiftCode})
                        </option>
                      ))}
                      {banks.length === 0 && (
                        <>
                          <option value="1">MUFG — MUFG Bank, Ltd. (BOTKIDJX)</option>
                          <option value="2">BCA — PT Bank Central Asia Tbk (CENAIDJA)</option>
                          <option value="3">MANDIRI — PT Bank Mandiri Tbk (BMRIIDJA)</option>
                          <option value="4">SMBC — PT Bank BTPN / SMBC Indonesia (SUNIIDJA)</option>
                        </>
                      )}
                    </Select>
                  </Field>

                  <Field label="Account Number (No. Rekening)" required>
                    <Input
                      disabled={readOnly}
                      value={ba.accountNo}
                      onChange={(e) =>
                        setBankAccounts(
                          bankAccounts.map((b, i) => (i === idx ? { ...b, accountNo: e.target.value } : b))
                        )
                      }
                      placeholder="e.g. 710-0088123-45"
                    />
                  </Field>

                  <Field label="Account Holder / Beneficiary Name" required>
                    <Input
                      disabled={readOnly}
                      value={ba.accountHolderName}
                      onChange={(e) =>
                        setBankAccounts(
                          bankAccounts.map((b, i) => (i === idx ? { ...b, accountHolderName: e.target.value } : b))
                        )
                      }
                      placeholder={form.legalName || 'PT Kimia Industri Nusantara'}
                    />
                  </Field>

                  <Field label="Bank Branch (Cabang)">
                    <Input
                      disabled={readOnly}
                      value={ba.branchName}
                      onChange={(e) =>
                        setBankAccounts(
                          bankAccounts.map((b, i) => (i === idx ? { ...b, branchName: e.target.value } : b))
                        )
                      }
                      placeholder="KCU Jakarta MidPlaza"
                    />
                  </Field>

                  <Field label="Account Currency">
                    <Select
                      disabled={readOnly}
                      value={ba.currencyCode}
                      onChange={(e) =>
                        setBankAccounts(
                          bankAccounts.map((b, i) => (i === idx ? { ...b, currencyCode: e.target.value } : b))
                        )
                      }
                    >
                      {['IDR', 'USD', 'JPY', 'EUR', 'SGD'].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="SWIFT / BIC Code">
                    <Input
                      disabled
                      className="font-mono font-bold text-brand-700"
                      value={
                        banks.find((x) => x.id === ba.bankId)?.swiftCode || ba.swiftCode || 'BOTKIDJX'
                      }
                    />
                  </Field>

                  <Field label="IBAN (International Bank Account No.)">
                    <Input
                      disabled={readOnly}
                      value={ba.iban}
                      onChange={(e) =>
                        setBankAccounts(bankAccounts.map((b, i) => (i === idx ? { ...b, iban: e.target.value } : b)))
                      }
                      placeholder="ID01BOTK710008812345"
                    />
                  </Field>

                  <Field label="Resident / Citizenship Status">
                    <Select
                      disabled={readOnly}
                      value={ba.citizenship}
                      onChange={(e) =>
                        setBankAccounts(
                          bankAccounts.map((b, i) => (i === idx ? { ...b, citizenship: e.target.value } : b))
                        )
                      }
                    >
                      <option value="RESIDENT">RESIDENT (Dalam Negeri)</option>
                      <option value="NON_RESIDENT">NON_RESIDENT (Luar Negeri)</option>
                    </Select>
                  </Field>

                  <Field label="Beneficiary Country">
                    <Input
                      disabled={readOnly}
                      maxLength={2}
                      value={ba.beneficiaryCountry}
                      onChange={(e) =>
                        setBankAccounts(
                          bankAccounts.map((b, i) =>
                            i === idx ? { ...b, beneficiaryCountry: e.target.value.toUpperCase() } : b
                          )
                        )
                      }
                      placeholder="ID"
                    />
                  </Field>

                  <Field label="Beneficiary City">
                    <Input
                      disabled={readOnly}
                      value={ba.beneficiaryCity}
                      onChange={(e) =>
                        setBankAccounts(
                          bankAccounts.map((b, i) => (i === idx ? { ...b, beneficiaryCity: e.target.value } : b))
                        )
                      }
                      placeholder="Bekasi"
                    />
                  </Field>

                  <div className="md:col-span-2">
                    <Field label="Bank Street Address">
                      <Input
                        disabled={readOnly}
                        value={ba.bankAddress}
                        onChange={(e) =>
                          setBankAccounts(
                            bankAccounts.map((b, i) => (i === idx ? { ...b, bankAddress: e.target.value } : b))
                          )
                        }
                        placeholder="Jl. Jend. Sudirman Kav. 10-11, Jakarta Pusat"
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
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
                <span>{busy ? 'Saving…' : isNew ? 'Register Complete Vendor' : 'Save Vendor Master Profile'}</span>
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
