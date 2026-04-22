# Waku × Content Layer

A minimal example showing how to use [`@withsprinkles/content-layer`](../../packages/content-layer) with [Waku](https://waku.gg/), a minimal React framework with built-in React Server Components support.

It demonstrates:

- A **glob loader** for MDX blog posts
- A **file loader** for a JSON authors list
- A **`reference()`** from posts to authors, resolved at query time
- Rendering MDX through `render()` directly inside an async Waku page component
- A `"use client"` component (a copy-to-clipboard code block) composed inside server-rendered MDX

## Run it

From the monorepo root, install once:

```sh
vp install
```

Build the library (only needed once, or after changes to `packages/content-layer/`):

```sh
cd packages/content-layer && vp pack && cd -
```

Then, from this directory:

```sh
pnpm dev      # dev server at http://localhost:3000
pnpm build    # production build
pnpm start    # run the production build
```

## What to look at, in order

1. [`waku.config.ts`](./waku.config.ts) — plugin registration. Note the order inside `vite.plugins`: `contentLayer()` → `mdx()` → `tailwindcss()` → `react()`.
2. [`src/content.config.ts`](./src/content.config.ts) — defining two collections with [Arktype](https://arktype.io), including a `reference()` helper built from `type("string").pipe(...)`.
3. [`src/pages/blog/[slug].tsx`](./src/pages/blog/[slug].tsx) — an async Waku page component that queries an entry by slug, resolves its author reference, renders the MDX body inline via `render()`, and pre-generates every post path via `getConfig`'s `staticPaths`.
4. [`src/content/blog/client-components-in-mdx.mdx`](./src/content/blog/client-components-in-mdx.mdx) — importing a `"use client"` component into MDX.

See the [package README](../../packages/content-layer#readme) for the full API reference.
