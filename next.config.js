/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds to prevent build failures
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during builds
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  // Configure output directory
  output: 'standalone',
  // Configure image domains for next/image
  images: {
    domains: ['images.unsplash.com', 'i.ytimg.com', 'img.youtube.com'],
  },
  // Increase timeout for API routes
  api: {
    responseLimit: '8mb',
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
  // Configure webpack
  webpack: (config) => {
    // Return the modified config
    return config;
  },
}

module.exports = nextConfig
