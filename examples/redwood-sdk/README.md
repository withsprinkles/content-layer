# RedwoodSDK × Content Layer

A minimal example showing how to use [`@withsprinkles/content-layer`](../../packages/content-layer) with [RedwoodSDK](https://rwsdk.com/), a server-first React framework that runs on Cloudflare Workers.

It demonstrates:

- A **glob loader** for MDX blog posts
- A **file loader** for a JSON authors list
- A **`reference()`** from posts to authors, resolved at query time
- Rendering MDX through `render()` directly inside an async Server Component route
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
pnpm dev      # dev server with HMR at http://localhost:5173
pnpm build    # production build
pnpm preview  # preview the built worker locally via wrangler
```

## What to look at, in order

1. [`vite.config.mts`](./vite.config.mts) — plugin registration. Note the order: `contentLayer()` → `mdx()` → `cloudflare()` → `redwood()` → `tailwindcss()`.
2. [`src/content.config.ts`](./src/content.config.ts) — defining two collections with [Zod](https://zod.dev), including a `reference()` helper built from `z.string().transform(...)`.
3. [`src/worker.tsx`](./src/worker.tsx) — the RedwoodSDK app: a `Document`, common-headers middleware, and two routes (`/` and `/blog/:slug`).
4. [`src/app/pages/post.tsx`](./src/app/pages/post.tsx) — an async Server Component that queries an entry by slug, resolves its author reference, and renders the MDX body inline via `render()`.
5. [`src/content/blog/client-components-in-mdx.mdx`](./src/content/blog/client-components-in-mdx.mdx) — importing a `"use client"` component into MDX.

See the [package README](../../packages/content-layer#readme) for the full API reference.
