# LEAN Format Website

Documentation website for LEAN Format built with Next.js.

## Development

```bash
npm run dev
# Opens at http://localhost:3000
```

## Building

### For Production (GitHub Pages)
```bash
npm run build
# Output in /out with basePath /lean-v1
```

### For Local Testing
```bash
npm run build:test
# Output in /out without basePath
npx serve out
# Opens at http://localhost:3000
```

Or use the combined command:
```bash
npm run serve
```

## Deployment

The website automatically deploys to GitHub Pages when pushing to the `main` branch.

Deployed at: https://lean-format.github.io/lean-v1/

## Structure

- `/app` - Next.js app directory
- `/public` - Static assets
- `/components` - React components
- `/styles` - CSS modules

## Troubleshooting

**CSS not loading after build?**
- Make sure you're using `npm run build:test` for local testing
- Production builds have `basePath: '/lean-v1'` for GitHub Pages
- Access production build at `http://localhost:3000/lean-v1/` when using `npx serve out`
