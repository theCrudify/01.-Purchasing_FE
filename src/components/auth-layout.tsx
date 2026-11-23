'use client'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { CheckCircle2, FileText, Layers, ShieldCheck, Sparkles } from 'lucide-react'

export function AuthLayout({
  title,
  subtitle,
  children,
  badge = 'Enterprise Procurement',
}: {
  title: string
  subtitle: string
  children: ReactNode
  badge?: string
}) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Hero Section (Hidden on mobile) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:flex">
        {/* Background Gradients & Grid Pattern */}
        <div className="absolute inset-0 bg-linear-to-br from-indigo-950/80 via-slate-950 to-slate-900" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-lg shadow-lg shadow-indigo-600/40">
            KP
          </div>
          <div>
            <span className="block text-lg font-bold tracking-tight">KPIN Purchasing</span>
            <span className="block text-xs font-medium text-indigo-300/80 tracking-wide">
              INTELLIGENT PROCUREMENT PLATFORM
            </span>
          </div>
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 my-auto max-w-lg space-y-8 py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3.5 py-1 text-xs font-medium text-indigo-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>{badge}</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Precision Purchasing,
              <br />
              <span className="bg-linear-to-r from-indigo-300 via-sky-300 to-white bg-clip-text text-transparent">
                Simplified Approvals.
              </span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Empowering organizations with automated approval hierarchies, audit-grade governance, and direct supplier collaboration in one unified ecosystem.
            </p>
          </div>

          {/* Highlight feature list */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-300">
                <Layers className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-white">Dynamic Approval Rules</p>
                <p className="text-slate-400">Multi-level workflows based on budgets, departments, and item classes.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/30 text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-white">Audit & Compliance Ready</p>
                <p className="text-slate-400">Every decision, delegation, and handover is permanently tracked.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600/30 text-sky-300">
                <FileText className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-white">Direct Vendor Portal</p>
                <p className="text-slate-400">Collaborate with suppliers on RFQ, Quotations, and GR verification.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">
          <span>© 2026 KPIN Procurement System</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>256-bit TLS Protected</span>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex w-full flex-col justify-between p-6 sm:p-12 lg:w-1/2">
        {/* Mobile Logo Banner */}
        <div className="flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm">
              KP
            </div>
            <span className="font-bold text-slate-900">KPIN Purchasing</span>
          </div>
          <span className="text-xs font-semibold text-indigo-600">{badge}</span>
        </div>

        {/* Form Container */}
        <div className="mx-auto my-auto w-full max-w-md py-8">
          <div className="mb-6 space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>

          {children}
        </div>

        {/* Bottom Help/Support */}
        <div className="text-center text-xs text-slate-400">
          <span>Need technical assistance? </span>
          <a href="mailto:support@kpin.local" className="font-medium text-slate-600 hover:text-indigo-600 hover:underline">
            Contact IT Helpdesk
          </a>
        </div>
      </div>
    </div>
  )
}
