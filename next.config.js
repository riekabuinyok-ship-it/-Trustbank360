/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'trustbank360.com'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  },
  experimental: {
    serverExternalPackages: ['bcryptjs', 'pdfkit']
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Content-Type', value: 'application/manifest+json' },
        ],
      },
      {
        source: '/images/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
