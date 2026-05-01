import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 'standalone' bundles everything needed to run on a Node.js server
  // without requiring node_modules — ideal for Hostinger Node.js app deployment
  output: undefined,
};

export default nextConfig;
