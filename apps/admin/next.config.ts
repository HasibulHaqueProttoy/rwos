import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: [
    '@rwos/ui',
    '@rwos/auth',
    '@rwos/core',
    '@rwos/db',
    '@rwos/integrations',
    '@rwos/config',
  ],
};

export default nextConfig;
