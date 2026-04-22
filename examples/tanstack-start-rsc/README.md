# TanStack Start RSC × Content Layer

A minimal example showing how to use [`@withsprinkles/content-layer`](../../packages/content-layer) with [TanStack Start](https://tanstack.com/start)'s experimental React Server Components support.

It demonstrates:

- A **glob loader** for MDX blog posts
- A **file loader** for a JSON authors list
- A **`reference()`** from posts to authors, resolved at query time
- Rendering MDX through `render()` inside a server function, returned from the route `loader` via `renderServerComponent`
- A `"use client"` component (a copy-to-clipboard code block) composed inside server-rendered MDX

> [!WARNING]
> TanStack Start's RSC support is experimental. The API may see refinements.

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
pnpm start    # run the production build
```

## What to look at, in order

1. [`vite.config.ts`](./vite.config.ts) — plugin registration. Note the order: `contentLayer()` → `mdx()` → `tanstackStart({ rsc: { enabled: true } })` → `rsc()` → `viteReact()`.
2. [`src/content.config.ts`](./src/content.config.ts) — defining two collections with `@remix-run/data-schema`, including a `reference()`.
3. [`src/routes/blog/$slug.tsx`](./src/routes/blog/$slug.tsx) — querying an entry, resolving its author reference, and rendering the MDX body inside a `createServerFn()` handler. The handler returns the output of `renderServerComponent(...)`, which the route component inlines from `Route.useLoaderData()`.
4. [`src/content/blog/client-components-in-mdx.mdx`](./src/content/blog/client-components-in-mdx.mdx) — importing a `"use client"` component into MDX.

See the [package README](../../packages/content-layer#readme) for the full API reference.
