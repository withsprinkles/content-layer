import type { CollectionKey } from "sprinkles:content";

import { defineCollection } from "@withsprinkles/content-layer";
import { file, glob } from "@withsprinkles/content-layer/loaders";
import * as v from "valibot";

function reference<C extends CollectionKey>(collection: C) {
    return v.pipe(
        v.string(),
        v.transform(id => ({ collection, id })),
    );
}

let authors = defineCollection({
    loader: file("src/content/authors.json"),
    schema: v.object({
        id: v.string(),
        name: v.string(),
        avatar: v.string(),
    }),
});

let blog = defineCollection({
    loader: glob({ pattern: "**/*.mdx", base: "src/content/blog" }),
    schema: v.object({
        title: v.string(),
        summary: v.string(),
        publishedOn: v.date(),
        author: reference("authors"),
    }),
});

export let collections = { authors, blog };
