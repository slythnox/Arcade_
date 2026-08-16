# Configuration Reference

This document details the configuration files, compiler settings, test frameworks, and environment variables used across **ARCADE_**.

---

## 1. TypeScript Configuration (`tsconfig.json`)

ARCADE_ operates under strict TypeScript compiler settings:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Compiler Highlights:
- **`strict: true`:** Enables all strict type-checking options (`noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`).
- **`moduleResolution: "bundler"`:** Modern module resolution compliant with Next.js 16 and Turbopack.
- **`paths: { "@/*": ["./*"] }`:** Absolute import alias mapping directly to the project root.

---

## 2. Next.js Configuration (`next.config.mjs`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Turbopack options configured automatically in development
};

export default nextConfig;
```

---

## 3. Test Runner Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

---

## 4. Environment Variables (`.env.example`)

ARCADE_ requires zero mandatory environment variables to function locally. All optional variables are documented below:

```bash
# Optional: Enable bundle analysis mode during build
ANALYZE=false

# Node environment (development, test, production)
NODE_ENV=development
```
