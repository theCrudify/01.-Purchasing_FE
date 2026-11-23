'use client'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

export function AuthLayout({
  title,
  subtitle,
  children,
  badge = 'System Online',
  themeColor = '#c3002f', // Kansai Paint Corporate Red
}: {
  title: string
  subtitle: string
  children: ReactNode
  badge?: string
  themeColor?: string
}) {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    // Ping health endpoint
    fetch('/api/health')
      .then((r) => setOnline(r.ok))
      .catch(() => setOnline(false))
  }, [])

  return (
    <div className="relative min-h-screen bg-white">
      {/* Floating System Status Badge */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-xs ${
            online
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span>{online ? 'System Online' : 'System Offline'}</span>
        </div>
      </div>

      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Left Side: Form Container */}
        <div className="flex w-full flex-col justify-between p-6 sm:p-12 lg:w-1/2 lg:p-16">
          {/* Mobile Logo */}
          <div className="mb-6 lg:hidden">
            <Link href="/" className="inline-block">
              <div className="inline-block rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img width={160} height={34} src="/images/logo/Seiho.png" alt="Kansai Paint Logo" />
              </div>
            </Link>
          </div>

          <div className="mx-auto my-auto w-full max-w-md">
            <div className="mb-8 space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
              <p className="text-sm text-slate-500">{subtitle}</p>
            </div>

            {children}
          </div>

          <div className="mt-8 text-center text-xs text-slate-400">
            <span>© 2026 PT Kansai Paint Indonesia • KPIN Purchasing & Supplier Portal</span>
          </div>
        </div>

        {/* Right Side: Kansai Paint Corporate Hero Banner */}
        <div
          className="relative hidden w-1/2 items-center justify-center overflow-hidden lg:grid"
          style={{ backgroundColor: themeColor }}
        >
          {/* Top-Right Grid Shape */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/shape/grid-01.svg"
            alt="grid shape"
            className="pointer-events-none absolute right-0 top-0 w-full max-w-[360px] opacity-40 select-none"
          />

          {/* Bottom-Left Grid Shape (Rotated 180) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/shape/grid-01.svg"
            alt="grid shape"
            className="pointer-events-none absolute bottom-0 left-0 w-full max-w-[360px] rotate-180 opacity-40 select-none"
          />

          {/* Center Brand Showcase */}
          <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
            <div className="mb-6 rounded-2xl bg-white p-5 shadow-2xl transition-transform hover:scale-105">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                width={240}
                height={50}
                src="/images/logo/Seiho.png"
                alt="PT Kansai Paint Indonesia"
                className="h-auto w-auto"
              />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              PT Kansai Paint Indonesia
            </h2>
            <p className="mt-2 text-xs font-medium uppercase tracking-widest text-white/80">
              Purchasing & Supplier Portal Ecosystem
            </p>
            <div className="mt-6 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs text-white backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Direct SAP Integration & Compliance Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
