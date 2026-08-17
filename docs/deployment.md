# Production Deployment & Hosting Guide

This document details the production build pipeline, static site generation, and hosting considerations for **ARCADE_**.

---

## 1. Production Build Pipeline

To generate a production-ready build:

```bash
# 1. Verify TypeScript types
npm run typecheck

# 2. Run automated test suite
npm test

# 3. Compile optimized Next.js production bundle
npm run build
```

During `npm run build`:
- `generateStaticParams()` iterates over all 60 cartridges in `gameRegistry` and generates static HTML files for `/games/[slug]`.
- Asynchronous chunks are created for each game cartridge via dynamic `import()`.
- Static assets, CSS bundles, and fonts are minified and hashed with immutable cache headers.

---

## 2. Running the Production Server

To serve the compiled application locally:

```bash
npm run start
```
Starts the high-performance Next.js production server on `http://localhost:3000`.

---

## 3. Hosting on Vercel

ARCADE_ is optimized for deployment on [Vercel](https://vercel.com/):

1. **Zero Configuration:** Next.js App Router routes, API endpoints, and static chunks are automatically routed to the Vercel Edge Network.
2. **Analytics Integration:** When hosted on Vercel, `@vercel/analytics` provides anonymous, privacy-friendly page-view metrics without collecting user IP addresses or setting tracking cookies.
3. **Global CDN Caching:** Static game shells and pre-rendered pages are cached on edge nodes worldwide for sub-100ms first-contentful-paint (FCP).

---

## 4. Alternative Hosting (Docker / Node.js)

Because ARCADE_ relies solely on standard Web APIs (Canvas 2D, Web Audio API, LocalStorage), the production build can be hosted on any Node.js environment or container platform (AWS ECS, Google Cloud Run, Railway, Render):

```dockerfile
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY . .
RUN npm ci
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```
