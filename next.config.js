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
  // Configure image domains for next/image
  images: {
    domains: [
      "images.unsplash.com",
      "i.ytimg.com",
      "img.youtube.com",
      "yt3.ggpht.com", // YouTube channel thumbnails
      "yt3.googleusercontent.com", // YouTube profile pictures
      "ytimg.googleusercontent.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
  },
  // Configure webpack
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
      };
    }

    // Return the modified config
    return config;
  },
  experimental: {
    // Enable memory optimizations for webpack
    webpackMemoryOptimizations: true,
    // Configure server actions
    serverActions: {
      // Add any specific server actions configuration here if needed
      bodySizeLimit: '2mb'
    }
  },
};

module.exports = nextConfig;
