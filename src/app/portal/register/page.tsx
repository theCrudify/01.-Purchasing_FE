'use client'
import Link from 'next/link'
import { useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react'
import { AuthLayout } from '@/components/auth-layout'

export default function VendorRegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    companyName: '',
    entityType: 'PT',
    taxId: '',
    category: 'GOODS',
    picName: '',
    picEmail: '',
    picPhone: '',
    picJobTitle: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirmPassword) {
      setError('Password confirmation does not match.')
      return
    }
    if (!form.agreeTerms) {
      setError('Please agree to the procurement terms and supplier code of conduct.')
      return
    }

    setBusy(true)
    try {
      // Simulate/submit vendor registration request
      await new Promise((r) => setTimeout(r, 800))
      setStep(4)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Vendor Onboarding Registration"
      subtitle="Register your business partner account to participate in tenders, submit quotations, and manage purchase orders."
      badge="Supplier Portal Onboarding"
    >
      <div className="space-y-6">
        {/* Visual Progress Steps */}
        {step < 4 && (
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  step === 1 ? 'bg-indigo-600 text-white' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                1
              </span>
              <span className={`text-xs ${step === 1 ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
                Company
              </span>
            </div>
            <div className="h-0.5 w-6 bg-slate-200" />
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  step === 2
                    ? 'bg-indigo-600 text-white'
                    : step > 2
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                2
              </span>
              <span className={`text-xs ${step === 2 ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
                Contact PIC
              </span>
            </div>
            <div className="h-0.5 w-6 bg-slate-200" />
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  step === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                3
              </span>
              <span className={`text-xs ${step === 3 ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
                Security
              </span>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-700"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="min-w-0 flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Step 1: Company Profile */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Company Legal Name
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. PT Maju Bersama Sejahtera"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Legal Entity
                </label>
                <select
                  value={form.entityType}
                  onChange={(e) => setForm({ ...form, entityType: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="PT">PT (Perseroan Terbatas)</option>
                  <option value="CV">CV (Commanditaire Vennootschap)</option>
                  <option value="KOPERASI">Koperasi</option>
                  <option value="FIRMA">Firma</option>
                  <option value="INDIVIDUAL">Perorangan (Individual)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Business Scope
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="GOODS">Materials & Goods</option>
                  <option value="SERVICES">Consulting & Services</option>
                  <option value="LOGISTICS">Freight & Logistics</option>
                  <option value="IT">IT Hardware & Software</option>
                  <option value="FACILITY">Office & Facility Maintenance</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Tax ID / NPWP (16 Digits)
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="01.234.567.8-901.000"
                  value={form.taxId}
                  onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!form.companyName.trim()) {
                  setError('Please fill in your company legal name.')
                  return
                }
                setError(null)
                setStep(2)
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition cursor-pointer"
            >
              <span>Continue to Contact Person</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 2: PIC & Contact */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                PIC Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Budi Santoso"
                  value={form.picName}
                  onChange={(e) => setForm({ ...form, picName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Official Business Email (For PO & RFQ)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="sales@vendorcompany.com"
                  value={form.picEmail}
                  onChange={(e) => setForm({ ...form, picEmail: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Phone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+62 812-3456-7890"
                    value={form.picPhone}
                    onChange={(e) => setForm({ ...form, picPhone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Job Position
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sales Director"
                  value={form.picJobTitle}
                  onChange={(e) => setForm({ ...form, picJobTitle: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!form.picName.trim() || !form.picEmail.trim()) {
                    setError('Please fill in PIC name and official email.')
                    return
                  }
                  setError(null)
                  setStep(3)
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition cursor-pointer"
              >
                <span>Continue to Security</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Security & Agreement */}
        {step === 3 && (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Portal Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={12}
                  placeholder="At least 12 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={12}
                  placeholder="Confirm portal password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={(e) => setForm({ ...form, agreeTerms: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  I confirm that all company legal credentials provided are valid, and I agree to the{' '}
                  <strong className="text-slate-900">KPIN Supplier Code of Conduct</strong> and electronic document
                  acknowledgement.
                </span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
              >
                {busy ? 'Registering Company…' : 'Submit Registration Application'}
              </button>
            </div>
          </form>
        )}

        {/* Step 4: Success & Acknowledgment */}
        {step === 4 && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Registration Submitted!</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your application for <strong className="text-slate-900">{form.companyName}</strong> has been received by
              the procurement administration. An activation verification link has been sent to{' '}
              <strong className="text-slate-900">{form.picEmail}</strong>.
            </p>
            <div className="rounded-xl border border-emerald-200 bg-white p-3 text-xs text-slate-500">
              Our vendor management team typically reviews verification documents within 1 business day.
            </div>
            <div className="pt-3">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition"
              >
                <span>Return to Vendor Login</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {step < 4 && (
          <div className="border-t border-slate-100 pt-3 text-center">
            <Link
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:underline"
              href="/login"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Already registered? Sign in instead</span>
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
