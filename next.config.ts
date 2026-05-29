import type { NextConfig } from 'next'

const securityHeaders = [
  // Prevent clickjacking — page cannot be embedded in an iframe
  { key: 'X-Frame-Options', value: 'DENY' },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Only send origin in referrer, never full URL cross-origin
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable browser features not needed by the app
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // HSTS: force HTTPS for 1 year (only active over HTTPS — ignored on localhost)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Basic XSS protection for legacy browsers
  { key: 'X-XSS-Protection', value: '1; mode=block' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
