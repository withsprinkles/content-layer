# Remix 3 × Content Layer

A minimal example showing how to use [`@withsprinkles/content-layer`](../../packages/content-layer) with [Remix 3](https://remix.run) — the server-first, non-React framework.

It demonstrates:

- A **glob loader** for MDX blog posts
- A **file loader** for a JSON authors list
- A **`reference()`** from posts to authors, resolved at query time
- Rendering MDX through `render()` into Remix 3 server components
- A **`clientEntry()` island** (a copy-to-clipboard code block) composed inside server-rendered MDX
- Soft navigation between list and detail via `<Frame>`

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
pnpm dev         # dev server with HMR
pnpm build       # production build
pnpm preview     # serve the production build
```

## What to look at, in order

1. [`vite.config.ts`](./vite.config.ts) — plugin registration. Note the order: `contentLayer()` → `mdx({ jsxImportSource: "remix/component" })` → `remix()`.
2. [`app/content.config.ts`](./app/content.config.ts) — defining two collections with `remix/data-schema`, including a `reference()`.
3. [`app/components/Document.tsx`](./app/components/Document.tsx) — the HTML shell with a named `<Frame>` driving soft navigation.
4. [`app/controllers/post.tsx`](./app/controllers/post.tsx) — querying an entry, resolving its author reference, and rendering MDX through Content Layer's Remix adapter.
5. [`app/content/blog/client-components-in-mdx.mdx`](./app/content/blog/client-components-in-mdx.mdx) — importing a `clientEntry()` island into MDX.

## How Remix 3 differs from the React Router / TanStack / Waku examples

- **Styling:** `css()` mixins applied via the `mix` attribute, not Tailwind classes.
- **Islands:** `clientEntry(import.meta.url, …)` with closure state, not `"use client"` + `useState`.
- **Navigation:** `<Frame name="content">` swaps only the content region; the document shell is untouched between navigations.
- **Validation:** `remix/data-schema` is the Standard Schema implementation — same API shape as Zod/Valibot/Arktype, different import.

See the [package README](../../packages/content-layer#readme) for the full API reference.
