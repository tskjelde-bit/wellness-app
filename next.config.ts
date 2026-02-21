import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const isGithubActions = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: isGithubActions ? "export" : undefined,
  basePath: isGithubActions ? "/wellness-app" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
