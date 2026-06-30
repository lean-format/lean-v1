/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  pageExtensions: ['ts', 'tsx'],
  transpilePackages: ['@lean-format/core', '@lean-format/ui'],
};

export default nextConfig;
