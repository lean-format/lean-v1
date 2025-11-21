/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const isGitHubPages = process.env.GITHUB_PAGES === 'true'

const nextConfig = {
    output: 'export',
    // Only use basePath when deploying to GitHub Pages
    basePath: isGitHubPages ? '/lean-v1' : '',
    assetPrefix: isGitHubPages ? '/lean-v1/' : '',
    images: {
        unoptimized: true,
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