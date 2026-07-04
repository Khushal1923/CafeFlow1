import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  typescript: {
    // Allow production builds to complete even if type errors exist
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow production builds to complete even if ESLint warnings exist
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
