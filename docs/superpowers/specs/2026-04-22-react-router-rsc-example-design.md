# React Router RSC Example

## Purpose

Add a minimal, runnable example at `examples/react-router-rsc/` that demonstrates how to use `@withsprinkles/content-layer` with React Router v7 in RSC framework mode.

The example exists to answer "how do I actually wire this up?" for someone who has read the README and wants to see every piece in context: plugin registration, content config, schema validation, reference resolution, MDX rendering, and a client component composed inside server-rendered MDX.

Everything not load-bearing for that goal is explicitly excluded (see §10).

## File layout

```
examples/react-router-rsc/
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── react-router.config.ts
└── app/
    ├── app.css
    ├── root.tsx
    ├── routes.ts
    ├── content.config.ts
    ├── components/
    │   └── CopyCode.tsx
    ├── content/
    │   ├── authors.json
    │   └── blog/
    │       ├── hello-world.mdx
    │       ├── typed-content.mdx
    │       └── client-components-in-mdx.mdx
    └── routes/
        ├── home.tsx
        └── post.tsx
```

## Package configuration

`package.json`:

- `"private": true`, `"type": "module"`, `"name": "@withsprinkles/example-react-router-rsc"`.
- Depends on `@withsprinkles/content-layer` via `"workspace:*"`.
- Dependencies mirror the official `unstable_rsc-framework-mode` template (React Router 7.14.x, `@vitejs/plugin-rsc` ~0.5.21, `@tailwindcss/vite` 4.2.x, `@remix-run/node-fetch-server` 0.13.x), plus `@remix-run/data-schema` and `@mdx-js/rollup` for this example's needs.
- Uses Node's native subpath `imports` field for aliasing — no bundler-specific alias config, no tsconfig `paths`:

    ```json
    "imports": {
        "#/*": "./app/*"
    }
    ```

    Source files import local modules as `#/components/CopyCode.tsx`, `#/content.config.ts`, etc. TypeScript resolves these natively when `moduleResolution` is `bundler` (set in `tsconfig.json`).
- Scripts:
    - `"dev": "react-router dev"`
    - `"build": "react-router build"`
    - `"start": "react-router-serve build/server/index.js"`
    - `"typecheck": "react-router typegen && tsc"`

The monorepo-level `pnpm-workspace.yaml` already includes `examples/*`, so no change there.

## Tooling

`vite.config.ts` matches the official template's shape, with `contentLayer()` and `mdx()` added before the router/rsc plugins per the README's plugin-order requirement:

```ts
import mdx from "@mdx-js/rollup";
import { unstable_reactRouterRSC as reactRouterRSC } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import rsc from "@vitejs/plugin-rsc";
import { contentLayer } from "@withsprinkles/content-layer/react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [
        contentLayer(),
        mdx(),
        tailwindcss(),
        reactRouterRSC(),
        rsc(),
    ],
});
```

The example uses plain `vite` (not `vite-plus`) because the library's monorepo toolchain is Vite+ but consumers of the library may not be. Using stock Vite here makes the example portable and matches the official React Router template that users will most likely have seen first.

`react-router.config.ts` is effectively empty (matches the template):

```ts
import type { Config } from "@react-router/dev/config";
export default {} satisfies Config;
```

`app/app.css` imports Tailwind v4 (`@import "tailwindcss";`) plus a small amount of project styling (font-sans, body bg). Imported from `root.tsx`.

## Content collections

`app/content.config.ts` defines two collections using `@remix-run/data-schema`:

```ts
import * as s from "@remix-run/data-schema";
import * as coerce from "@remix-run/data-schema/coerce";
import { defineCollection, reference } from "@withsprinkles/content-layer";
import { file, glob } from "@withsprinkles/content-layer/loaders";

let authors = defineCollection({
    loader: file("app/content/authors.json"),
    schema: s.object({
        id: s.string(),
        name: s.string(),
        avatar: s.string(),
    }),
});

let blog = defineCollection({
    loader: glob({ pattern: "**/*.mdx", base: "app/content/blog" }),
    schema: s.object({
        title: s.string(),
        summary: s.string(),
        publishedOn: coerce.date(),
        author: reference("authors"),
    }),
});

export let collections = { authors, blog };
```

This exercises the three API surfaces a reader needs to see: `glob` loader, `file` loader, and `reference()` between collections.

## Routes

Two routes declared explicitly in `app/routes.ts`:

```ts
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("blog/:slug", "routes/post.tsx"),
] satisfies RouteConfig;
```

`app/root.tsx` follows the template's `Layout` / `App` / `ErrorBoundary` structure, adapted for RSC. It imports `./app.css`, renders `<html>` / `<head>` / `<body>`, and `<Outlet />`.

`app/routes/home.tsx`:

- `ServerComponent` (async) calls `getCollection("blog")`.
- Sorts by `publishedOn` descending.
- Renders a `<ul>` of `<Link to={`/blog/${post.id}`}>` entries showing title, summary, and date.

`app/routes/post.tsx`:

- `ServerComponent` (async) takes `params.slug`, calls `getEntry("blog", params.slug)`, returns 404 (`throw new Response(null, { status: 404 })`) if missing.
- Resolves the author: `let author = await getEntry(post.data.author)`.
- Calls `let { Content } = await render(post)`.
- Renders `<article>` with title, author name + avatar, date, and `<Content />`.

## Client component in MDX

`app/components/CopyCode.tsx` is a `"use client"` component that renders a fenced code block with a copy-to-clipboard button. Signature:

```tsx
"use client";
import { useState } from "react";

export function CopyCode({ lang, children }: { lang?: string; children: string }) {
    let [copied, setCopied] = useState(false);
    // onClick: navigator.clipboard.writeText(children), setCopied(true), setTimeout → setCopied(false)
    // Tailwind-styled <pre><code className={`language-${lang}`}>{children}</code></pre>
    // with absolutely-positioned button showing "Copy" / "Copied!"
}
```

Used inside `client-components-in-mdx.mdx`:

```mdx
import { CopyCode } from "#/components/CopyCode.tsx";

<CopyCode lang="sh">npm install @withsprinkles/content-layer</CopyCode>
```

The goal is to show that a `"use client"` component composes cleanly with MDX that's been served through Content Layer's virtual module pipeline. No syntax highlighting — the example is about the client/server boundary, not about pretty code rendering.

The MDX post body briefly explains what the component does and why it's interesting (it's interactive, runs in the browser, yet lives inside content that's authored as Markdown and rendered on the server).

## Content samples

Three posts in `app/content/blog/`:

- `hello-world.mdx` — trivially short, just enough to show the list → detail flow works. Frontmatter includes all required fields including an `author: jane` reference.
- `typed-content.mdx` — longer prose about how schemas are validated at build time; exercises a few MDX features (headings, lists, inline code) and references a different author.
- `client-components-in-mdx.mdx` — the one that imports and uses `<CopyCode />`.

Two authors in `app/content/authors.json` (array format with `id` field): `jane` and `rex`. Avatars use `https://gravatar.com/avatar/...` placeholder URLs so no assets are bundled.

## Scripts & running

From the example directory:

- `pnpm dev` → `react-router dev` (Vite dev server, HMR)
- `pnpm build` → `react-router build` (produces `build/server/index.js` + client assets)
- `pnpm start` → `react-router-serve build/server/index.js` (Node production server)

No custom Node server. `@react-router/serve@7.14.x` runs the RSC framework-mode build directly — confirmed against the official `unstable_rsc-framework-mode` template.

## README

`examples/react-router-rsc/README.md` covers, briefly:

1. What the example demonstrates (one paragraph).
2. How to run it (`pnpm install` at the monorepo root, then `pnpm dev` / `pnpm build` / `pnpm start` in the example dir).
3. A "What to look at" section pointing readers to the four interesting files in order: `vite.config.ts`, `app/content.config.ts`, `app/routes/post.tsx`, `app/content/blog/client-components-in-mdx.mdx`.
4. Link back to the main package README for full API docs.

## Out of scope

- No tests. Example correctness is verified by "does it render in the browser" during implementation.
- No deployment config (no Dockerfile, no wrangler, no Fly/Vercel config).
- No ESLint or Oxlint config beyond workspace defaults.
- No React Compiler, no custom middleware, no `getContext()`.
- No route layouts, no nested routes beyond `/blog/:slug`.
- No `getEntries` (plural) usage — `getEntry` + `reference()` already covers reference resolution.
- No syntax highlighting for `CopyCode`.
- No dark mode toggle or other interactive UI beyond `CopyCode`.
- No site metadata helpers, no `<title>` management beyond a static `<title>` in `root.tsx`.
