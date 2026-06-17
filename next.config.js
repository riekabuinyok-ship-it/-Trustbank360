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
  }
}

module.exports = nextConfig
