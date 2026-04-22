import type { StandardSchemaV1 } from "@standard-schema/spec";

import { expectTypeOf, test } from "vite-plus/test";

import type { InferSchemaOutput, ResolveSchema, SchemaContext } from "./index.ts";

import { reference, type ReferenceSchema } from "./index.ts";

type BlogSchema = StandardSchemaV1<unknown, { title: string; publishedAt: Date }>;

test("InferSchemaOutput extracts Standard Schema output type", () => {
    expectTypeOf<InferSchemaOutput<BlogSchema>>().toEqualTypeOf<{
        title: string;
        publishedAt: Date;
    }>();
});

test("InferSchemaOutput returns never when types are missing", () => {
    type NoTypes = { "~standard": { version: 1; vendor: string } };
    expectTypeOf<InferSchemaOutput<NoTypes>>().toBeNever();
});

test("ResolveSchema passes through direct schemas", () => {
    expectTypeOf<ResolveSchema<BlogSchema>>().toEqualTypeOf<BlogSchema>();
});

test("ResolveSchema unwraps function-form schemas", () => {
    type FnSchema = (ctx: SchemaContext) => BlogSchema;
    expectTypeOf<ResolveSchema<FnSchema>>().toEqualTypeOf<BlogSchema>();
});

test("reference<C>() preserves the collection literal type", () => {
    let schema = reference("authors");
    expectTypeOf(schema).toEqualTypeOf<ReferenceSchema<"authors">>();
});

test("reference<C>() output type carries the collection literal", () => {
    let schema = reference("authors");
    expectTypeOf<StandardSchemaV1.InferOutput<typeof schema>>().toEqualTypeOf<{
        collection: "authors";
        id: string;
    }>();
});
