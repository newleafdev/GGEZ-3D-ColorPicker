/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Note: This feature is required to use NextJS Image with regular img tag sources
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig 