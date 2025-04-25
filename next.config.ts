import type { NextConfig } from 'next';

/**
 * Configure Next.js for Edge runtime and AI SDK compatibility
 */
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Module resolution for AI SDK in Edge runtime
    if (!isServer) {
      if (!config.resolve) {
        config.resolve = {};
      }
      if (!config.resolve.fallback) {
        config.resolve.fallback = {};
      }
      
      Object.assign(config.resolve.fallback, {
        child_process: false,
        fs: false,
        net: false,
        tls: false,
      });
    }
    return config;
  },
  experimental: {
    // Enable streaming support
    serverActions: {
      bodySizeLimit: '50mb',
    }
  }
};

export default nextConfig;
