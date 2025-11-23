/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const isGitHubPages = process.env.GITHUB_PAGES === 'true'

console.log('Build config:', { isProd, isGitHubPages, basePath: isGitHubPages ? '/lean-v1' : '' })

const nextConfig = {
    output: 'export',
    basePath: isGitHubPages ? '/lean-v1' : '',
    assetPrefix: isGitHubPages ? '/lean-v1/' : '',
    images: {
        unoptimized: true,
    },
    env: {
        NEXT_PUBLIC_BASE_PATH: isGitHubPages ? '/lean-v1' : '',
    },
    reactStrictMode: false,
    trailingSlash: true,
    webpack: (config, { isServer }) => {
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