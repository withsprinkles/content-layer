# React Router RSC × Content Layer

A minimal example showing how to use [`@withsprinkles/content-layer`](../../packages/content-layer) with React Router v7's experimental RSC framework mode.

It demonstrates:

- A **glob loader** for MDX blog posts
- A **file loader** for a JSON authors list
- A **`reference()`** from posts to authors, resolved at query time
- Rendering MDX through `render()` into an async Server Component
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
pnpm start    # run the production build via react-router-serve
```

## What to look at, in order

1. [`vite.config.ts`](./vite.config.ts) — plugin registration. Note the order: `contentLayer()` → `mdx()` → others.
2. [`app/content.config.ts`](./app/content.config.ts) — defining two collections with `@remix-run/data-schema`, including a `reference()`.
3. [`app/routes/post.tsx`](./app/routes/post.tsx) — querying an entry, resolving its author reference, and rendering the MDX body in an async Server Component.
4. [`app/content/blog/client-components-in-mdx.mdx`](./app/content/blog/client-components-in-mdx.mdx) — importing a `"use client"` component into MDX.

See the [package README](../../packages/content-layer#readme) for the full API reference.
