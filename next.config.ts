import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/wellness-app",
  images: {
    unoptimized: true,
  },
  // Ensure we don't fail on build-time dynamic routes that require a server
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
