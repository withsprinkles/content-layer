# Remix 3 Example

## Purpose

Add a minimal, runnable example at `examples/remix-3/` that demonstrates how to use `@withsprinkles/content-layer` with Remix 3 — the server-first, non-React, non-RSC framework whose signature idioms are the `css()` styling mixin, `clientEntry()` hydration islands, and `<Frame>` soft navigation.

The example answers "how do I wire Content Layer into a Remix 3 app?" for a reader who already knows the Content Layer API from the other examples and wants to see it expressed in Remix 3's conventions. The content (two authors, three MDX posts) is identical to the React Router / TanStack / Redwood / Waku examples so a reader comparing them sees framework differences, not content differences.

The example is deliberately named `remix-3/`, not `remix-3-rsc/` — Remix 3 has no React Server Components. It is a distinct runtime with its own component model.

Everything not load-bearing for the purpose above is excluded (see §11).

## File layout

```
examples/remix-3/
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── remix.plugin.ts
├── server.ts
└── app/
    ├── entry.browser.ts
    ├── entry.server.tsx
    ├── routes.ts
    ├── content.config.ts
    ├── index.css
    ├── styles.ts
    ├── components/
    │   ├── CopyCode.tsx
    │   └── Document.tsx
    ├── controllers/
    │   ├── home.tsx
    │   └── post.tsx
    ├── lib/
    │   └── render.tsx
    └── content/
        ├── authors.json
        └── blog/
            ├── hello-world.mdx
            ├── typed-content.mdx
            └── client-components-in-mdx.mdx
```

## Package configuration

`package.json`:

- `"private": true`, `"type": "module"`, `"name": "@withsprinkles/example-remix-3"`.
- Depends on `@withsprinkles/content-layer` via `"workspace:*"`.
- Runtime deps mirror the Remix 3 default template: `remix@3.0.0-alpha.4`, `@hiogawa/vite-plugin-fullstack@^0.0.11`, `@mdx-js/rollup@^3.1.1`.
- No React. No Tailwind. No framework-specific CLI package (Remix 3 has none — the build tooling is the local `remix.plugin.ts`).
- Uses Node's native subpath `imports` field for aliasing, matching the Remix 3 template convention:

    ```json
    "imports": {
        "#/*": "./app/*"
    }
    ```

    Source and MDX files import local modules as `#/components/CopyCode.tsx`. This matters for MDX in particular: the `sprinkles:content` virtual module does not resolve tsconfig `paths` aliases, but `#/*` imports work because they are resolved by the Node/bundler module resolver, not by TypeScript path mapping.

- `"packageManager": "pnpm@10.33.0"` (matches the workspace).
- `pnpm` overrides:

    ```json
    "pnpm": {
        "overrides": { "vite": "npm:@voidzero-dev/vite-plus-core@latest" },
        "onlyBuiltDependencies": ["remix"]
    }
    ```

    Matches the default template. `onlyBuiltDependencies: ["remix"]` is required because the `remix` package has postinstall build steps that pnpm otherwise declines to run.

- Scripts:
    - `"dev": "vp dev"`
    - `"build": "vp build"`
    - `"preview": "vp preview"`
    - `"typecheck": "tsgo --noEmit"`

    Unlike the React Router example (which uses `react-router dev`), Remix 3 has no framework CLI wrapper — you run Vite directly. Through Vite+, that is `vp dev`. Consistent with the Remix 3 default template.

The monorepo-level `pnpm-workspace.yaml` already includes `examples/*`, so no change there.

## Tooling

`vite.config.ts`:

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

Three load-bearing details:

1. `contentLayer` comes from `@withsprinkles/content-layer/remix`, not `/react`. The Remix adapter wraps MDX entries as Remix component factories (`() => () => RemixNode`), not React `ComponentType`. Using the `/react` adapter here would produce components that Remix cannot render.
2. `jsxImportSource: "remix/component"` on the MDX plugin. MDX compiles to JSX calls; those calls must resolve to Remix 3's JSX runtime (not React's).
3. Plugin order: `contentLayer` before `mdx` so the virtual MDX modules created by `contentLayer` exist by the time `mdx()` transforms them. Same rule as the React Router example.

Unlike the React Router example, this one uses `vite-plus` (not stock `vite`) because Remix 3's default template itself uses Vite+ — mirroring that template makes the example portable back to a fresh `create-remix` scaffold. `lightningcss` as the CSS transformer matches the template.

`remix.plugin.ts` is copied verbatim from the Remix 3 default template. It is not published as a package; it is convention to keep it in-repo. It handles two transforms:

- Rewrites `import.meta.url` inside `clientEntry()` call sites so the server emits the resolved client chunk URL, while the client keeps its original module URL.
- Drives the `@hiogawa/vite-plugin-fullstack` dual-build (client + SSR bundles from one config).

`server.ts` is a bare Node HTTP server matching the default template:

```ts
import http from "node:http";
import { createRequestListener } from "remix/node-fetch-server";
import router from "./app/entry.server.tsx";

let port = process.env.PORT ?? 3000;
http.createServer(createRequestListener(request => router.fetch(request))).listen(port);
```

No Express, no Hono, no wrapping middleware.

`tsconfig.json` matches the template:

- `"jsx": "react-jsx"` with `"jsxImportSource": "remix/component"` so `.tsx` files in the example compile against Remix's JSX runtime.
- `"moduleResolution": "bundler"`, `"module": "ESNext"`, `"target": "ESNext"`.
- `"noEmit": true` — TypeScript is type-check-only; Vite handles emit.
- `"include": ["app", "./.sprinkles/content-layer/**/*"]` so the generated `content.d.ts` is picked up.
- `"types": ["@types/node", "vite/client", "@hiogawa/vite-plugin-fullstack/types"]`.

## Content collections

`app/content.config.ts` uses `remix/data-schema` — same shape as the React Router example, different package:

```ts
import * as s from "remix/data-schema";
import * as coerce from "remix/data-schema/coerce";
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

Same three API surfaces exercised as the other examples: `glob` loader, `file` loader, and `reference()`. The only line that differs from the React Router example is the import source (`remix/data-schema` instead of `@remix-run/data-schema`).

## Routes, controllers, and Frames

`app/routes.ts`:

```ts
import { get, route } from "remix/fetch-router/routes";

export let routes = route({
    home: get("/"),
    post: get("/blog/:slug"),
});
```

No file-based routing. Routes are explicit patterns; controllers map to them by key.

`app/entry.server.tsx` wires the router:

```ts
import { createRouter } from "remix/fetch-router";
import { staticFiles } from "remix/static-middleware";
import { asyncContext } from "remix/async-context-middleware";
import { routes } from "#/routes.ts";
import home from "#/controllers/home.tsx";
import post from "#/controllers/post.tsx";

export let router = createRouter({
    middleware: [staticFiles("./dist/client"), asyncContext()],
});

router.map(routes.home, home);
router.map(routes.post, post);

export default router;

if (import.meta.hot) import.meta.hot.accept();
```

No `database()` middleware, no `formData()` middleware, no `public/` folder (the example ships no static assets; favicons and similar are out of scope). The single `staticFiles("./dist/client")` entry serves Vite's build output in preview mode.

`app/components/Document.tsx` renders the HTML shell and delegates the content region to a named `<Frame>`:

```tsx
import { getContext } from "remix/async-context-middleware";
import { Frame, css } from "remix/component";
import clientAssets from "#/entry.browser.ts?assets=client";
import serverAssets from "#/entry.server.tsx?assets=ssr";
import { mergeAssets } from "@hiogawa/vite-plugin-fullstack/runtime";
import styles from "#/index.css?url";

export function Document() {
    let { url } = getContext();
    let assets = mergeAssets(clientAssets, serverAssets);
    return () => (
        <html lang="en" mix={htmlStyle}>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Content Layer × Remix 3</title>
                <link href={styles} rel="stylesheet" />
                {assets.css.map(attrs => (
                    <link key={attrs.href} {...attrs} rel="stylesheet" />
                ))}
                <script async src={clientAssets.entry} type="module" />
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

The Frame is the navigation surface. On initial request the Frame fetches its `src` (the current URL) by re-entering the router with `x-remix-frame: content`, and the router inlines the response body into the document stream. On subsequent client-side navigations intercepted by `entry.browser.ts`, the browser fetches the new URL with the same header and swaps the Frame's DOM body — the `<html>` / `<head>` / outer container are untouched.

Each controller handles both cases by branching on the `x-remix-frame` header — full-page requests return `document(<Document />)` (the Frame drives the content fetch), framed requests return `frame(<ContentView />)` directly:

```ts
// app/controllers/home.tsx
import type { Controller } from "remix/fetch-router";
import { getCollection } from "sprinkles:content";
import { Document } from "#/components/Document.tsx";
import { routes } from "#/routes.ts";
import { document, frame } from "#/lib/render.tsx";

export default {
    actions: {
        async home(ctx) {
            if (ctx.headers.get("x-remix-frame") === "content") {
                let posts = (await getCollection("blog")).toSorted(
                    (a, b) => b.data.publishedOn.getTime() - a.data.publishedOn.getTime(),
                );
                return frame(<PostList posts={posts} />);
            }
            return document(<Document />);
        },
    },
} satisfies Controller<typeof routes.home>;
```

`app/controllers/post.tsx` follows the same branching pattern — calls `getEntry("blog", params.slug)`, resolves the author with `getEntry(post.data.author)`, calls `render(post)` to get the MDX `Content` component, returns 404 via `new Response("Not Found", { status: 404 })` if the slug is missing. The rendered view mirrors the React Router example's post layout (title, author avatar + name, date, `<Content />`).

`app/lib/render.tsx` centralizes the two response shapes:

```ts
import type { RemixNode } from "remix/component";
import { renderToStream } from "remix/component/server";
import { createHtmlResponse } from "remix/response/html";

export function document(node: RemixNode): Response {
    return createHtmlResponse(renderToStream(node));
}

export function frame(node: RemixNode): Response {
    return createHtmlResponse(renderToStream(node));
}
```

The two helpers are intentionally separate even though they share an implementation — it documents the intent at call sites and leaves room for either branch to diverge (e.g., adding a `Vary` header on framed responses).

`app/entry.browser.ts` is minimal — just the `run()` call providing the module loader and frame resolver:

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

No custom `navigation.addEventListener("navigate", …)` handler. `run()` installs its own Frame-aware navigation interceptor internally; the custom listener in the Remix 3 default template exists only to handle form submissions and manual focus management, neither of which apply here.

List-page anchor tags get `rmx-target="content"` so clicking a post swaps only the frame; the `<html>` shell and `<head>` remain untouched between navigations.

## Client component in MDX

`app/components/CopyCode.tsx` uses `clientEntry()` — Remix 3's island primitive — with its two-phase setup/render structure:

```tsx
import { clientEntry, css, on } from "remix/component";

export let CopyCode = clientEntry(import.meta.url, handle => {
    let copied = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    return ({ lang, children }: { lang?: string; children: string }) => (
        <div mix={containerStyle}>
            <button
                type="button"
                mix={[
                    buttonStyle,
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
            <pre mix={preStyle}>
                <code className={lang ? `language-${lang}` : undefined}>{children.trim()}</code>
            </pre>
        </div>
    );
});
```

Three things that are structurally different from the React Router version:

1. No `"use client"` directive — the `clientEntry(import.meta.url, …)` wrapper is the marker. `remix.plugin.ts` rewrites the call to point at the hydration chunk.
2. State is a plain closure variable (`let copied = false`), not `useState`. `handle.update()` triggers a re-render of this island.
3. Event handlers are mixins (`on("click", …)`), not JSX props. Mixins are composed into the `mix` array alongside styles.

Used inside `client-components-in-mdx.mdx`:

```mdx
import { CopyCode } from "#/components/CopyCode.tsx";

<CopyCode lang="sh">npm install @withsprinkles/content-layer</CopyCode>
```

The same point the other examples make — a server-rendered MDX page can host a client-side interactive island — expressed in Remix 3's idiom rather than React's.

## Styling with `css()`

No Tailwind. Styling uses the `css()` mixin from `remix/component`, applied via the `mix` attribute.

`app/styles.ts` exports pre-computed mixins for shared elements: `htmlStyle`, `bodyStyle`, `containerStyle`, `headingStyle`, `listItemStyle`, `linkStyle`, `postMetaStyle`, `avatarStyle`, `proseStyle`, `codeBlockContainerStyle`, `codeBlockButtonStyle`, `codeBlockPreStyle`. One-off styles stay inline as `mix={css({...})}`.

`app/index.css` holds:

- A compact preflight (box-sizing reset, default margins, monospace default for `pre`/`code`).
- `:root` custom properties: color scale (`--color-gray-50`..`--color-gray-950`, `--color-slate-*` for code blocks), `--font-sans`, `--spacing`, `--radius-md`.
- `@media (prefers-color-scheme: dark)` overrides for the color custom properties.

Visual parity target: the rendered output should look essentially identical to the React Router RSC example (same color scale, same spacing, same dark-mode flip). This matters because the examples sit side-by-side in the repo — visual differences would imply semantic differences that aren't there.

`proseStyle` is the longest piece of bespoke CSS — it replaces `@tailwindcss/typography`'s `prose` class by styling headings, paragraphs, lists, blockquotes, inline `code`, and `pre` via descendant selectors on a wrapping element:

```ts
export let proseStyle = css({
    "& h2": { fontSize: "1.5rem", fontWeight: 600, marginTop: "calc(var(--spacing) * 6)" },
    "& p": { lineHeight: 1.7, marginTop: "calc(var(--spacing) * 4)" },
    "& :not(pre) > code": {
        fontSize: "0.875em",
        padding: "0.1em 0.3em",
        borderRadius: "var(--radius-sm)",
        backgroundColor: "var(--color-gray-100)",
    },
    // ... headings 3-4, ul, ol, li, blockquote, a, strong, em, hr
});
```

It is a moderate amount of CSS (~50 lines) — enough to make the three posts look readable, not so much that it starts feeling like its own styling system.

## Content samples

Three posts in `app/content/blog/` — same slugs as the other examples so cross-example comparison is clean:

- `hello-world.mdx` — trivially short, validates the list → detail flow and the `author: jane` reference.
- `typed-content.mdx` — longer prose about schema validation, exercises headings / lists / inline code, references `rex`.
- `client-components-in-mdx.mdx` — imports `<CopyCode />` and embeds it.

Two authors in `app/content/authors.json` (array with `id` field): `jane` and `rex`, same Gravatar placeholder URLs as the other examples.

MDX prose is adapted where it mentions React — e.g., "`'use client'` component" becomes "`clientEntry()` island" — so the content description matches the rendered behavior.

## Scripts & running

From the example directory:

- `pnpm dev` → `vp dev` (Vite+ dev server, HMR, calls the fullstack plugin's client + SSR builds)
- `pnpm build` → `vp build` (produces `dist/client/` + `dist/server/`)
- `pnpm preview` → `vp preview`
- `pnpm typecheck` → `tsgo --noEmit`

The monorepo root `pnpm install` is sufficient; no per-example install step.

## README

`examples/remix-3/README.md` covers, briefly:

1. What the example demonstrates (one paragraph; emphasizes that Remix 3 is not React and not RSC).
2. How to run it (`pnpm install` at the root, then `pnpm dev` / `pnpm build` / `pnpm preview`).
3. A "What to look at" section pointing to the five interesting files in order: `vite.config.ts`, `app/content.config.ts`, `app/components/Document.tsx`, `app/controllers/post.tsx`, `app/content/blog/client-components-in-mdx.mdx`.
4. A short "How Remix 3 differs" callout — `css()` vs Tailwind, `clientEntry()` vs `"use client"`, `<Frame>` vs full-page nav — so a reader arriving from the React Router example isn't surprised by the structural differences.
5. Link back to the main package README for full API docs.

## Out of scope

- No tests. Example correctness is verified by rendering in a browser and running `tsgo --noEmit` during implementation.
- No deployment config (no Dockerfile, no wrangler, no Fly/Vercel config).
- No ESLint or Oxlint config beyond workspace defaults.
- No database, no forms, no `formData()` middleware, no guest-book-style interactive demo.
- No custom middleware beyond `staticFiles` + `asyncContext`.
- No `getEntries` (plural) usage — `getEntry` + `reference()` covers reference resolution.
- No syntax highlighting for `CopyCode`.
- No dark-mode toggle — dark mode is `prefers-color-scheme`-driven only.
- No site metadata helpers beyond a static `<title>` in `Document.tsx`.
- No nested Frames, no `rmx-src` usage beyond what the default interceptor requires, no scroll restoration customization.
- No Cloudflare target (denver uses `@cloudflare/vite-plugin`; this example runs Node via `server.ts` to keep the surface small).
