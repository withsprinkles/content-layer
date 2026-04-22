import type { CollectionKey } from "sprinkles:content";

import { defineCollection } from "@withsprinkles/content-layer";
import { file, glob } from "@withsprinkles/content-layer/loaders";
import { type } from "arktype";

function reference<C extends CollectionKey>(collection: C) {
    return type("string").pipe(id => ({ collection, id }));
}

let authors = defineCollection({
    loader: file("src/content/authors.json"),
    schema: type({
        id: "string",
        name: "string",
        avatar: "string",
    }),
});

let blog = defineCollection({
    loader: glob({ pattern: "**/*.mdx", base: "src/content/blog" }),
    schema: type({
        title: "string",
        summary: "string",
        publishedOn: "string.date.parse | Date",
        author: reference("authors"),
    }),
});

export let collections = { authors, blog };
