import type { NextConfig } from 'next'

// The browser only talks to this origin; /api/* is proxied to the separate BE repo (04.-Purchasing_BE),
// so auth cookies stay first-party (SameSite=Lax) and no CORS is needed.
const API_URL = process.env.API_URL ?? 'http://localhost:3918'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: { rules: { '*.css': { loaders: ['@tailwindcss/turbopack'], as: '*.css' } } },
  async rewrites() { return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }] },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
    ] }]
  },
}
export default nextConfig
