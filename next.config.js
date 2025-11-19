/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  images: {
    domains: [
      "images.unsplash.com",
      "i.ytimg.com",
      "img.youtube.com",
      "yt3.ggpht.com",
      "yt3.googleusercontent.com",
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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      if (!config.resolve) {
        config.resolve = {};
      }
      if (!config.resolve.fallback) {
        config.resolve.fallback = {};
      }
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
        fs: false,
        net: false,
        tls: false,
      };
    }
    if (config.cache) {
      config.cache = {
        type: "memory",
      };
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": ".",
      "@/components": "./components",
      "@/lib": "./lib",
      "@/hooks": "./hooks",
      "@/types": "./types",
      "@/actions": "./actions",
    };
    return config;
  },
  experimental: {
    webpackMemoryOptimizations: true,
    typedRoutes: true,
    serverActions: {
      allowedOrigins: ["localhost:3000"],
      bodySizeLimit: "2mb",
    },
  },
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.youtube.com https://www.google.com https://apis.google.com https://*.clerk.accounts.dev https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://*.clerk.accounts.dev",
              "connect-src 'self' https://www.youtube.com https://www.google.com https://apis.google.com https://*.convex.cloud https://*.clerk.accounts.dev wss://*.convex.cloud wss: ws:",
              "frame-src 'self' https://www.youtube.com https://www.google.com https://*.clerk.accounts.dev https://challenges.cloudflare.com",
              "media-src 'self' https://www.youtube.com blob:",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
