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
      
      // Use object spread to make a clean copy and avoid potential mutation issues
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Optimize webpack cache to reduce memory usage and improve performance
    if (config.cache) {
      // Use memory cache type instead of filesystem to reduce the warning about serializing big strings
      config.cache = {
        type: 'memory',
        // Additional cache configuration can be added here if needed
      };
    }
    
    // Important: always return the modified config
    return config;
  },
  experimental: {
    // Enable memory optimizations for webpack
    webpackMemoryOptimizations: true,
    // Enable streaming support
    serverActions: {
      bodySizeLimit: '50mb',
    }
  }
};

export default nextConfig;
