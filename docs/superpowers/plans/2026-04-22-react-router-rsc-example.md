# React Router RSC Example Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal, runnable React Router v7 RSC example at `examples/react-router-rsc/` that demonstrates wiring up `@withsprinkles/content-layer` end to end — two collections (glob MDX + file JSON), a `reference()` between them, MDX rendering, and a `"use client"` component composed inside MDX.

**Architecture:** Standalone package in the existing pnpm workspace. Uses plain `vite` (not `vite-plus`) so the example is portable outside the monorepo. React Router's `unstable_reactRouterRSC` plugin + `@vitejs/plugin-rsc` handle the RSC/SSR environments; `react-router-serve` runs the production build directly — no custom Node server. Local module aliasing via Node's native subpath `imports` field (`#/* → ./app/*`), not tsconfig `paths`.

**Tech Stack:** React Router 7.14.x (RSC framework mode), `@vitejs/plugin-rsc` 0.5.x, `@mdx-js/rollup` 3.x, Tailwind v4 (`@tailwindcss/vite`), `@remix-run/data-schema` for schemas, `@withsprinkles/content-layer` (workspace:*).

**Spec:** [`docs/superpowers/specs/2026-04-22-react-router-rsc-example-design.md`](../specs/2026-04-22-react-router-rsc-example-design.md)

**Note on TDD:** The spec explicitly excludes tests — example correctness is verified by "does it render in the browser." Each task ends with a concrete manual verification step (visit URL X, observe Y) before committing.

---

## File Structure

Files created by this plan (all under `examples/react-router-rsc/`):

| File | Responsibility |
|---|---|
| `package.json` | Deps, scripts, Node `imports` alias |
| `tsconfig.json` | Type-check config; picks up RR + Content Layer generated types |
| `.gitignore` | Ignore `node_modules`, `build`, `.react-router`, `.sprinkles` |
| `vite.config.ts` | Plugin registration (contentLayer → mdx → tailwind → reactRouterRSC → rsc) |
| `react-router.config.ts` | Empty RR config |
| `README.md` | How to run it + what to look at |
| `app/app.css` | Tailwind + typography entry |
| `app/root.tsx` | HTML shell, error boundary, outlet |
| `app/routes.ts` | Two routes: index + `/blog/:slug` |
| `app/content.config.ts` | `blog` + `authors` collections |
| `app/components/CopyCode.tsx` | `"use client"` copy-to-clipboard component |
| `app/content/authors.json` | Two author records |
| `app/content/blog/hello-world.mdx` | Minimal smoke-test post |
| `app/content/blog/typed-content.mdx` | Prose-heavy post exercising MDX features |
| `app/content/blog/client-components-in-mdx.mdx` | Post that imports `<CopyCode />` |
| `app/routes/home.tsx` | Blog index — lists posts from `getCollection` |
| `app/routes/post.tsx` | Post detail — `getEntry`, resolves author reference, `render()` |

---

### Task 1: Scaffold the package and install dependencies

**Files:**
- Create: `examples/react-router-rsc/package.json`
- Create: `examples/react-router-rsc/tsconfig.json`
- Create: `examples/react-router-rsc/.gitignore`

- [ ] **Step 1: Create the directory and `package.json`**

Create the directory:

```bash
mkdir -p examples/react-router-rsc/app/{components,content/blog,routes}
```

Create `examples/react-router-rsc/package.json`:

```json
{
    "name": "@withsprinkles/example-react-router-rsc",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "react-router dev",
        "build": "react-router build",
        "start": "react-router-serve build/server/index.js",
        "typecheck": "react-router typegen && tsgo --noEmit"
    },
    "imports": {
        "#/*": "./app/*"
    },
    "dependencies": {
        "@mdx-js/rollup": "^3.1.1",
        "@react-router/serve": "^7.14.0",
        "@remix-run/data-schema": "^0.2.0",
        "@remix-run/node-fetch-server": "^0.13.0",
        "@withsprinkles/content-layer": "workspace:*",
        "react": "^19.2.4",
        "react-dom": "^19.2.4",
        "react-router": "^7.14.0"
    },
    "devDependencies": {
        "@react-router/dev": "^7.14.0",
        "@tailwindcss/typography": "^0.5.15",
        "@tailwindcss/vite": "^4.2.2",
        "@types/react": "^19.2.14",
        "@types/react-dom": "^19.2.3",
        "@typescript/native-preview": "latest",
        "@vitejs/plugin-rsc": "^0.5.21",
        "tailwindcss": "^4.2.2",
        "vite": "^8.0.3"
    }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

Mirrors the official RR RSC template, with two changes: drop `paths` (we use Node's `imports` field instead) and include `.sprinkles/content-layer/**/*` so the Content Layer generated types are picked up.

Create `examples/react-router-rsc/tsconfig.json`:

```json
{
    "include": [
        "**/*.ts",
        "**/*.tsx",
        "./.react-router/types/**/*",
        "./.sprinkles/content-layer/**/*"
    ],
    "compilerOptions": {
        "allowImportingTsExtensions": true,
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "skipLibCheck": true,
        "verbatimModuleSyntax": true,
        "noEmit": true,
        "moduleResolution": "Bundler",
        "module": "ESNext",
        "target": "ESNext",
        "lib": ["ESNext", "DOM", "DOM.Iterable"],
        "types": ["vite/client", "@vitejs/plugin-rsc/types"],
        "jsx": "react-jsx",
        "rootDirs": [".", "./.react-router/types"]
    },
    "mdx": {
        "checkMdx": true
    }
}
```

- [ ] **Step 3: Create `.gitignore`**

Create `examples/react-router-rsc/.gitignore`:

```
.DS_Store
.env
/node_modules/

# React Router
/.react-router/
/build/

# Content Layer
/.sprinkles/
```

- [ ] **Step 4: Install workspace dependencies**

From the monorepo root:

```bash
vp install
```

Expected: `pnpm-lock.yaml` updates; new dependencies resolve; `examples/react-router-rsc/node_modules/` exists (as a symlink or real directory depending on pnpm config).

- [ ] **Step 5: Build the workspace library**

The example depends on `@withsprinkles/content-layer` via `workspace:*`, and the library's exports point to `./dist/*` files that must exist before anything can import from it. Build it now:

```bash
cd packages/content-layer
vp pack
cd -
```

Expected: `packages/content-layer/dist/` contains `index.mjs`, `react.mjs`, `loaders.mjs`, and their `.d.mts` counterparts.

- [ ] **Step 6: Commit**

```bash
git add examples/react-router-rsc/package.json examples/react-router-rsc/tsconfig.json examples/react-router-rsc/.gitignore pnpm-lock.yaml
git commit -m "Scaffold react-router-rsc example package"
```

---

### Task 2: Wire up Vite, the root layout, and a placeholder home route

**Files:**
- Create: `examples/react-router-rsc/vite.config.ts`
- Create: `examples/react-router-rsc/react-router.config.ts`
- Create: `examples/react-router-rsc/app/app.css`
- Create: `examples/react-router-rsc/app/root.tsx`
- Create: `examples/react-router-rsc/app/routes.ts`
- Create: `examples/react-router-rsc/app/routes/home.tsx`

Goal: get a dev server running with a blank-but-styled page, before touching any content. This isolates "is the RSC/Tailwind/RR wiring correct?" from "is Content Layer wired correctly?"

- [ ] **Step 1: Create `vite.config.ts`**

```ts
import mdx from "@mdx-js/rollup";
import { unstable_reactRouterRSC as reactRouterRSC } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import rsc from "@vitejs/plugin-rsc";
import { contentLayer } from "@withsprinkles/content-layer/react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [contentLayer(), mdx(), tailwindcss(), reactRouterRSC(), rsc()],
});
```

Plugin order matters: `contentLayer()` before `mdx()` (so MDX virtual modules are available when `@mdx-js/rollup` runs), and everything content-related before the RR + RSC plugins.

- [ ] **Step 2: Create `react-router.config.ts`**

```ts
import type { Config } from "@react-router/dev/config";

export default {} satisfies Config;
```

- [ ] **Step 3: Create `app/app.css`**

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
    --font-sans:
        "Inter", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji",
        "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}

html,
body {
    @apply bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50;
}
```

- [ ] **Step 4: Create `app/root.tsx`**

```tsx
import {
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";

import "./app.css";

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Content Layer × React Router RSC</title>
                <Meta />
                <Links />
            </head>
            <body className="font-sans">
                <div className="mx-auto max-w-2xl p-6">{children}</div>
                <ScrollRestoration />
            </body>
        </html>
    );
}

export default function App() {
    return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    let message = "Oops!";
    let details = "An unexpected error occurred.";
    let stack: string | undefined;

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? "404" : "Error";
        details =
            error.status === 404
                ? "The requested page could not be found."
                : error.statusText || details;
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <main>
            <h1 className="text-2xl font-bold">{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre className="overflow-x-auto p-4">
                    <code>{stack}</code>
                </pre>
            )}
        </main>
    );
}
```

- [ ] **Step 5: Create `app/routes.ts`**

```ts
import { type RouteConfig, index } from "@react-router/dev/routes";

export default [index("routes/home.tsx")] satisfies RouteConfig;
```

(The `blog/:slug` route is added in Task 5.)

- [ ] **Step 6: Create `app/routes/home.tsx` as a placeholder**

```tsx
export function ServerComponent() {
    return (
        <main>
            <h1 className="text-2xl font-bold">Content Layer × React Router RSC</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
                Placeholder — the real blog list arrives in a later step.
            </p>
        </main>
    );
}
```

- [ ] **Step 7: Run the dev server and verify it renders**

```bash
cd examples/react-router-rsc
pnpm dev
```

Open `http://localhost:5173` in a browser.

Expected:
- Page shows "Content Layer × React Router RSC" heading in bold
- Placeholder paragraph below it
- Font is Inter (or a sans-serif fallback)
- If the OS is in dark mode, background is dark; otherwise white
- Browser devtools console shows no errors
- Terminal running `pnpm dev` shows no build errors

Stop the dev server (`Ctrl+C`) once verified.

- [ ] **Step 8: Commit**

```bash
git add examples/react-router-rsc/vite.config.ts examples/react-router-rsc/react-router.config.ts examples/react-router-rsc/app/
git commit -m "Add RR RSC skeleton with placeholder home route"
```

---

### Task 3: Define content collections and add the first blog post

**Files:**
- Create: `examples/react-router-rsc/app/content.config.ts`
- Create: `examples/react-router-rsc/app/content/authors.json`
- Create: `examples/react-router-rsc/app/content/blog/hello-world.mdx`

Goal: get Content Layer loading + validating content. The home page still shows its placeholder; we're just verifying the plugin picks up the config and generates types.

- [ ] **Step 1: Create `app/content.config.ts`**

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

- [ ] **Step 2: Create `app/content/authors.json`**

```json
[
    {
        "id": "jane",
        "name": "Jane Doe",
        "avatar": "https://gravatar.com/avatar/00000000000000000000000000000000?s=80&d=identicon"
    },
    {
        "id": "rex",
        "name": "Rex Morgan",
        "avatar": "https://gravatar.com/avatar/11111111111111111111111111111111?s=80&d=identicon"
    }
]
```

- [ ] **Step 3: Create `app/content/blog/hello-world.mdx`**

````mdx
---
title: Hello, world
summary: The simplest possible Content Layer post — just proof that the pipeline works end to end.
publishedOn: 2026-03-01
author: jane
---

Welcome to the Content Layer × React Router RSC example.

This post lives at `app/content/blog/hello-world.mdx`. Its frontmatter was
validated against the `blog` collection's schema at build time, and the content
you're reading right now was compiled from MDX into a React Server Component.
````

- [ ] **Step 4: Run the dev server and verify types were generated**

```bash
cd examples/react-router-rsc
pnpm dev
```

In another terminal (while the dev server is running), verify:

```bash
ls examples/react-router-rsc/.sprinkles/content-layer/
```

Expected: the directory exists and contains `content.d.ts` (and possibly other files).

Open `http://localhost:5173` — the placeholder home page should still render. No validation errors in the dev server terminal output.

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add examples/react-router-rsc/app/content.config.ts examples/react-router-rsc/app/content/
git commit -m "Define blog + authors collections and add first post"
```

---

### Task 4: Implement the home route (blog list)

**Files:**
- Modify: `examples/react-router-rsc/app/routes/home.tsx`

- [ ] **Step 1: Replace the placeholder with the real home route**

Overwrite `app/routes/home.tsx`:

```tsx
import { Link } from "react-router";
import { getCollection } from "sprinkles:content";

export async function ServerComponent() {
    let posts = await getCollection("blog");
    let sorted = posts.toSorted(
        (a, b) => b.data.publishedOn.getTime() - a.data.publishedOn.getTime(),
    );

    return (
        <main>
            <h1 className="mb-6 text-2xl font-bold">Blog</h1>
            <ul className="space-y-4">
                {sorted.map(post => (
                    <li key={post.id}>
                        <Link
                            to={`/blog/${post.id}`}
                            className="block rounded-md p-4 hover:bg-gray-100 dark:hover:bg-gray-900"
                        >
                            <h2 className="text-lg font-semibold">{post.data.title}</h2>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {post.data.summary}
                            </p>
                            <time
                                className="mt-2 block text-xs text-gray-500"
                                dateTime={post.data.publishedOn.toISOString()}
                            >
                                {post.data.publishedOn.toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </time>
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    );
}
```

- [ ] **Step 2: Run dev server and verify**

```bash
cd examples/react-router-rsc
pnpm dev
```

Open `http://localhost:5173`.

Expected:
- Page heading is "Blog"
- One list item for "Hello, world" with its summary and the date "March 1, 2026"
- Hovering the card changes its background
- The card link points to `/blog/hello-world` (check by hovering and reading the URL in the browser's status bar, or right-click → Copy Link)

Clicking the link will 404 at this point — that's expected; we add the detail route in Task 5. Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add examples/react-router-rsc/app/routes/home.tsx
git commit -m "List blog posts on the home route"
```

---

### Task 5: Implement the post detail route with author reference

**Files:**
- Modify: `examples/react-router-rsc/app/routes.ts`
- Create: `examples/react-router-rsc/app/routes/post.tsx`

- [ ] **Step 1: Add the `blog/:slug` route**

Overwrite `app/routes.ts`:

```ts
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("blog/:slug", "routes/post.tsx"),
] satisfies RouteConfig;
```

- [ ] **Step 2: Create `app/routes/post.tsx`**

```tsx
import { getEntry, render } from "sprinkles:content";

import type { Route } from "./+types/post";

export async function ServerComponent({ params }: Route.ComponentProps) {
    let post = await getEntry("blog", params.slug);
    if (!post) {
        throw new Response(null, { status: 404 });
    }

    let author = await getEntry(post.data.author);
    let { Content } = await render(post);

    return (
        <article>
            <header className="mb-6">
                <h1 className="text-3xl font-bold">{post.data.title}</h1>
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    {author && (
                        <>
                            <img
                                src={author.data.avatar}
                                alt=""
                                className="h-6 w-6 rounded-full"
                            />
                            <span>{author.data.name}</span>
                            <span aria-hidden>·</span>
                        </>
                    )}
                    <time dateTime={post.data.publishedOn.toISOString()}>
                        {post.data.publishedOn.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </time>
                </div>
            </header>
            <div className="prose dark:prose-invert">
                <Content />
            </div>
        </article>
    );
}
```

- [ ] **Step 3: Run dev server and verify**

```bash
cd examples/react-router-rsc
pnpm dev
```

Open `http://localhost:5173` and click the "Hello, world" card.

Expected:
- URL becomes `http://localhost:5173/blog/hello-world`
- Page shows the post title as a large heading
- Author row shows the Gravatar avatar for Jane, her name, and the date
- Post body ("Welcome to the Content Layer × React Router RSC example...") renders with typography styling from `@tailwindcss/typography` (noticeably larger and with proper paragraph spacing compared to the raw text)

Also verify the 404 path: visit `http://localhost:5173/blog/does-not-exist`.

Expected: browser shows the `ErrorBoundary` from `root.tsx` with "404" as the heading and "The requested page could not be found." as the details.

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add examples/react-router-rsc/app/routes.ts examples/react-router-rsc/app/routes/post.tsx
git commit -m "Add post detail route with author reference"
```

---

### Task 6: Add a second blog post

**Files:**
- Create: `examples/react-router-rsc/app/content/blog/typed-content.mdx`

Goal: exercise more MDX features (headings, lists, inline code) and show the home list with multiple entries.

- [ ] **Step 1: Create the post**

Create `examples/react-router-rsc/app/content/blog/typed-content.mdx`:

````mdx
---
title: Typed content without the boilerplate
summary: How Content Layer uses Standard Schema to give you typed data without writing a separate TypeScript interface.
publishedOn: 2026-03-15
author: rex
---

## Schemas, not interfaces

You define the shape of your data once — as a schema — and Content Layer hands
you back fully typed query functions. No parallel `interface` declarations, no
drift between runtime validation and compile-time types.

- `getCollection("blog")` returns `CollectionEntry<"blog">[]`
- `getEntry("blog", id)` returns `CollectionEntry<"blog"> | undefined`
- `render(entry)` gives you a `Content` component and the list of headings

## References are typed, too

When a schema field uses `reference("authors")`, resolving it with
`getEntry(post.data.author)` gives you a fully-typed `authors` entry back.
````

- [ ] **Step 2: Run dev server and verify**

```bash
cd examples/react-router-rsc
pnpm dev
```

Open `http://localhost:5173`.

Expected:
- Home page shows TWO cards, sorted newest first:
  1. "Typed content without the boilerplate" (March 15, 2026, by Rex)
  2. "Hello, world" (March 1, 2026, by Jane)
- Click the first card → detail page renders with an `<h2>` "Schemas, not interfaces", a bullet list with inline `<code>` samples, and a second `<h2>` "References are typed, too"
- Author row shows Rex's avatar + name

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add examples/react-router-rsc/app/content/blog/typed-content.mdx
git commit -m "Add second blog post exercising MDX prose"
```

---

### Task 7: Add the CopyCode client component and the post that uses it

**Files:**
- Create: `examples/react-router-rsc/app/components/CopyCode.tsx`
- Create: `examples/react-router-rsc/app/content/blog/client-components-in-mdx.mdx`

- [ ] **Step 1: Create `CopyCode.tsx`**

Create `examples/react-router-rsc/app/components/CopyCode.tsx`:

```tsx
"use client";

import { useState } from "react";

export function CopyCode({ lang, children }: { lang?: string; children: string }) {
    let [copied, setCopied] = useState(false);

    async function handleCopy() {
        await navigator.clipboard.writeText(children.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="relative my-4 overflow-hidden rounded-md bg-gray-950 text-gray-50">
            <button
                type="button"
                onClick={handleCopy}
                className="absolute top-2 right-2 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-200 hover:bg-gray-700"
            >
                {copied ? "Copied!" : "Copy"}
            </button>
            <pre className="overflow-x-auto p-4 pr-20">
                <code className={lang ? `language-${lang}` : undefined}>
                    {children.trim()}
                </code>
            </pre>
        </div>
    );
}
```

- [ ] **Step 2: Create the post that uses it**

Create `examples/react-router-rsc/app/content/blog/client-components-in-mdx.mdx`:

````mdx
---
title: Client components inside server-rendered MDX
summary: MDX served through Content Layer compiles to server components — but nothing stops you from dropping a client component right into the middle of it.
publishedOn: 2026-04-01
author: jane
---

import { CopyCode } from "#/components/CopyCode.tsx";

The `CopyCode` component below has `"use client"` at the top. It runs in the
browser, uses React state, and talks to the clipboard API. It's inlined directly
into this MDX file — which itself is rendered on the server.

<CopyCode lang="sh">npm install @withsprinkles/content-layer</CopyCode>

That's the whole story: server-rendered content, interactive islands, one
mental model.
````

- [ ] **Step 3: Run dev server and verify**

```bash
cd examples/react-router-rsc
pnpm dev
```

Open `http://localhost:5173`.

Expected home page:
- THREE cards total, sorted newest first:
  1. "Client components inside server-rendered MDX" (April 1, 2026)
  2. "Typed content without the boilerplate" (March 15, 2026)
  3. "Hello, world" (March 1, 2026)

Click the first card:
- URL becomes `/blog/client-components-in-mdx`
- Body shows two paragraphs with a dark code block between them reading `npm install @withsprinkles/content-layer`
- Code block has a "Copy" button in its top-right corner

Verify the client interactivity:
- Click the "Copy" button. The label changes to "Copied!" for ~2 seconds, then reverts to "Copy"
- Open a text editor and paste (`Cmd+V`). The pasted text should be `npm install @withsprinkles/content-layer`

Verify it's actually hydrated as a client component:
- Open browser devtools → Network tab → reload the page
- Confirm a client JS chunk for `CopyCode.tsx` is loaded on this route (it will appear as a hashed `.js` file under the route's asset graph)

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add examples/react-router-rsc/app/components/ examples/react-router-rsc/app/content/blog/client-components-in-mdx.mdx
git commit -m "Add CopyCode client component and the MDX post using it"
```

---

### Task 8: Verify the production build and write the README

**Files:**
- Create: `examples/react-router-rsc/README.md`

Goal: confirm the whole thing works under `react-router-serve` (not just the dev server), then document it.

- [ ] **Step 1: Build the example**

```bash
cd examples/react-router-rsc
pnpm build
```

Expected: completes without errors. `build/server/index.js` and `build/client/` directories exist.

- [ ] **Step 2: Start the production server and verify**

```bash
pnpm start
```

Expected: server listens on a port (default `3000`; read the actual port from the log output).

Open the logged URL in a browser. Re-verify the acceptance checks from Tasks 4, 5, 6, and 7 quickly:
- Home page lists three posts in order
- `/blog/hello-world` renders with author and body
- `/blog/does-not-exist` shows the 404 error boundary
- `/blog/client-components-in-mdx` renders the `<CopyCode>` and the Copy button works

Stop the server.

- [ ] **Step 3: Run `typecheck`**

```bash
pnpm typecheck
```

Expected: exits with code 0 and no errors. (If the `.sprinkles/` or `.react-router/` types are stale, re-run `pnpm dev` once to regenerate them, then re-run `typecheck`.)

- [ ] **Step 4: Create `README.md`**

Create `examples/react-router-rsc/README.md`:

````md
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
````

- [ ] **Step 5: Commit**

```bash
git add examples/react-router-rsc/README.md
git commit -m "Add example README"
```

---

## Self-Review

**Spec coverage:**

- §File layout → Task 1 (package.json, tsconfig, gitignore), Task 2 (vite.config, react-router.config, root/routes/home), Task 3 (content.config, authors, hello-world), Task 5 (routes.ts update, post.tsx), Task 6 (typed-content), Task 7 (CopyCode, client-components-in-mdx). README is Task 8. ✓
- §Package configuration — private, type module, workspace dep, mirrored template deps, `imports: { "#/*": "./app/*" }`, four scripts → Task 1 Step 1. ✓
- §Tooling — plugin order, stock `vite`, empty rr config → Task 2 Steps 1–2. ✓
- §Content collections — both collections, reference, data-schema → Task 3 Step 1. ✓
- §Routes — index + `/blog/:slug`, root with Layout/App/ErrorBoundary, home + post routes → Tasks 2, 4, 5. ✓
- §Client component in MDX — `<CopyCode>` with `"use client"`, children as string, used via `#/...` import → Task 7. ✓
- §Content samples — three posts (hello-world, typed-content, client-components-in-mdx) + two authors → Tasks 3, 6, 7. ✓
- §Scripts & running — `pnpm dev` / `pnpm build` / `pnpm start` using `react-router-serve` → Task 1 Step 1 + verified in Task 8. ✓
- §README — covers "what it demonstrates," "how to run it," and a "what to look at" list → Task 8 Step 4. ✓
- §Out of scope — no tests, no deploy config, no ESLint, no layouts — plan does not add any of these. ✓

**Placeholder scan:** No "TBD," no "add appropriate error handling," no "similar to Task N." Each step has either complete code or an exact command. ✓

**Type consistency:**
- `CopyCode` signature: `{ lang?: string; children: string }` — consistent between the component (Task 7 Step 1) and its usage in MDX (Task 7 Step 2). ✓
- `collections` export shape: `{ authors, blog }` — used consistently; `getCollection("blog")`, `getEntry("blog", id)`, `getEntry(post.data.author)` all match. ✓
- `reference("authors")` + `authors.schema` having `id`, `name`, `avatar` — used in `post.tsx` as `author.data.avatar` / `author.data.name`. ✓
- `coerce.date()` + `.publishedOn.toISOString()` / `.getTime()` — consistent across home.tsx, post.tsx. ✓
- Route types: `Route.ComponentProps` in post.tsx, `Route.ErrorBoundaryProps` in root.tsx. Generated by `react-router typegen` from the routes declared in `routes.ts`. ✓
