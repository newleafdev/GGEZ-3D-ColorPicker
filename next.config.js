/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Note: This feature is required to use NextJS Image with regular img tag sources
  images: {
    unoptimized: true,
  },
  typescript: {
    // !! WARN !!
    // Ignoring TypeScript errors for deployment
    // This is not recommended for production
    ignoreBuildErrors: true,
  },
  eslint: {
    // Also ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 