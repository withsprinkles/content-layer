# @withsprinkles/content-layer

Load, validate, and query local content as typed data in Vite apps.

Content Layer is a Vite plugin that turns local files (Markdown, MDX, JSON, YAML) into fully typed, validated, and queryable collections available at build time and during development with HMR.

## Install

```sh
# Install with Vite+
vp add @withsprinkles/content-layer

# Or use a package manager directly
npm add @withsprinkles/content-layer
yarn add @withsprinkles/content-layer
pnpm add @withsprinkles/content-layer
bun add @withsprinkles/content-layer
deno add npm:@withsprinkles/content-layer
```

## Quick Start

### 1. Add the plugin

```ts
// vite.config.ts
import { defineConfig } from "vite-plus";

import { contentLayer } from "@withsprinkles/content-layer/react";

export default defineConfig({
    plugins: [contentLayer()],
});
```

A Remix adapter is also available:

```ts
import { contentLayer } from "@withsprinkles/content-layer/remix";
```

### 2. Define collections

Create a content config file (defaults to `app/content.config.ts`):

```ts
// app/content.config.ts
import { defineCollection, reference } from "@withsprinkles/content-layer";
import { glob, file } from "@withsprinkles/content-layer/loaders";
import { z } from "zod"; // or any Standard Schema-compatible library

export const collections = {
    blog: defineCollection({
        loader: glob({ pattern: "**/*.mdx", base: "app/content/blog" }),
        schema: z.object({
            title: z.string(),
            date: z.coerce.date(),
            author: reference("authors"),
        }),
    }),
    authors: defineCollection({
        loader: file("app/content/authors.json"),
        schema: z.object({
            name: z.string(),
            avatar: z.string().url(),
        }),
    }),
};
```

### 3. Query content

```ts
import { getCollection, getEntry, render } from "sprinkles:content";

// Get all entries in a collection
let posts = await getCollection("blog");

// Filter entries
let recentPosts = await getCollection("blog", entry => entry.data.date > new Date("2025-01-01"));

// Get a single entry by slug
let post = await getEntry("blog", "my-first-post");

// Resolve a reference
let author = await getEntry(post.data.author);

// Render markdown/MDX body to a component
let { Content, headings } = await render(post);
```

## Loaders

### `glob`

Loads multiple files matching a glob pattern. Supports Markdown, MDX, JSON, JSONC, and YAML.

```ts
import { glob } from "@withsprinkles/content-layer/loaders";

glob({
    pattern: "**/*.md", // string or string[]
    base: "./content/blog", // directory to resolve patterns against
    generateId: ({ entry, base, data }) => entry.replace(/\.md$/, ""),
});
```

Entry IDs are derived from the file path relative to `base`, with the extension stripped. Markdown and MDX files have their frontmatter parsed as `data` and their content available as `body`.

### `file`

Loads a single JSON, JSONC, or YAML file containing multiple entries.

```ts
import { file } from "@withsprinkles/content-layer/loaders";

// Array format — each item must have an `id` field
file("content/authors.json");

// Object format — keys become entry IDs
file("content/authors.yaml");

// Custom parser
file("content/data.toml", {
    parser: text => parseToml(text),
});
```

## Schema Validation

Schemas use the [Standard Schema](https://github.com/standard-schema/standard-schema) spec, so any compatible validation library works — Zod, Valibot, ArkType, and others.

The `reference()` helper creates a schema that validates a string ID and resolves it to an entry in another collection:

```ts
import { defineCollection, reference } from "sprinkles:content";

schema: z.object({
    author: reference("authors"), // validates string, resolves to { collection, id }
    tags: z.array(reference("tags")), // array of references
});
```

## Type Generation

The plugin automatically generates TypeScript declarations at `.sprinkles/content-layer/content.d.ts`. The `sprinkles:content` module is fully typed — `getCollection`, `getEntry`, `getEntries`, and `render` all infer their return types from your schema definitions.

## Plugin Options

```ts
contentLayer({
    configPath: "app/content.config.ts", // path to your content config (default)
});
```

## Framework Integration

Content Layer ships separate entrypoints for React (RSC) and Remix, each tailored to how that framework handles components. Both require `@mdx-js/rollup` to compile MDX content into components.

### React (Server Components)

The React adapter is designed for React Server Components. It adds `import "server-only"` to the virtual module, so all content queries (`getCollection`, `getEntry`, `render`) are guaranteed to run only on the server. The `Content` component returned by `render()` is a standard `React.ComponentType`.

```ts
// vite.config.ts
import mdx from "@mdx-js/rollup";
import { defineConfig } from "vite-plus";

import { contentLayer } from "@withsprinkles/content-layer/react";

export default defineConfig({
    plugins: [
        contentLayer(),
        mdx(),
        // ... your other plugins (react-router, rsc, etc.)
    ],
});
```

Content is queried and rendered in async server components:

```tsx
import { getEntry, render } from "sprinkles:content";

export async function ServerComponent({ params }) {
    let post = await getEntry("blog", params.slug);
    let { Content, headings } = await render(post);

    return (
        <article>
            <h1>{post.data.title}</h1>
            <Content />
        </article>
    );
}
```

Client components work alongside content as usual — use `"use client"` for interactive pieces and compose them with server-rendered content:

```tsx
// Interactive component — "use client"
// Static content — server component (default)
<article>
    <Content /> {/* Server-rendered MDX */}
    <ProgressBar steps={headings} /> {/* Client-side interactivity */}
</article>
```

As well as within MDX:

```mdx
{/* Interactive component — "use client" */}
{/* Static content — server component (default) */}

<article>
    <h1>Header</h1> {/* Server-rendered MDX */}
    <ProgressBar steps={3} /> {/* Client-side interactivity */}
</article>
```

### Remix

The Remix adapter wraps MDX components in a factory pattern to match Remix's component conventions. The `Content` returned by `render()` has the type `() => () => RemixNode`.

MDX must be configured with `jsxImportSource: "remix/component"`:

```ts
// vite.config.ts
import mdx from "@mdx-js/rollup";
import { defineConfig } from "vite-plus";

import { contentLayer } from "@withsprinkles/content-layer/remix";

export default defineConfig({
    plugins: [
        contentLayer(),
        mdx({ jsxImportSource: "remix/component" }),
        // ... your other plugins (remix, etc.)
    ],
});
```

Content is queried in server-side handlers and rendered as Remix components:

```tsx
import { getCollection, getEntry, render } from "sprinkles:content";

export default {
    actions: {
        async home() {
            let restaurants = await getCollection("restaurants");

            let items = await Promise.all(
                restaurants.map(async restaurant => {
                    let { Content } = await render(restaurant);
                    return { data: restaurant.data, Content };
                }),
            );

            return render(
                <html>
                    <body>
                        {items.map(({ Content }) => (
                            <Content />
                        ))}
                    </body>
                </html>,
            );
        },
    },
};
```

### MDX Plugin Setup

Both adapters require `@mdx-js/rollup` to be installed separately and added to your Vite config. The content layer plugin serves raw MDX as virtual modules; `@mdx-js/rollup` compiles them into components.

| Framework | MDX Config                                    |
| --------- | --------------------------------------------- |
| React     | `mdx()`                                       |
| Remix     | `mdx({ jsxImportSource: "remix/component" })` |

The plugin order matters — `contentLayer()` must come before `mdx()` so that virtual MDX modules are available for compilation.

## How It Works

1. On build start (and on file changes during dev), the plugin loads your content config and runs each collection's loader
2. Loaders read files, parse frontmatter/data, validate against schemas, and populate an in-memory store
3. The plugin generates a virtual module (`sprinkles:content`) that inlines the store data and exposes query functions
4. MDX/Markdown bodies are served as virtual modules and imported on demand via `render()`
5. During development, file changes trigger automatic re-loading with HMR

## License

[MIT](LICENSE)
