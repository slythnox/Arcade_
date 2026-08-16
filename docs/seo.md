# SEO, Metadata & Structured Data Architecture

This document details the search engine optimization (SEO) architecture, dynamic OpenGraph generation, JSON-LD Schema.org markup, and sitemap generation in **ARCADE_** (`lib/seo/`, `app/sitemap.ts`).

---

## 1. Automated Metadata Pipeline

Every cartridge definition contains complete SEO parameters (`games/types.ts`):

```typescript
export interface GameSEO {
  title: string;
  description: string;
  keywords?: string[];
}
```

When a user or search bot requests `/games/[slug]`, Next.js 16 invokes `generateMetadata()` on the server:

```typescript
// app/games/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) return {};
  return constructGameMetadata(game);
}
```

---

## 2. OpenGraph & Twitter Card Generation (`lib/seo/metadata.ts`)

`constructGameMetadata()` synthesizes canonical URLs, OpenGraph images, and platform metadata:

- **Canonical URL:** `https://arcade.games/games/{slug}`
- **OpenGraph Type:** `website`
- **Robots Directives:** `index: true, follow: true`
- **Twitter Card:** `summary_large_image`

---

## 3. Schema.org JSON-LD Structured Data (`lib/seo/structuredData.ts`)

Search crawlers receive machine-readable structured data injected as `<script type="application/ld+json">`:

### 1. `SoftwareApplication` Schema
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Tetris",
  "operatingSystem": "Any (Browser)",
  "applicationCategory": "GameApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Arrange falling geometric tetrominoes to clear horizontal lines...",
  "genre": "puzzle",
  "author": {
    "@type": "Organization",
    "name": "ARCADE_"
  }
}
```

### 2. `BreadcrumbList` Schema
Provides clean navigational breadcrumb trails in Google Search results:
`Home` $\to$ `Games` $\to$ `Tetris`.

---

## 4. Static Sitemap Generation (`app/sitemap.ts`)

`sitemap.ts` dynamically maps the entire repository into a standardized XML sitemap:
- High priority ($1.0$) for the homepage `/`
- Priority $0.8$ for all 62 `/games/{slug}` routes
- Priority $0.7$ for `/about` and `/faq`
