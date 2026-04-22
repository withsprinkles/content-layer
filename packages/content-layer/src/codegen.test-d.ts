import type { StandardSchemaV1 } from "@standard-schema/spec";

import { expectTypeOf, test } from "vite-plus/test";

import type { DataEntry, InferSchemaOutput, MarkdownHeading, ResolveSchema } from "./types.ts";

import { reference, type ReferenceSchema } from "./index.ts";

// These types mirror the declare-module block produced by
// generateTypes() in codegen.ts. Drift between this fixture and the
// real emitted output is guarded by the "references schema helpers from
// @withsprinkles/content-layer" test in codegen.test.ts — if the guard
// fails, the fixture below is wrong too.

type TestCollections = {
    blog: {
        schema: StandardSchemaV1<
            unknown,
            {
                title: string;
                publishedAt: Date;
                author: { collection: "authors"; id: string };
            }
        >;
    };
    authors: {
        schema: () => StandardSchemaV1<unknown, { name: string; email: string }>;
    };
};

interface TestContentEntryMap {
    blog: {
        [id: string]: DataEntry<
            InferSchemaOutput<ResolveSchema<TestCollections["blog"]["schema"]>>
        > & {
            collection: "blog";
        };
    };
    authors: {
        [id: string]: DataEntry<
            InferSchemaOutput<ResolveSchema<TestCollections["authors"]["schema"]>>
        > & {
            collection: "authors";
        };
    };
}

type Flatten<T> = T extends { [K: string]: infer U } ? U : never;
type CollectionKey = keyof TestContentEntryMap;
type CollectionEntry<C extends CollectionKey> = Flatten<TestContentEntryMap[C]>;
type ReferenceContentEntry<C extends CollectionKey> = { collection: C; id: string };

declare function getCollection<C extends CollectionKey>(
    collection: C,
    filter?: (entry: CollectionEntry<C>) => unknown,
): Promise<CollectionEntry<C>[]>;

declare function getEntry<C extends CollectionKey>(
    collection: C,
    slug: string,
): Promise<CollectionEntry<C> | undefined>;
declare function getEntry<C extends CollectionKey>(
    entry: ReferenceContentEntry<C>,
): Promise<CollectionEntry<C> | undefined>;

declare function getEntries<C extends CollectionKey>(
    entries: ReferenceContentEntry<C>[],
): Promise<CollectionEntry<C>[]>;

declare function render<C extends CollectionKey>(
    entry: CollectionEntry<C>,
): Promise<{ Content: unknown; headings: MarkdownHeading[] }>;

type BlogEntry = CollectionEntry<"blog">;
type AuthorEntry = CollectionEntry<"authors">;

test("Standard Schema output propagates into entry.data for direct schemas", () => {
    expectTypeOf<BlogEntry["data"]>().toEqualTypeOf<{
        title: string;
        publishedAt: Date;
        author: { collection: "authors"; id: string };
    }>();
});

test("Function-form schemas are unwrapped before inference", () => {
    expectTypeOf<AuthorEntry["data"]>().toEqualTypeOf<{
        name: string;
        email: string;
    }>();
});

test("entry.collection stays a string literal, not widened to string", () => {
    expectTypeOf<BlogEntry["collection"]>().toEqualTypeOf<"blog">();
    expectTypeOf<AuthorEntry["collection"]>().toEqualTypeOf<"authors">();
});

test("getCollection propagates the CollectionEntry shape through the promise", async () => {
    let entries = await getCollection("blog");
    expectTypeOf(entries).toEqualTypeOf<BlogEntry[]>();
    expectTypeOf(entries[0]!.data).toEqualTypeOf<{
        title: string;
        publishedAt: Date;
        author: { collection: "authors"; id: string };
    }>();
});

test("getEntry by collection+slug returns the matching entry type", async () => {
    let entry = await getEntry("authors", "jane");
    expectTypeOf(entry).toEqualTypeOf<AuthorEntry | undefined>();
});

test("getEntry by reference narrows to the target collection's entry type", async () => {
    let entry = await getEntry({ collection: "authors", id: "jane" });
    expectTypeOf(entry).toEqualTypeOf<AuthorEntry | undefined>();
});

test("getEntries returns entries narrowed to the reference collection", async () => {
    let entries = await getEntries([{ collection: "blog", id: "hello" }]);
    expectTypeOf(entries).toEqualTypeOf<BlogEntry[]>();
});

test("render accepts any CollectionEntry and returns Content + headings", () => {
    expectTypeOf(render).parameter(0).toExtend<BlogEntry | AuthorEntry>();
    expectTypeOf(render).returns.resolves.toEqualTypeOf<{
        Content: unknown;
        headings: MarkdownHeading[];
    }>();
});

test("reference() is assignable into the referenced field's data slot", () => {
    let authorRef = reference("authors");
    expectTypeOf(authorRef).toEqualTypeOf<ReferenceSchema<"authors">>();

    // The author field on a blog entry is { collection: "authors"; id: string } —
    // the same shape reference("authors") validates into.
    expectTypeOf<BlogEntry["data"]["author"]>().toEqualTypeOf<{
        collection: "authors";
        id: string;
    }>();
});
