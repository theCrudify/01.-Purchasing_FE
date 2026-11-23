'use client'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { CheckCircle2, FileCheck2, Layers, ShieldCheck } from 'lucide-react'

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    fetch('/api/health')
      .then((r) => setOnline(r.ok))
      .catch(() => setOnline(false))
  }, [])

  return (
    <div className="relative min-h-screen bg-white text-gray-900">
      {/* System Status Indicator */}
      <div className="fixed top-4 right-4 z-50">
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-theme-xs ${
            online
              ? 'border-success-200 bg-success-50 text-success-700'
              : 'border-error-200 bg-error-50 text-error-700'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${online ? 'bg-success-500' : 'bg-error-500'}`} />
          <span>{online ? 'System Online' : 'System Offline'}</span>
        </div>
      </div>

      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Left Side: Form Container */}
        <div className="flex w-full flex-col justify-between p-6 sm:p-12 lg:w-1/2 lg:p-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-theme-xs">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-sm font-bold tracking-tight text-gray-900 leading-none">
                  Procurement Portal
                </span>
                <span className="mt-0.5 block text-[11px] font-medium text-gray-500">
                  Purchasing & Workflow System
                </span>
              </div>
            </Link>
          </div>

          <div className="mx-auto my-auto w-full max-w-md py-8">
            <div className="mb-7 space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>

            {children}
          </div>

          <div className="text-center text-xs text-gray-400">
            <span>© 2026 Purchasing & Supplier Portal System</span>
          </div>
        </div>

        {/* Right Side: Uniform Clean Slate/Brand Panel */}
        <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-gray-900 lg:flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/shape/grid-01.svg"
            alt=""
            className="pointer-events-none absolute right-0 top-0 w-full max-w-[360px] opacity-25 select-none"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/shape/grid-01.svg"
            alt=""
            className="pointer-events-none absolute bottom-0 left-0 w-full max-w-[360px] rotate-180 opacity-25 select-none"
          />

          <div className="relative z-10 max-w-md px-8 space-y-6">
            <div className="inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-gray-200 backdrop-blur-xs">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-white">
                <Layers className="h-3.5 w-3.5" />
              </div>
              <span>Integrated Procurement Suite</span>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Streamlined Purchasing & Approval Governance
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                Manage purchase requests, multi-level approval workflows, master data, and supplier onboarding in a unified workspace.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                <div className="text-xs">
                  <p className="font-semibold text-white">Automated Approval Engine</p>
                  <p className="mt-0.5 text-gray-400">Configurable rules by department, budget threshold, and purchase class.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                <div className="text-xs">
                  <p className="font-semibold text-white">Complete Audit & Access Control</p>
                  <p className="mt-0.5 text-gray-400">Role-based permissions, delegation tracking, and full change history.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                <div className="text-xs">
                  <p className="font-semibold text-white">Unified Supplier Portal</p>
                  <p className="mt-0.5 text-gray-400">Direct vendor onboarding, quotation submission, and order tracking.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
