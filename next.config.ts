import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        os: false,
        stream: false,
        buffer: false,
        process: false,
      };
    }
    return config;
  },
  transpilePackages: ['@multiversx/sdk-core', '@multiversx/sdk-dapp', '@multiversx/sdk-bls-wasm'],
};

export default nextConfig;
