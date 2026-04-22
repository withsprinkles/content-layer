# Remix 3 Example Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a runnable `examples/remix-3/` example that uses `@withsprinkles/content-layer` with the Remix 3 framework — styled via `css()`, hydrated via `clientEntry()`, navigated via `<Frame>` soft nav, validated via `remix/data-schema`.

**Architecture:** Single pnpm workspace package at `examples/remix-3/`. Server is bare Node HTTP via `remix/fetch-router`. The `<Frame name="content">` inside `Document.tsx` drives both initial and subsequent content rendering — each controller branches on the `x-remix-frame` header to return either a full document or a framed fragment. MDX posts render through Content Layer's Remix adapter, with a `clientEntry()` island (`CopyCode`) embedded inside one of the posts.

**Tech Stack:** Remix 3 (`3.0.0-alpha.4`), `@hiogawa/vite-plugin-fullstack`, `@mdx-js/rollup`, `@withsprinkles/content-layer` (workspace dep via `/remix` subpath), Vite+ (`vp`), TypeScript (`tsgo`), `remix/data-schema` for validation.

**Reference implementations** (read-only; copy from where directed):

- Spec: `/Users/orion/Developer/Libraries/sprinkles/content-layer/docs/superpowers/specs/2026-04-22-remix-3-example-design.md`
- Remix 3 default template: `/Users/orion/Developer/Templates/remix-3-templates/default/`
- Existing RSC example to parallel: `/Users/orion/Developer/Libraries/sprinkles/content-layer/examples/react-router-rsc/`
- Content-layer-on-Remix-3 app for styling patterns: `/Users/orion/Developer/Playgrounds/denver/`

**Working directory for all tasks:** `/Users/orion/Developer/Libraries/sprinkles/content-layer/`

---

## Task 1: Package scaffold

Create the bare package so pnpm recognizes it as a workspace member.

**Files:**

- Create: `examples/remix-3/package.json`
- Create: `examples/remix-3/tsconfig.json`
- Create: `examples/remix-3/.gitignore`

- [ ] **Step 1: Create `examples/remix-3/package.json`**

```json
{
    "name": "@withsprinkles/example-remix-3",
    "private": true,
    "type": "module",
    "imports": {
        "#/*": "./app/*"
    },
    "scripts": {
        "dev": "vp dev",
        "build": "vp build",
        "preview": "vp preview",
        "typecheck": "tsgo --noEmit"
    },
    "dependencies": {
        "@hiogawa/vite-plugin-fullstack": "^0.0.11",
        "@mdx-js/rollup": "^3.1.1",
        "@withsprinkles/content-layer": "workspace:*",
        "remix": "3.0.0-alpha.4"
    },
    "devDependencies": {
        "@types/node": "^25.5.0",
        "@typescript/native-preview": "latest",
        "oxc-parser": "^0.121.0",
        "vite": "npm:@voidzero-dev/vite-plus-core@latest",
        "vite-plus": "latest"
    }
}
```

Note: no `packageManager` / `pnpm` fields here — `pnpm.overrides` is already at the workspace root, and `remix` has no install scripts so `onlyBuiltDependencies` is unnecessary.

- [ ] **Step 2: Create `examples/remix-3/tsconfig.json`**

```json
{
    "include": ["**/*.ts", "**/*.tsx", "./.sprinkles/content-layer/**/*"],
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
        "types": ["@types/node", "vite/client", "@hiogawa/vite-plugin-fullstack/types"],
        "jsx": "react-jsx",
        "jsxImportSource": "remix/component"
    },
    "mdx": {
        "checkMdx": true
    }
}
```

This matches the sibling examples' tsconfig conventions (`lib`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, MDX checking, and a glob `include` that also covers root-level `server.ts`/`vite.config.ts`/`remix.plugin.ts`). The two Remix-3-specific pieces are `jsxImportSource: "remix/component"` and the `@hiogawa/vite-plugin-fullstack/types` entry.

- [ ] **Step 3: Create `examples/remix-3/.gitignore`**

```
.DS_Store
.env
node_modules
dist
.sprinkles
```

- [ ] **Step 4: Install deps from repo root**

Run: `vp install`
Expected: Installs without error. `examples/remix-3/node_modules/` exists; `@withsprinkles/content-layer` is a symlink into the workspace.

- [ ] **Step 5: Commit**

```bash
git add examples/remix-3/package.json examples/remix-3/tsconfig.json examples/remix-3/.gitignore pnpm-lock.yaml
git commit -m "Add examples/remix-3 package scaffold"
```

---

## Task 2: Build tooling

Copy the Remix 3 Vite plugin and add the Vite config + Node server. After this task, `vp dev` will boot but serve nothing (no routes yet).

**Files:**

- Create: `examples/remix-3/remix.plugin.ts`
- Create: `examples/remix-3/vite.config.ts`

`server.ts` is intentionally deferred to Task 3 — it imports from `./app/entry.server.tsx`, which Task 3 creates. Committing `server.ts` here would leave the repo failing `tsgo --noEmit` (and the workspace's pre-commit hook, which type-checks), so it ships in the same commit as its import target.

- [ ] **Step 1: Copy `remix.plugin.ts` verbatim from the Remix 3 default template**

Run: `cp /Users/orion/Developer/Templates/remix-3-templates/default/remix.plugin.ts examples/remix-3/remix.plugin.ts`
Expected: File copied. `examples/remix-3/remix.plugin.ts` is 258 lines. Do not modify this file — it handles the `clientEntry()` AST transform and the dual-build orchestration, and any divergence risks subtle breakage.

- [ ] **Step 2: Create `examples/remix-3/vite.config.ts`**

```ts
import mdx from "@mdx-js/rollup";
import { contentLayer } from "@withsprinkles/content-layer/remix";
import { defineConfig } from "vite-plus";

import { remix } from "./remix.plugin.ts";

export default defineConfig({
    plugins: [contentLayer(), mdx({ jsxImportSource: "remix/component" }), remix()],
    css: { transformer: "lightningcss" },
});
```

Plugin order matters: `contentLayer` must come before `mdx` so the virtual MDX modules exist by the time `mdx()` transforms them.

- [ ] **Step 3: Verify typecheck**

Run: `cd examples/remix-3 && pnpm typecheck && cd -`
Expected: Exit 0. If errors, resolve before committing — this commit must be green because the pre-commit hook type-checks.

- [ ] **Step 4: Commit**

```bash
git add examples/remix-3/remix.plugin.ts examples/remix-3/vite.config.ts
git commit -m "Add Remix 3 vite plugin and vite config"
```

---

## Task 3: Routes, server entry, stub controller, Node server

Wire up just enough that `GET /` returns a plain-text 200. No Document, no Frame, no content — just proof that the router/controller pipeline works. Also lands `server.ts` so the whole commit typechecks (its import target `app/entry.server.tsx` lands in this same commit).

**Files:**

- Create: `examples/remix-3/app/routes.ts`
- Create: `examples/remix-3/app/controllers/home.tsx`
- Create: `examples/remix-3/app/entry.server.tsx`
- Create: `examples/remix-3/server.ts`

- [ ] **Step 1: Create `examples/remix-3/app/routes.ts`**

```ts
import { get, route } from "remix/fetch-router/routes";

export let routes = route({
    home: get("/"),
    post: get("/blog/:slug"),
});
```

- [ ] **Step 2: Create `examples/remix-3/app/controllers/home.tsx` (stub)**

```tsx
import type { Action } from "remix/fetch-router";

export default (async () => {
    return new Response("remix-3 example — home OK", {
        headers: { "content-type": "text/plain; charset=utf-8" },
    });
}) satisfies Action<"GET", "/">;
```

The file exports a single `Action<method, pattern>` rather than a `Controller<RouteMap>` because each of this example's routes (`get("/")`, `get("/blog/:slug")`) is a single `Route`, not a `RouteMap`. `Controller<...>` takes a RouteMap with multiple named actions underneath — that shape applies to `form()` routes (which expand to `{ index: GET, action: POST }`) but not single-method routes. See `node_modules/.pnpm/@remix-run+fetch-router@0.18.0/.../lib/controller.d.ts` for the full type hierarchy.

- [ ] **Step 3: Create `examples/remix-3/app/entry.server.tsx`**

```tsx
import { asyncContext } from "remix/async-context-middleware";
import { createRouter } from "remix/fetch-router";
import { staticFiles } from "remix/static-middleware";

import home from "#/controllers/home.tsx";
import { routes } from "#/routes.ts";

export let router = createRouter({
    middleware: [staticFiles("./dist/client"), asyncContext()],
});

router.map(routes.home, home);

export default router;

if (import.meta.hot) {
    import.meta.hot.accept();
}
```

Use `router.map(routes.home, home)` — not `router.get("/", home)` — so `routes.ts` remains the single source of truth for URL patterns. The `router.map(target, action)` overload accepts a `Route` as target and infers the method and pattern for the action's types.

- [ ] **Step 4: Create `examples/remix-3/server.ts`**

```ts
import http from "node:http";
import { createRequestListener } from "remix/node-fetch-server";

import router from "./app/entry.server.tsx";

let port = process.env.PORT || 3000;

let server = http.createServer(createRequestListener(request => router.fetch(request)));

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
```

`server.ts` is a standalone Node entry for running the built SSR bundle outside of `vp preview`. No script invokes it; keep it as a reference for users who deploy this pattern.

- [ ] **Step 5: Verify typecheck**

Run: `cd examples/remix-3 && pnpm typecheck && cd -`
Expected: Exit 0. If errors reference missing `.sprinkles/content-layer/content.d.ts`, that's fine — it gets generated in Task 8. If errors reference anything else, fix before continuing.

- [ ] **Step 6: Verify dev server**

Run: `cd examples/remix-3 && vp dev` (let it run in the background or a second terminal).
Wait for `vp dev` to print the URL, then `curl -s <URL>/` (typically `http://localhost:5173/`).
Expected: Response body `remix-3 example — home OK`.
Stop `vp dev` after verifying.

- [ ] **Step 7: Commit**

```bash
git add examples/remix-3/app examples/remix-3/server.ts
git commit -m "Add routes, stub home controller, server router, and node server"
```

---

## Task 4: Client entry

Minimal `entry.browser.ts` — just `run()` with the module loader and frame resolver. No custom navigation listener; `run()` installs its own Frame-aware interceptor internally.

**Files:**

- Create: `examples/remix-3/app/entry.browser.ts`

- [ ] **Step 1: Create `examples/remix-3/app/entry.browser.ts`**

```ts
import { run } from "remix/component";

run({
    async loadModule(moduleUrl, exportName) {
        let mod = await import(/* @vite-ignore */ moduleUrl);
        return mod[exportName];
    },
    async resolveFrame(src, signal, target) {
        let headers = new Headers({ accept: "text/html" });
        if (target) headers.set("x-remix-frame", target);
        let response = await fetch(src, { headers, signal });
        return response.body ?? (await response.text());
    },
});
```

- [ ] **Step 2: Verify typecheck**

Run: `cd examples/remix-3 && pnpm typecheck && cd -`
Expected: Exit 0.

- [ ] **Step 3: Commit**

```bash
git add examples/remix-3/app/entry.browser.ts
git commit -m "Add client entry with module loader and frame resolver"
```

---

## Task 5: Base CSS (preflight + theme tokens)

Minimal preflight reset and the CSS custom properties the `css()` mixins will reference.

**Files:**

- Create: `examples/remix-3/app/index.css`

- [ ] **Step 1: Create `examples/remix-3/app/index.css`**

```css
/* Preflight reset */
*,
::before,
::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0 solid;
}

html {
    line-height: 1.5;
    -webkit-text-size-adjust: 100%;
    tab-size: 4;
    font-family: var(--font-sans);
}

h1,
h2,
h3,
h4,
h5,
h6 {
    font-size: inherit;
    font-weight: inherit;
}

a {
    color: inherit;
    text-decoration: inherit;
}

code,
kbd,
samp,
pre {
    font-family: var(--font-mono);
    font-size: 1em;
}

ol,
ul {
    list-style: none;
}

img {
    display: block;
    max-width: 100%;
    height: auto;
}

button {
    cursor: pointer;
    background: transparent;
    color: inherit;
    font: inherit;
}

/* Theme tokens */
:root {
    --font-sans:
        ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
        "Segoe UI Symbol", "Noto Color Emoji";
    --font-mono:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
        monospace;

    --color-white: #ffffff;
    --color-gray-50: oklch(98.5% 0.002 247.839);
    --color-gray-100: oklch(96.7% 0.003 264.542);
    --color-gray-400: oklch(70.7% 0.022 261.325);
    --color-gray-500: oklch(55.1% 0.027 264.364);
    --color-gray-600: oklch(44.6% 0.03 256.802);
    --color-gray-900: oklch(21% 0.034 264.665);
    --color-gray-950: oklch(13% 0.028 261.692);

    --color-slate-100: oklch(96.8% 0.007 247.896);
    --color-slate-200: oklch(92.9% 0.013 255.508);
    --color-slate-700: oklch(37.2% 0.044 257.287);
    --color-slate-800: oklch(27.9% 0.041 260.031);
    --color-slate-900: oklch(20.8% 0.042 265.755);

    --spacing: 0.25rem;
    --radius-sm: 0.125rem;
    --radius-md: 0.375rem;
}
```

- [ ] **Step 2: Commit**

```bash
git add examples/remix-3/app/index.css
git commit -m "Add preflight CSS and theme tokens"
```

---

## Task 6: Styles module

Pre-computed `css()` mixins used across controllers and components. All styling for the example lives here or inline.

**Files:**

- Create: `examples/remix-3/app/styles.ts`

- [ ] **Step 1: Create `examples/remix-3/app/styles.ts`**

```ts
import { css } from "remix/component";

export let htmlStyle = css({
    backgroundColor: "var(--color-white)",
    color: "var(--color-gray-900)",
    "@media (prefers-color-scheme: dark)": {
        backgroundColor: "var(--color-gray-950)",
        color: "var(--color-gray-50)",
    },
});

export let bodyStyle = css({
    fontFamily: "var(--font-sans)",
});

export let containerStyle = css({
    maxWidth: "42rem",
    marginLeft: "auto",
    marginRight: "auto",
    padding: "calc(var(--spacing) * 6)",
});

export let pageHeadingStyle = css({
    fontSize: "1.5rem",
    fontWeight: 700,
    marginBottom: "calc(var(--spacing) * 6)",
});

export let postListStyle = css({
    display: "flex",
    flexDirection: "column",
    gap: "calc(var(--spacing) * 4)",
});

export let postLinkStyle = css({
    display: "block",
    borderRadius: "var(--radius-md)",
    padding: "calc(var(--spacing) * 4)",
    "&:hover": {
        backgroundColor: "var(--color-gray-100)",
    },
    "@media (prefers-color-scheme: dark)": {
        "&:hover": {
            backgroundColor: "var(--color-gray-900)",
        },
    },
});

export let postTitleStyle = css({
    fontSize: "1.125rem",
    fontWeight: 600,
});

export let postSummaryStyle = css({
    marginTop: "calc(var(--spacing) * 1)",
    fontSize: "0.875rem",
    color: "var(--color-gray-600)",
    "@media (prefers-color-scheme: dark)": {
        color: "var(--color-gray-400)",
    },
});

export let postDateStyle = css({
    marginTop: "calc(var(--spacing) * 2)",
    display: "block",
    fontSize: "0.75rem",
    color: "var(--color-gray-500)",
});

export let articleHeaderStyle = css({
    marginBottom: "calc(var(--spacing) * 6)",
});

export let articleTitleStyle = css({
    fontSize: "1.875rem",
    fontWeight: 700,
});

export let articleMetaStyle = css({
    marginTop: "calc(var(--spacing) * 3)",
    display: "flex",
    alignItems: "center",
    gap: "calc(var(--spacing) * 2)",
    fontSize: "0.875rem",
    color: "var(--color-gray-600)",
    "@media (prefers-color-scheme: dark)": {
        color: "var(--color-gray-400)",
    },
});

export let avatarStyle = css({
    width: "1.5rem",
    height: "1.5rem",
    borderRadius: "9999px",
});

export let proseStyle = css({
    "& h2": {
        fontSize: "1.5rem",
        fontWeight: 600,
        marginTop: "calc(var(--spacing) * 8)",
        marginBottom: "calc(var(--spacing) * 4)",
    },
    "& h3": {
        fontSize: "1.25rem",
        fontWeight: 600,
        marginTop: "calc(var(--spacing) * 6)",
        marginBottom: "calc(var(--spacing) * 3)",
    },
    "& p": {
        lineHeight: 1.7,
        marginTop: "calc(var(--spacing) * 4)",
    },
    "& ul, & ol": {
        marginTop: "calc(var(--spacing) * 4)",
        paddingLeft: "calc(var(--spacing) * 6)",
    },
    "& ul": { listStyle: "disc" },
    "& ol": { listStyle: "decimal" },
    "& li": { lineHeight: 1.7, marginTop: "calc(var(--spacing) * 1)" },
    "& :not(pre) > code": {
        fontSize: "0.875em",
        padding: "0.1em 0.3em",
        borderRadius: "var(--radius-sm)",
        backgroundColor: "var(--color-gray-100)",
        "@media (prefers-color-scheme: dark)": {
            backgroundColor: "var(--color-gray-900)",
        },
    },
    "& a": {
        textDecoration: "underline",
    },
    "& strong": { fontWeight: 600 },
    "& em": { fontStyle: "italic" },
});

export let codeBlockContainerStyle = css({
    position: "relative",
    marginTop: "calc(var(--spacing) * 4)",
    marginBottom: "calc(var(--spacing) * 4)",
    overflow: "hidden",
    borderRadius: "var(--radius-md)",
    backgroundColor: "var(--color-slate-900)",
    color: "var(--color-slate-100)",
});

export let codeBlockButtonStyle = css({
    position: "absolute",
    top: "calc(var(--spacing) * 2)",
    right: "calc(var(--spacing) * 2)",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--color-slate-700)",
    backgroundColor: "var(--color-slate-800)",
    padding: "calc(var(--spacing) * 1) calc(var(--spacing) * 2)",
    fontSize: "0.75rem",
    color: "var(--color-slate-200)",
    "&:hover": {
        backgroundColor: "var(--color-slate-700)",
    },
});

export let codeBlockPreStyle = css({
    overflowX: "auto",
    padding:
        "calc(var(--spacing) * 4) calc(var(--spacing) * 20) calc(var(--spacing) * 4) calc(var(--spacing) * 4)",
    fontWeight: 400,
    fontSize: "0.875rem",
});
```

- [ ] **Step 2: Verify typecheck**

Run: `cd examples/remix-3 && pnpm typecheck && cd -`
Expected: Exit 0.

- [ ] **Step 3: Commit**

```bash
git add examples/remix-3/app/styles.ts
git commit -m "Add shared css() mixins"
```

---

## Task 7: Document shell and response helpers

Create the HTML shell (`Document.tsx`) with the named Frame, the `document()` / `frame()` response helpers, and hook them into the home controller. After this, `GET /` returns a full styled HTML page whose body is "Home" fetched through the frame.

**Files:**

- Create: `examples/remix-3/app/components/Document.tsx`
- Create: `examples/remix-3/app/lib/render.tsx`
- Modify: `examples/remix-3/app/controllers/home.tsx`

- [ ] **Step 1: Create `examples/remix-3/app/lib/render.tsx`**

```tsx
import type { RemixNode } from "remix/component";

import { getContext } from "remix/async-context-middleware";
import { renderToStream } from "remix/component/server";
import { createHtmlResponse } from "remix/response/html";

import { router } from "#/entry.server.tsx";

export function document(node: RemixNode): Response {
    let context = getContext();
    return createHtmlResponse(
        renderToStream(node, {
            frameSrc: context.url,
            async resolveFrame(src, target, ctx) {
                let url = new URL(src, ctx?.currentFrameSrc ?? context.url);
                let headers = new Headers({ accept: "text/html" });
                if (target) headers.set("x-remix-frame", target);
                let response = await router.fetch(new Request(url, { headers }));
                if (!response.ok) {
                    throw new Error(`Failed to resolve frame ${url.pathname}`);
                }
                return response.body ?? (await response.text());
            },
        }),
    );
}

export function frame(node: RemixNode): Response {
    return new Response(renderToStream(node), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
}
```

`renderToStream` needs an explicit `resolveFrame` callback when rendering a tree containing `<Frame>` — without it, `defaultResolveFrame` throws "No resolveFrame provided" on the first SSR request. The client's `run({ resolveFrame })` in `entry.browser.ts` only covers client-side soft-nav refetches; the server needs its own implementation that re-enters the router. `frame()` intentionally bypasses `createHtmlResponse` (which wraps in a full document prelude) and returns the stream directly so framed fragments are pure inner HTML.

- [ ] **Step 2: Create `examples/remix-3/app/components/Document.tsx`**

```tsx
import { mergeAssets } from "@hiogawa/vite-plugin-fullstack/runtime";
import { getContext } from "remix/async-context-middleware";
import { Frame } from "remix/component";

import clientAssets from "#/entry.browser.ts?assets=client";
import serverAssets from "#/entry.server.tsx?assets=ssr";
import indexCss from "#/index.css?url";
import { bodyStyle, containerStyle, htmlStyle } from "#/styles.ts";

export function Document() {
    let { url } = getContext();
    let assets = mergeAssets(clientAssets, serverAssets);

    return () => (
        <html lang="en" mix={htmlStyle}>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Content Layer × Remix 3</title>
                <link href={indexCss} rel="stylesheet" />
                {assets.css.map(attrs => (
                    <link key={attrs.href} {...attrs} rel="stylesheet" />
                ))}
                <script async src={clientAssets.entry} type="module" />
                {assets.js.map(attrs => (
                    <link key={attrs.href} {...attrs} rel="modulepreload" />
                ))}
            </head>
            <body mix={bodyStyle}>
                <div mix={containerStyle}>
                    <Frame name="content" src={url.toString()} />
                </div>
            </body>
        </html>
    );
}
```

Note: `Document` returns `() => JSX` — the outer function is the setup phase, the inner function is the render phase. This is Remix 3's two-phase component structure; do not "simplify" it to a single function.

- [ ] **Step 3: Replace `examples/remix-3/app/controllers/home.tsx` with Frame-aware version**

```tsx
import type { Action } from "remix/fetch-router";

import { Document } from "#/components/Document.tsx";
import { document, frame } from "#/lib/render.tsx";

export default (async ctx => {
    if (ctx.headers.get("x-remix-frame") === "content") {
        return frame(<p>Home</p>);
    }
    return document(<Document />);
}) satisfies Action<"GET", "/">;
```

- [ ] **Step 4: Verify typecheck**

Run: `cd examples/remix-3 && pnpm typecheck && cd -`
Expected: Exit 0.

- [ ] **Step 5: Verify in browser**

Run: `cd examples/remix-3 && vp dev`
Open the printed URL (e.g., `http://localhost:5173/`) in a browser.
Expected:

- Page renders with the word "Home".
- View source: the `<html>` / `<head>` / outer `<div>` wrap the content inline (not an iframe).
- DevTools → Network on initial load: one document request.
- DevTools → Network on page reload: one document request; no separate fetch for the frame because SSR handles it internally.

Stop `vp dev`.

- [ ] **Step 6: Commit**

```bash
git add examples/remix-3/app/components/Document.tsx examples/remix-3/app/lib/render.tsx examples/remix-3/app/controllers/home.tsx
git commit -m "Add Document shell with Frame-based soft nav"
```

---

## Task 8: Content collections + first MDX post

Wire up Content Layer. After this, the `sprinkles:content` virtual module exists and types are generated.

**Files:**

- Create: `examples/remix-3/app/content.config.ts`
- Create: `examples/remix-3/app/content/authors.json`
- Create: `examples/remix-3/app/content/blog/hello-world.mdx`

- [ ] **Step 1: Create `examples/remix-3/app/content.config.ts`**

```ts
import { defineCollection, reference } from "@withsprinkles/content-layer";
import { file, glob } from "@withsprinkles/content-layer/loaders";
import * as s from "remix/data-schema";
import * as coerce from "remix/data-schema/coerce";

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

- [ ] **Step 2: Create `examples/remix-3/app/content/authors.json`**

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

- [ ] **Step 3: Create `examples/remix-3/app/content/blog/hello-world.mdx`**

```mdx
---
title: Hello, world
summary: The simplest possible Content Layer post — just proof that the pipeline works end to end.
publishedOn: 2026-03-01
author: jane
---

Welcome to the Content Layer × Remix 3 example.

This post lives at `app/content/blog/hello-world.mdx`. Its frontmatter was
validated against the `blog` collection's schema at build time, and the content
you're reading right now was compiled from MDX into a Remix 3 server component.
```

- [ ] **Step 4: Trigger type generation**

Run: `cd examples/remix-3 && vp dev` — let it start, wait until the URL prints, then stop with Ctrl+C.
Expected: `examples/remix-3/.sprinkles/content-layer/content.d.ts` exists.
Verify: `test -f examples/remix-3/.sprinkles/content-layer/content.d.ts && echo OK`

- [ ] **Step 5: Verify typecheck**

Run: `cd examples/remix-3 && pnpm typecheck && cd -`
Expected: Exit 0. If errors about `sprinkles:content` types, confirm `.sprinkles/content-layer/content.d.ts` exists and `tsconfig.json` include pattern covers it.

- [ ] **Step 6: Commit**

```bash
git add examples/remix-3/app/content.config.ts examples/remix-3/app/content
git commit -m "Add content collections with first MDX post"
```

---

## Task 9: Render post list

Replace the stub `<p>Home</p>` with a real post list pulled from `getCollection("blog")`.

**Files:**

- Modify: `examples/remix-3/app/controllers/home.tsx`

- [ ] **Step 1: Replace `examples/remix-3/app/controllers/home.tsx`**

```tsx
import type { Action } from "remix/fetch-router";
import { getCollection } from "sprinkles:content";

import { Document } from "#/components/Document.tsx";
import { document, frame } from "#/lib/render.tsx";
import {
    pageHeadingStyle,
    postDateStyle,
    postLinkStyle,
    postListStyle,
    postSummaryStyle,
    postTitleStyle,
} from "#/styles.ts";

export default (async ctx => {
    if (ctx.headers.get("x-remix-frame") !== "content") {
        return document(<Document />);
    }
    let posts = (await getCollection("blog")).toSorted(
        (a, b) => b.data.publishedOn.getTime() - a.data.publishedOn.getTime(),
    );
    return frame(
        <main>
            <h1 mix={pageHeadingStyle}>Blog</h1>
            <ul mix={postListStyle}>
                {posts.map(post => (
                    <li key={post.id}>
                        <a href={`/blog/${post.id}`} rmx-target="content" mix={postLinkStyle}>
                            <h2 mix={postTitleStyle}>{post.data.title}</h2>
                            <p mix={postSummaryStyle}>{post.data.summary}</p>
                            <time
                                mix={postDateStyle}
                                dateTime={post.data.publishedOn.toISOString()}
                            >
                                {post.data.publishedOn.toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    timeZone: "UTC",
                                })}
                            </time>
                        </a>
                    </li>
                ))}
            </ul>
        </main>,
    );
}) satisfies Action<"GET", "/">;
```

- [ ] **Step 2: Verify typecheck**

Run: `cd examples/remix-3 && pnpm typecheck && cd -`
Expected: Exit 0.

- [ ] **Step 3: Verify in browser**

Run: `cd examples/remix-3 && vp dev`, open the URL.
Expected:

- Page shows the heading "Blog" and one post ("Hello, world").
- Click the post link → browser tries to navigate to `/blog/hello-world` → responds with 404 or default Remix 3 "not found" (no controller mapped yet — that's Task 10).
  Stop `vp dev`.

- [ ] **Step 4: Commit**

```bash
git add examples/remix-3/app/controllers/home.tsx
git commit -m "Render post list from blog collection"
```

---

## Task 10: Post detail controller

Add the detail page. Wire into `entry.server.tsx` so `/blog/:slug` routes to it.

**Files:**

- Create: `examples/remix-3/app/controllers/post.tsx`
- Modify: `examples/remix-3/app/entry.server.tsx`

- [ ] **Step 1: Create `examples/remix-3/app/controllers/post.tsx`**

```tsx
import type { Action } from "remix/fetch-router";
import { getEntry, render } from "sprinkles:content";

import { Document } from "#/components/Document.tsx";
import { document, frame } from "#/lib/render.tsx";
import {
    articleHeaderStyle,
    articleMetaStyle,
    articleTitleStyle,
    avatarStyle,
    proseStyle,
} from "#/styles.ts";

export default (async ctx => {
    if (ctx.headers.get("x-remix-frame") !== "content") {
        return document(<Document />);
    }
    let post = await getEntry("blog", ctx.params.slug);
    if (!post) {
        return new Response("Not Found", { status: 404 });
    }
    let author = await getEntry(post.data.author);
    let { Content } = await render(post);
    return frame(
        <article>
            <header mix={articleHeaderStyle}>
                <h1 mix={articleTitleStyle}>{post.data.title}</h1>
                <div mix={articleMetaStyle}>
                    {author && (
                        <>
                            <img src={author.data.avatar} alt="" mix={avatarStyle} />
                            <span>{author.data.name}</span>
                            <span aria-hidden>·</span>
                        </>
                    )}
                    <time dateTime={post.data.publishedOn.toISOString()}>
                        {post.data.publishedOn.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            timeZone: "UTC",
                        })}
                    </time>
                </div>
            </header>
            <div mix={proseStyle}>
                <Content />
            </div>
        </article>,
    );
}) satisfies Action<"GET", "/blog/:slug">;
```

`ctx.params.slug` is typed as `string` because the pattern `/blog/:slug` is baked into the `Action` type — the `satisfies` clause threads the pattern through `Params<pattern>` into the handler's context.

- [ ] **Step 2: Wire controller in `examples/remix-3/app/entry.server.tsx`**

Replace the contents of the file with:

```tsx
import { asyncContext } from "remix/async-context-middleware";
import { createRouter } from "remix/fetch-router";
import { staticFiles } from "remix/static-middleware";

import home from "#/controllers/home.tsx";
import post from "#/controllers/post.tsx";
import { routes } from "#/routes.ts";

export let router = createRouter({
    middleware: [staticFiles("./dist/client"), asyncContext()],
});

router.map(routes.home, home);
router.map(routes.post, post);

export default router;

if (import.meta.hot) {
    import.meta.hot.accept();
}
```

- [ ] **Step 3: Verify typecheck**

Run: `cd examples/remix-3 && pnpm typecheck && cd -`
Expected: Exit 0.

- [ ] **Step 4: Verify in browser**

Run: `cd examples/remix-3 && vp dev`, open the URL.
Expected:

- Home shows the post list.
- Click the "Hello, world" post → URL changes to `/blog/hello-world`, content frame swaps to show the article (title, author avatar, author name, date, body).
- DevTools → Network: the click fires a single request to `/blog/hello-world` with header `x-remix-frame: content`. No full page reload.
- Navigate to a bogus slug (`http://localhost:5173/blog/does-not-exist`): 404 response.
  Stop `vp dev`.

- [ ] **Step 5: Commit**

```bash
git add examples/remix-3/app/controllers/post.tsx examples/remix-3/app/entry.server.tsx
git commit -m "Add post detail controller"
```

---

## Task 11: Remaining MDX posts

Add the two remaining posts. The `client-components-in-mdx` post is added _without_ the `<CopyCode>` import for now — that comes in Task 13.

**Files:**

- Create: `examples/remix-3/app/content/blog/typed-content.mdx`
- Create: `examples/remix-3/app/content/blog/client-components-in-mdx.mdx`

- [ ] **Step 1: Create `examples/remix-3/app/content/blog/typed-content.mdx`**

```mdx
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
```

This file is verbatim from the React Router RSC example — the prose is framework-agnostic and should read identically across examples.

- [ ] **Step 2: Create `examples/remix-3/app/content/blog/client-components-in-mdx.mdx`**

Note: the prose is **adapted** from the React Router version — in Remix 3, the island mechanism is `clientEntry()`, not the `"use client"` directive, and there's no React state.

```mdx
---
title: Client components inside server-rendered MDX
summary: MDX served through Content Layer compiles to server components — but nothing stops you from dropping a client-hydrated island right into the middle of it.
publishedOn: 2026-04-01
author: jane
---

The `CopyCode` island below is wrapped in `clientEntry()`. It runs in the
browser, manages its own state via Remix 3's closure-plus-`handle.update()`
pattern, and talks to the clipboard API. It's inlined directly into this MDX
file — which itself is rendered on the server.

That's the whole story: server-rendered content, interactive islands, one
mental model.
```

The `<CopyCode />` usage is intentionally omitted here — Task 13 adds it after the component exists.

- [ ] **Step 3: Verify in browser**

Run: `cd examples/remix-3 && vp dev`.
Expected:

- Home shows three posts, sorted by `publishedOn` descending: "Client components inside server-rendered MDX" (Apr 1), "Typed content without the boilerplate" (Mar 15), "Hello, world" (Mar 1).
- Clicking each renders its article body via the content frame.
- The "Client components" post has no `<CopyCode>` yet — just prose.
  Stop `vp dev`.

- [ ] **Step 4: Commit**

```bash
git add examples/remix-3/app/content/blog/typed-content.mdx examples/remix-3/app/content/blog/client-components-in-mdx.mdx
git commit -m "Add remaining MDX posts (without CopyCode yet)"
```

---

## Task 12: CopyCode clientEntry island

Port the React Router `<CopyCode>` to Remix 3 — closure state instead of `useState`, `on("click", …)` mixin instead of `onClick` prop, `handle.update()` to re-render.

**Files:**

- Create: `examples/remix-3/app/components/CopyCode.tsx`

- [ ] **Step 1: Create `examples/remix-3/app/components/CopyCode.tsx`**

```tsx
import { clientEntry, on } from "remix/component";

import { codeBlockButtonStyle, codeBlockContainerStyle, codeBlockPreStyle } from "#/styles.ts";

export let CopyCode = clientEntry(import.meta.url, handle => {
    let copied = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    return ({ lang, children }: { lang?: string; children: string }) => (
        <div mix={codeBlockContainerStyle}>
            <button
                type="button"
                mix={[
                    codeBlockButtonStyle,
                    on("click", async () => {
                        await navigator.clipboard.writeText(children.trim());
                        copied = true;
                        handle.update();
                        clearTimeout(timeout);
                        timeout = setTimeout(() => {
                            copied = false;
                            handle.update();
                        }, 2000);
                    }),
                ]}
            >
                {copied ? "Copied!" : "Copy"}
            </button>
            <pre mix={codeBlockPreStyle}>
                <code className={lang ? `language-${lang}` : undefined}>{children.trim()}</code>
            </pre>
        </div>
    );
});
```

Structural notes:

- `clientEntry(import.meta.url, setup)` wraps the component — `remix.plugin.ts` AST-rewrites `import.meta.url` on the server side to point at the hydration chunk.
- `let copied = false` is a closure variable, not React state. `handle.update()` tells the runtime to re-run the inner render function.
- The button's `on("click", …)` mixin is composed alongside `codeBlockButtonStyle` in the `mix` array — that's how Remix 3 attaches event listeners.

- [ ] **Step 2: Verify typecheck**

Run: `cd examples/remix-3 && pnpm typecheck && cd -`
Expected: Exit 0.

- [ ] **Step 3: Commit**

```bash
git add examples/remix-3/app/components/CopyCode.tsx
git commit -m "Add CopyCode clientEntry island"
```

---

## Task 13: Use CopyCode in MDX content

Add the `<CopyCode>` usage to `client-components-in-mdx.mdx`.

**Files:**

- Modify: `examples/remix-3/app/content/blog/client-components-in-mdx.mdx`

- [ ] **Step 1: Replace `examples/remix-3/app/content/blog/client-components-in-mdx.mdx`**

```mdx
---
title: Client components inside server-rendered MDX
summary: MDX served through Content Layer compiles to server components — but nothing stops you from dropping a client-hydrated island right into the middle of it.
publishedOn: 2026-04-01
author: jane
---

import { CopyCode } from "#/components/CopyCode.tsx";

The `CopyCode` island below is wrapped in `clientEntry()`. It runs in the
browser, manages its own state via Remix 3's closure-plus-`handle.update()`
pattern, and talks to the clipboard API. It's inlined directly into this MDX
file — which itself is rendered on the server.

<CopyCode lang="sh">npm install @withsprinkles/content-layer</CopyCode>

That's the whole story: server-rendered content, interactive islands, one
mental model.
```

The `#/components/CopyCode.tsx` import path uses the `package.json` `imports` field — Node/bundler module resolver handles it, which matters here because MDX virtual modules do **not** resolve tsconfig `paths` aliases.

- [ ] **Step 2: Verify end-to-end in browser**

Run: `cd examples/remix-3 && vp dev`, open the URL.
Expected:

- Navigate to "Client components inside server-rendered MDX" post.
- A styled code block renders with `npm install @withsprinkles/content-layer` inside and a "Copy" button in the top-right.
- Clicking "Copy":
    - Text is in the clipboard (paste it somewhere to verify).
    - Button label flips to "Copied!".
    - After ~2s, label reverts to "Copy".
- Soft-nav test: from the home page, click this post → URL updates, content frame swaps, CopyCode hydrates and works. The page does NOT fully reload.

Stop `vp dev`.

- [ ] **Step 3: Commit**

```bash
git add examples/remix-3/app/content/blog/client-components-in-mdx.mdx
git commit -m "Use CopyCode island in client-components MDX post"
```

---

## Task 14: README and final verification

Write the example README and run the full verification sweep.

**Files:**

- Create: `examples/remix-3/README.md`

- [ ] **Step 1: Create `examples/remix-3/README.md`**

````markdown
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
````

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

````

- [ ] **Step 2: Run typecheck**

Run: `cd examples/remix-3 && pnpm typecheck && cd -`
Expected: Exit 0.

- [ ] **Step 3: Run dev and verify in a browser**

Run: `cd examples/remix-3 && vp dev` in one terminal.
Open the printed URL.
Expected:
- Home page renders with three posts sorted by `publishedOn` descending.
- Click through to each post — content frame swaps (URL updates, chrome stays).
- CopyCode button works on the `client-components-in-mdx` post (text copied, label flips to "Copied!", reverts after 2s).
- Console is clean.
Stop the dev server.

- [ ] **Step 4: Production build (expect upstream failure)**

Run: `cd examples/remix-3 && pnpm build && cd -`
Expected as of 2026-04: **fails** with `TypeError: Cannot read properties of undefined (reading 'isBuilt')` at `builder.build` in the remix plugin's compat wrapper. This is an upstream Remix 3 + Vite+ integration issue — the same error reproduces in the canonical `/Users/orion/Developer/Templates/remix-3-templates/default/` template, so it is not something this example can fix. Skip build verification until upstream resolves. Do NOT modify `remix.plugin.ts` — it is a verbatim copy of the template's plugin and patching it here would drift from upstream.

- [ ] **Step 5: Commit**

```bash
git add examples/remix-3/README.md
git commit -m "Add README for Remix 3 example"
````

---

## Done criteria

- All 14 tasks above complete with their commits.
- `cd examples/remix-3 && pnpm typecheck` exits 0.
- `cd examples/remix-3 && vp dev` starts cleanly; list → detail nav via Frame works; CopyCode hydration works; no full-page reload on nav.
- `pnpm build` / `pnpm preview` currently fail due to an upstream Remix 3 plugin bug (see Step 4). Tracked separately in bd.
- The example's file tree matches §2 of the spec at `docs/superpowers/specs/2026-04-22-remix-3-example-design.md`.
