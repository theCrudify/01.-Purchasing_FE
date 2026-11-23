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
      setError('Please accept the supplier terms and integrity agreement.')
      return
    }

    setBusy(true)
    try {
      await new Promise((r) => setTimeout(r, 600))
      setStep(4)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Vendor Registration"
      subtitle="Register your business partner profile to participate in RFQs, quotations, and purchase orders."
    >
      <div className="space-y-5">
        {step < 4 && (
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  step === 1 ? 'bg-brand-600 text-white' : 'bg-success-100 text-success-700'
                }`}
              >
                1
              </span>
              <span className={`text-xs ${step === 1 ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
                Company
              </span>
            </div>
            <div className="h-px w-6 bg-gray-200" />
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  step === 2
                    ? 'bg-brand-600 text-white'
                    : step > 2
                    ? 'bg-success-100 text-success-700'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                2
              </span>
              <span className={`text-xs ${step === 2 ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
                Contact PIC
              </span>
            </div>
            <div className="h-px w-6 bg-gray-200" />
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  step === 3 ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}
              >
                3
              </span>
              <span className={`text-xs ${step === 3 ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
                Credentials
              </span>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-error-200 bg-error-50 p-3.5 text-xs text-error-700"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-error-600 mt-0.5" />
            <div className="min-w-0 flex-1 font-medium">{error}</div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Company Legal Name <span className="text-error-500 font-bold">*</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. PT Mitra Sejahtera Abadi"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="h-[42px] w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Entity Type <span className="text-error-500 font-bold">*</span>
                </label>
                <select
                  value={form.entityType}
                  onChange={(e) => setForm({ ...form, entityType: e.target.value })}
                  className="h-[42px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                >
                  <option value="PT">PT (Perseroan Terbatas)</option>
                  <option value="CV">CV</option>
                  <option value="KOPERASI">Koperasi</option>
                  <option value="FIRMA">Firma</option>
                  <option value="INDIVIDUAL">Individual</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Supply Category <span className="text-error-500 font-bold">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="h-[42px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                >
                  <option value="GOODS">Materials & Goods</option>
                  <option value="SERVICES">Services & Maintenance</option>
                  <option value="LOGISTICS">Logistics & Freight</option>
                  <option value="IT">IT Hardware & Software</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Tax ID / NPWP (16 Digits) <span className="text-error-500 font-bold">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="01.234.567.8-901.000"
                  value={form.taxId}
                  onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                  className="h-[42px] w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!form.companyName.trim()) {
                  setError('Please enter your company legal name.')
                  return
                }
                setError(null)
                setStep(2)
              }}
              className="flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-700 transition cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Contact Person (PIC) Name <span className="text-error-500 font-bold">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={form.picName}
                  onChange={(e) => setForm({ ...form, picName: e.target.value })}
                  className="h-[42px] w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Official Business Email <span className="text-error-500 font-bold">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="sales@company.com"
                  value={form.picEmail}
                  onChange={(e) => setForm({ ...form, picEmail: e.target.value })}
                  className="h-[42px] w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Phone / Mobile <span className="text-error-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+62 812..."
                    value={form.picPhone}
                    onChange={(e) => setForm({ ...form, picPhone: e.target.value })}
                    className="h-[42px] w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Account Manager"
                  value={form.picJobTitle}
                  onChange={(e) => setForm({ ...form, picJobTitle: e.target.value })}
                  className="h-[42px] w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-[42px] rounded-lg border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!form.picName.trim() || !form.picEmail.trim()) {
                    setError('Please enter contact name and business email.')
                    return
                  }
                  setError(null)
                  setStep(3)
                }}
                className="flex-1 flex h-[42px] items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-700 transition cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Portal Password <span className="text-error-500 font-bold">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength={12}
                  placeholder="Minimum 12 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-[42px] w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3.5 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Confirm Password <span className="text-error-500 font-bold">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength={12}
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="h-[42px] w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3.5 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5">
              <label className="flex items-start gap-2.5 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={(e) => setForm({ ...form, agreeTerms: e.target.checked })}
                  className="mt-0.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span>
                  I confirm that all legal company information provided is accurate and agree to the{' '}
                  <strong className="text-gray-900">Supplier Code of Conduct & Procurement Terms</strong>.
                </span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="h-[42px] rounded-lg border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 h-[42px] rounded-lg bg-brand-600 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-700 disabled:opacity-50 transition cursor-pointer"
              >
                {busy ? 'Submitting…' : 'Submit Registration'}
              </button>
            </div>
          </form>
        )}

        {step === 4 && (
          <div className="rounded-xl border border-success-200 bg-success-50/70 p-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-100 text-success-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Registration Submitted</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Your business partner application for <strong className="text-gray-900">{form.companyName}</strong> has
              been received. A verification code has been sent to <strong className="text-gray-900">{form.picEmail}</strong>.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex h-[40px] w-full items-center justify-center rounded-lg bg-brand-600 text-xs font-semibold text-white shadow-theme-xs hover:bg-brand-700 transition"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        )}

        {step < 4 && (
          <div className="border-t border-gray-100 pt-3 text-center">
            <Link
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-600 hover:underline"
              href="/login"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Already have an account? Sign in</span>
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
