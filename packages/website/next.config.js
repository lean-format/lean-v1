/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/lean-v1' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/lean-v1/' : '',
  images: {
    unoptimized: true,
  },
  // Disable React strict mode to avoid double rendering in development
  reactStrictMode: false,
  // Ensure static export works with dynamic routes
  trailingSlash: true,
  // Configure webpack to handle the core package
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig