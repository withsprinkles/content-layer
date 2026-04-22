import type { CollectionKey } from "sprinkles:content";

import { defineCollection } from "@withsprinkles/content-layer";
import { file, glob } from "@withsprinkles/content-layer/loaders";
import { z } from "zod";

function reference<C extends CollectionKey>(collection: C) {
    return z.string().transform(id => ({ collection, id }));
}

let authors = defineCollection({
    loader: file("src/content/authors.json"),
    schema: z.object({
        id: z.string(),
        name: z.string(),
        avatar: z.string(),
    }),
});

let blog = defineCollection({
    loader: glob({ pattern: "**/*.mdx", base: "src/content/blog" }),
    schema: z.object({
        title: z.string(),
        summary: z.string(),
        publishedOn: z.coerce.date(),
        author: reference("authors"),
    }),
});

export let collections = { authors, blog };
