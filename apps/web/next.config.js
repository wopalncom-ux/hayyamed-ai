/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Allow images from external sources if needed in future
  images: {
    domains: [],
  },
}

module.exports = nextConfig
