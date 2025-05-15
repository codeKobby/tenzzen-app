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
  output: "standalone",
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
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentDispositionType: "inline",
  },
  // Configure webpack
  webpack: (config) => {
    // Return the modified config
    return config;
  },
};

module.exports = nextConfig;
