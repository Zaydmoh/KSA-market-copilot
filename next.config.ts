import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    // Prevent bundling Node.js core modules in client bundle
    config.resolve.fallback = {
      ...config.resolve.fallback,
      dns: false,
      fs: false,
      net: false,
      tls: false,
      pg: false,
      'pg-native': false,
    };
    return config;
  },
};

export default nextConfig;
