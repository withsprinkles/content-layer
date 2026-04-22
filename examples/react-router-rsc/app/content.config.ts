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
