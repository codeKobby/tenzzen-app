/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",
  skipTrailingSlashRedirect: true,
  skipProxyUrlNormalize: true,
  typedRoutes: true,
  images: {
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
  turbopack: {
    // Explicitly set the workspace root to prevent lockfile detection issues
    // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory
    root: __dirname,
    resolveAlias: {
      "@": ".",
      "@/components": "./components",
      "@/lib": "./lib",
      "@/hooks": "./hooks",
      "@/types": "./types",
      "@/actions": "./actions",
    },
  },
  experimental: {
    webpackMemoryOptimizations: true,
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
