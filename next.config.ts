import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // Mark problematic packages as external for server-side to avoid bundling issues
  serverExternalPackages: ['pdfkit'],
};

export default nextConfig;
